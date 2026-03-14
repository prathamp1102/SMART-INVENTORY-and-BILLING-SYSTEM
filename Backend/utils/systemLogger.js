/**
 * systemLogger.js
 * Call addLog() from any controller to persist an audit event.
 *
 * Usage:
 *   const { addLog } = require("../utils/systemLogger");
 *   await addLog({ type:"USER", severity:"INFO", action:"User Created", detail:user.email });
 */

const SystemLog = require("../models/SystemLogModel");

/**
 * @param {Object} opts
 * @param {"USER"|"INVENTORY"|"SUPPLIER"|"ATTENDANCE"|"SYSTEM"|"BILLING"|"REPORT"} opts.type
 * @param {"INFO"|"SUCCESS"|"WARNING"|"ERROR"} opts.severity
 * @param {string} opts.action   – short verb phrase, e.g. "Product Added"
 * @param {string} opts.detail   – longer description
 * @param {ObjectId|null} opts.user    – user who triggered the event
 * @param {ObjectId|null} opts.branch  – branch context
 * @param {Object}        opts.meta    – any extra key-value data
 * @param {string}        opts.ip      – requester IP
 */
async function addLog(opts = {}) {
  try {
    await SystemLog.create({
      type:      opts.type     || "SYSTEM",
      severity:  opts.severity || "INFO",
      action:    opts.action   || "Event",
      detail:    opts.detail   || "",
      user:      opts.user     || null,
      branch:    opts.branch   || null,
      meta:      opts.meta     || {},
      ip:        opts.ip       || "",
      timestamp: new Date(),
    });
  } catch (err) {
    // Never crash the caller – logging is best-effort
    console.error("[systemLogger] Failed to write log:", err.message);
  }
}

module.exports = { addLog };
