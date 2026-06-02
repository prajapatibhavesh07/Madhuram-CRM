const express = require('express');
const router = express.Router();
const taskController = require('../controllers/TaskController');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.get('/:id/comments', taskController.getTaskComments);
router.post('/:id/comments', taskController.addTaskComment);

module.exports = router;
