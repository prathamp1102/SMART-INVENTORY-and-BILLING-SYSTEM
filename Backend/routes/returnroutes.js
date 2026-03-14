const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");
const ctrl = require("../controllers/returncontroller");

router.post("/",     protect, branchScope, ctrl.createReturn);
router.get("/",      protect, branchScope, ctrl.getReturns);
router.get("/:id",   protect, branchScope, ctrl.getReturn);
router.put("/:id",   protect, branchScope, ctrl.updateReturn);
router.delete("/:id",protect, authorize("ADMIN","SUPER_ADMIN"), branchScope, ctrl.deleteReturn);

module.exports = router;
