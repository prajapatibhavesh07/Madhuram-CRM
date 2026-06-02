const express = require("express");
const router = express.Router();
const optionController = require("../controllers/option.controller");
const authenticate = require("../middleware/authMiddleware");

// Should probably be authenticated to add options, but maybe public to view? 
// For now, let's keep it authenticated for both to be safe.
router.get("/", authenticate, optionController.getOptions);
router.post("/", authenticate, optionController.addOption);

module.exports = router;
