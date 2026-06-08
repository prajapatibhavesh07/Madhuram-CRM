const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.use(authenticate);

const allowedRoles = ["Super Admin", "Admin", "Manager", "Team Lead"];

router.post('/', authorize(allowedRoles), templateController.createTemplate);
router.get('/', authorize(allowedRoles), templateController.getTemplates);
router.get('/:id', authorize(allowedRoles), templateController.getTemplateById);
router.put('/:id', authorize(allowedRoles), templateController.updateTemplate);
router.delete('/:id', authorize(allowedRoles), templateController.deleteTemplate);

module.exports = router;
