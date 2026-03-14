const path    = require("path");
const fs      = require("fs");
const { exec } = require("child_process");
const { BackupConfigModel, BackupHistoryModel } = require("../models/BackupModel");

/* ── Backup storage directory ───────────────────────────────── */
const BACKUP_DIR = path.join(__dirname, "../backups");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

/* ── Helper: get-or-create backup config singleton ─────────── */
async function getOrCreateConfig() {
  let config = await BackupConfigModel.findOne();
  if (!config) config = await BackupConfigModel.create({});
  return config;
}

/* ── Helper: human-readable file size ───────────────────────── */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Helper: run a mongodump and return the output path ─────── */
function runMongoDump(filename) {
  return new Promise((resolve, reject) => {
    const mongoUri  = process.env.MONGO_URI;
    const outPath   = path.join(BACKUP_DIR, filename);
    // mongodump outputs a directory; archive flag streams to a .gz file
    const cmd = `mongodump --uri="${mongoUri}" --archive="${outPath}" --gzip`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(outPath);
    });
  });
}

/* ── Helper: apply retention policy (delete old backups) ────── */
async function applyRetention(retentionDays) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const old    = await BackupHistoryModel.find({ createdAt: { $lt: cutoff }, status: "success" });
  for (const record of old) {
    const filePath = path.join(BACKUP_DIR, record.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await record.deleteOne();
  }
}

/* ═══════════════════════════════════════════════════════════════
   API HANDLERS
═══════════════════════════════════════════════════════════════ */

/* ── POST /api/settings/backup  (manual trigger) ────────────── */
exports.triggerBackup = async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename  = `backup-${timestamp}.gz`;

  try {
    const outPath = await runMongoDump(filename);
    const stats   = fs.statSync(outPath);
    const history = await BackupHistoryModel.create({
      filename,
      sizeBytes: stats.size,
      type:      "manual",
      status:    "success",
    });

    // Apply retention policy
    const config = await getOrCreateConfig();
    await applyRetention(config.retentionDays);

    res.status(201).json({
      message: "Backup created successfully",
      backup:  {
        id:        history._id,
        filename,
        size:      formatSize(stats.size),
        type:      "manual",
        status:    "success",
        createdAt: history.createdAt,
      },
    });
  } catch (err) {
    // Log the failure
    await BackupHistoryModel.create({
      filename,
      sizeBytes: 0,
      type:      "manual",
      status:    "failed",
      errorMsg:  err.message,
    });
    res.status(500).json({ message: `Backup failed: ${err.message}` });
  }
};

/* ── GET /api/settings/backup/history ───────────────────────── */
exports.getBackupHistory = async (req, res) => {
  try {
    const records = await BackupHistoryModel.find()
      .sort({ createdAt: -1 })
      .limit(20);

    const history = records.map((r) => ({
      id:        r._id,
      filename:  r.filename,
      size:      formatSize(r.sizeBytes),
      type:      r.type,
      status:    r.status,
      errorMsg:  r.errorMsg,
      date:      r.createdAt,
    }));

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/settings/backup/:id/download ──────────────────── */
exports.downloadBackup = async (req, res) => {
  try {
    const record = await BackupHistoryModel.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Backup record not found" });

    const filePath = path.join(BACKUP_DIR, record.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file no longer exists on disk" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${record.filename}"`);
    res.setHeader("Content-Type", "application/gzip");
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/settings/restore ─────────────────────────────── */
exports.restoreBackup = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No backup file uploaded" });
    }

    const uploadedPath = req.file.path;
    const mongoUri     = process.env.MONGO_URI;
    const cmd          = `mongorestore --uri="${mongoUri}" --archive="${uploadedPath}" --gzip --drop`;

    exec(cmd, async (error, stdout, stderr) => {
      // Clean up the uploaded temp file
      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);

      if (error) {
        return res.status(500).json({ message: `Restore failed: ${stderr || error.message}` });
      }
      res.json({ message: "Database restored successfully from backup" });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/settings/backup/config ────────────────────────── */
exports.getBackupConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/settings/backup/config ────────────────────────── */
exports.saveBackupConfig = async (req, res) => {
  try {
    const fields = ["autoEnabled", "frequency", "backupTime", "retentionDays", "storageLocation"];
    const config = await getOrCreateConfig();
    fields.forEach((f) => {
      if (req.body[f] !== undefined) config[f] = req.body[f];
    });
    await config.save();

    // Reschedule the cron job with the new settings
    const { rescheduleBackupCron } = require("../utils/backupScheduler");
    rescheduleBackupCron(config);

    res.json({ message: "Backup configuration saved successfully", config });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Exported for use by the cron scheduler ─────────────────── */
exports.runAutoBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename  = `auto-backup-${timestamp}.gz`;
  try {
    const outPath = await runMongoDump(filename);
    const stats   = fs.statSync(outPath);
    await BackupHistoryModel.create({
      filename,
      sizeBytes: stats.size,
      type:      "auto",
      status:    "success",
    });
    const config = await getOrCreateConfig();
    await applyRetention(config.retentionDays);
    console.log(`[AutoBackup] ✅ ${filename} (${formatSize(stats.size)})`);
  } catch (err) {
    await BackupHistoryModel.create({
      filename,
      sizeBytes: 0,
      type:      "auto",
      status:    "failed",
      errorMsg:  err.message,
    });
    console.error(`[AutoBackup] ❌ ${err.message}`);
  }
};
