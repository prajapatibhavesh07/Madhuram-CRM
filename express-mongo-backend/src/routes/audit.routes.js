const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/AuditLogController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.use(authenticate);
router.use(authorize(['Super Admin', 'Admin']));

router.get('/', auditLogController.getAuditLogs);
router.get('/record/:targetId', auditLogController.getLogsByRecord);

module.exports = router;
