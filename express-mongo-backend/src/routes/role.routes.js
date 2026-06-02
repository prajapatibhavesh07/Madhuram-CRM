const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(authenticate);

router.get("/", roleController.getRoles);
router.get("/:id", roleController.getRoleById);
router.post("/", authorize(["Super Admin", "Admin"]), roleController.createRole);
router.put("/:id", authorize(["Super Admin", "Admin"]), roleController.updateRole);
router.delete("/:id", authorize(["Super Admin", "Admin"]), roleController.deleteRole);
router.post("/:id/reset", authorize(["Super Admin", "Admin"]), roleController.resetRole);

module.exports = router;
