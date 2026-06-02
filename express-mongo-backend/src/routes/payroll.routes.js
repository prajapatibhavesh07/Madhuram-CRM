const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/generate', payrollController.generatePayroll);
router.get('/', payrollController.getPayrolls);
router.get('/:id/pdf', payrollController.downloadPdf);
router.patch('/:id/status', payrollController.updateStatus);
router.delete('/:id', payrollController.deletePayroll);

module.exports = router;
