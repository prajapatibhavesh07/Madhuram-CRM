const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const authenticate = require('../middleware/authMiddleware');
const { authorizeModule } = require('../middleware/roleMiddleware');

// Apply authentication to all workflow routes
router.use(authenticate);

// Publicly readable within system (Recruiters, Managers etc. can read & resolve)
router.get('/', workflowController.getWorkflows);
router.get('/resolve', workflowController.resolveWorkflow);
router.get('/:id', workflowController.getWorkflowById);

// Dynamic settings-module restricted CRUD operations for workflow configurations
router.post('/', authorizeModule('settings', 'create'), workflowController.createWorkflow);
router.put('/:id', authorizeModule('settings', 'edit'), workflowController.updateWorkflow);
router.delete('/:id', authorizeModule('settings', 'delete'), workflowController.deleteWorkflow);
router.post('/:id/duplicate', authorizeModule('settings', 'create'), workflowController.duplicateWorkflow);

module.exports = router;
