const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/InterviewController');

const authenticate = require('../middleware/authMiddleware');

// Apply authentication to all interview routes
router.use(authenticate);

router.post('/', interviewController.scheduleInterview);
router.get('/', interviewController.getInterviews);
router.get('/:id', interviewController.getInterviewById);
router.put('/:id', interviewController.updateInterview);
router.delete('/:id', interviewController.deleteInterview);

module.exports = router;
