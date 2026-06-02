const express = require('express');
const router = express.Router();
const offerController = require('../controllers/OfferController');

router.post('/', offerController.createOffer);
router.get('/', offerController.getOffers);
router.put('/:id', offerController.updateOffer);
router.delete('/:id', offerController.deleteOffer);
router.post('/bulk-delete', offerController.deleteMultipleOffers);

module.exports = router;
