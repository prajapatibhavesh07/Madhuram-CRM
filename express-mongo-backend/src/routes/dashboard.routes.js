const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const authenticate = require("../middleware/authMiddleware");
const fs = require("fs");

router.get("/stats", authenticate, dashboardController.getStats);

router.post("/log-diagnostic", (req, res) => {
    try {
        fs.writeFileSync('d:\\crm\\diagnostic.json', JSON.stringify(req.body, null, 2));
        console.log('Diagnostic log written to d:\\crm\\diagnostic.json');
        res.json({ ok: true });
    } catch (e) {
        console.error('Failed to write diagnostic:', e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
