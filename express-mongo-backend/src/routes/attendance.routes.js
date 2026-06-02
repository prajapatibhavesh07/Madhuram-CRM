const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protect all routes

router.post('/punch-in', attendanceController.punchIn);
router.post('/punch-out', attendanceController.punchOut);
router.get('/', attendanceController.getAllAttendance); // Should verify Admin role usually, keeping simple for now
router.get('/my-history', attendanceController.getMyAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
