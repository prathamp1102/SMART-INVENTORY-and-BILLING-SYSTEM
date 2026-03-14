/**
 * branchScope middleware
 *
 * For ADMIN role: scopes queries to their assigned branch.
 *   - If the admin has no branch, returns 403 with a clear message.
 * For SUPER_ADMIN: no restriction — they see all data.
 * For STAFF / others: scoped to their branch if assigned, else no filter.
 *
 * IMPORTANT: The JWT stores branch at login time.
 * If a branch is assigned AFTER login, the user must re-login to pick it up.
 */
const UserModel = require("../models/Usermodel");

const branchScope = async (req, res, next) => {
  const { role, id, branch } = req.user || {};

  if (role === "ADMIN") {
    // branch may be stale in JWT — re-fetch from DB for accuracy
    let resolvedBranch = branch;

    if (!resolvedBranch) {
      try {
        const freshUser = await UserModel.findById(id).select("branch").lean();
        resolvedBranch = freshUser?.branch || null;
      } catch (_) { /* db error — fall through */ }
    }

    if (!resolvedBranch) {
      return res.status(403).json({
        message: "Admin has no branch assigned. Ask your Super Admin to assign you to a branch first.",
        code: "NO_BRANCH_ASSIGNED",
      });
    }

    req.branchFilter = { branch: resolvedBranch };
    req.userBranch   = resolvedBranch;

  } else if (role === "SUPER_ADMIN") {
    // No restriction — see everything
    req.branchFilter = {};
    req.userBranch   = null;

  } else {
    // STAFF, CUSTOMER, etc. — scope to their branch if they have one
    // Re-fetch from DB in case branch was assigned after login (same as ADMIN logic)
    let resolvedBranch = branch;
    if (!resolvedBranch) {
      try {
        const freshUser = await UserModel.findById(id).select("branch").lean();
        resolvedBranch = freshUser?.branch || null;
      } catch (_) { /* db error — fall through */ }
    }
    req.branchFilter = resolvedBranch ? { branch: resolvedBranch } : {};
    req.userBranch   = resolvedBranch || null;
  }

  next();
};

module.exports = branchScope;
