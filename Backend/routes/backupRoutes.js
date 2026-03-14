const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const { protect, authorize } = require("../middlewares/rolemiddleware");
const ctrl    = require("../controllers/backupController");

const SA = "SUPER_ADMIN";

/* ── Multer: accept only .gz backup files (temp storage) ────── */
const upload = multer({
  dest: path.join(__dirname, "../backups/temp"),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [".gz", ".zip", ".sql"];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error("Only .gz, .zip, or .sql backup files are accepted"));
  },
});

router.use(protect, authorize(SA));

router.post("/",                 ctrl.triggerBackup);               // POST /api/settings/backup
router.get("/history",           ctrl.getBackupHistory);            // GET  /api/settings/backup/history
router.get("/config",            ctrl.getBackupConfig);             // GET  /api/settings/backup/config
router.put("/config",            ctrl.saveBackupConfig);            // PUT  /api/settings/backup/config
router.get("/:id/download",      ctrl.downloadBackup);              // GET  /api/settings/backup/:id/download
router.post("/restore",          upload.single("backup"), ctrl.restoreBackup); // POST /api/settings/backup/restore

module.exports = router;
