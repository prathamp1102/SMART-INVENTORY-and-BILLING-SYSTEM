/**
 * backupScheduler.js
 * Manages the automatic database backup cron job.
 * Uses node-cron — install with: npm install node-cron
 */

let cron;
try {
  cron = require("node-cron");
} catch {
  console.warn("[BackupScheduler] node-cron not installed. Run: npm install node-cron");
  cron = null;
}

let currentTask = null; // holds the active scheduled task

/**
 * Convert backup config into a cron expression.
 * backupTime format: "HH:mm"
 */
function buildCronExpression(frequency, backupTime) {
  const [hour, minute] = (backupTime || "02:00").split(":").map(Number);

  switch (frequency) {
    case "hourly":  return `${minute} * * * *`;          // every hour at :MM
    case "daily":   return `${minute} ${hour} * * *`;    // daily at HH:MM
    case "weekly":  return `${minute} ${hour} * * 0`;    // every Sunday
    case "monthly": return `${minute} ${hour} 1 * *`;    // 1st of each month
    default:        return `${minute} ${hour} * * *`;    // fallback: daily
  }
}

/**
 * Start or restart the backup cron job based on config.
 * Called once at server startup and whenever backup config is saved.
 */
function rescheduleBackupCron(config) {
  if (!cron) return;

  // Stop any existing scheduled task
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
    console.log("[BackupScheduler] Previous schedule stopped.");
  }

  if (!config || !config.autoEnabled) {
    console.log("[BackupScheduler] Auto-backup is disabled.");
    return;
  }

  const expression = buildCronExpression(config.frequency, config.backupTime);

  if (!cron.validate(expression)) {
    console.error(`[BackupScheduler] Invalid cron expression: ${expression}`);
    return;
  }

  currentTask = cron.schedule(expression, async () => {
    console.log(`[BackupScheduler] Running auto backup — ${new Date().toISOString()}`);
    const { runAutoBackup } = require("../controllers/backupController");
    await runAutoBackup();
  });

  console.log(
    `[BackupScheduler] ✅ Auto-backup scheduled — ${config.frequency} @ ${config.backupTime} (cron: "${expression}")`
  );
}

/**
 * Bootstrap: load config from DB and start the scheduler.
 * Called once from index.js after DB connects.
 */
async function initBackupScheduler() {
  if (!cron) return;
  try {
    const { BackupConfigModel } = require("../models/BackupModel");
    let config = await BackupConfigModel.findOne();
    if (!config) config = await BackupConfigModel.create({});
    rescheduleBackupCron(config);
  } catch (err) {
    console.error("[BackupScheduler] Failed to initialize:", err.message);
  }
}

module.exports = { rescheduleBackupCron, initBackupScheduler };
