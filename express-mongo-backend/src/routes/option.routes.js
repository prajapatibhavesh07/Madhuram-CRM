const express = require("express");
const router = express.Router();
const optionController = require("../controllers/option.controller");
const authenticate = require("../middleware/authMiddleware");
const { authorizeModule } = require("../middleware/roleMiddleware");

// Retrieve dropdown options (authenticated required)
router.get("/", authenticate, optionController.getOptions);

// Restrict option additions, edits & deletions to settings permissions
router.post("/", authenticate, authorizeModule('settings', 'create'), optionController.addOption);
router.put("/", authenticate, authorizeModule('settings', 'edit'), optionController.updateOption);
router.delete("/", authenticate, authorizeModule('settings', 'delete'), optionController.deleteOption);

module.exports = router;
