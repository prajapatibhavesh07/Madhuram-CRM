const OfferLetter = require('../models/OfferLetter');
const auditService = require('../services/auditService');

exports.createOffer = async (req, res) => {
    try {
        const offer = new OfferLetter({ ...req.body, createdBy: req.user?._id });
        await offer.save();

        await auditService.logAction(req, {
            action: 'CREATE',
            module: 'Offer',
            targetId: offer._id,
            targetModel: 'OfferLetter',
            details: `Offer letter created for candidate ID: ${offer.candidateId}`
        });

        res.status(201).json(offer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getOffers = async (req, res) => {
    try {
        const offers = await OfferLetter.find()
            .populate('candidateId', 'name email')
            .populate('jobId', 'title')
            .sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateOffer = async (req, res) => {
    try {
        const oldOffer = await OfferLetter.findById(req.params.id);
        const offer = await OfferLetter.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        const changes = auditService.detectChanges(oldOffer, offer);
        if (changes) {
            await auditService.logAction(req, {
                action: 'UPDATE',
                module: 'Offer',
                targetId: offer._id,
                targetModel: 'OfferLetter',
                changes,
                details: `Offer letter updated`
            });
        }

        res.json(offer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteOffer = async (req, res) => {
    try {
        const offer = await OfferLetter.findByIdAndDelete(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        await auditService.logAction(req, {
            action: 'DELETE',
            module: 'Offer',
            targetId: offer._id,
            targetModel: 'OfferLetter',
            details: `Offer letter deleted`
        });

        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMultipleOffers = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Offer IDs are required' });
        }
        await OfferLetter.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Offers deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
