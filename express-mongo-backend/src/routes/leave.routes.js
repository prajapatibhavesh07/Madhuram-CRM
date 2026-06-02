const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/apply', leaveController.applyLeave);
router.get('/', leaveController.getLeaves);
router.get('/my-leaves', leaveController.getMyLeaves);
router.get('/balance', leaveController.getBalance);
router.patch('/:id/status', leaveController.updateStatus);
router.delete('/:id', leaveController.deleteLeave);

module.exports = router;
