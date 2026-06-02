const express = require('express');
const router = express.Router();
const folderController = require('../controllers/FolderController');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', folderController.getFolders);
router.post('/', folderController.createFolder);
router.patch('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);

module.exports = router;
