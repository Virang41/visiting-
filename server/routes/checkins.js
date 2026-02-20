const express = require('express');
const router = express.Router();
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/checkins
router.get('/', protect, authorize('admin', 'security'), async (req, res) => {
    try {
        const { from, to, type, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (from || to) {
            filter.timestamp = {};
            if (from) filter.timestamp.$gte = new Date(from);
            if (to) filter.timestamp.$lte = new Date(to);
        }

        const logs = await CheckLog.find(filter)
            .populate('visitor', 'name email phone photo')
            .populate('pass', 'passId validFrom validTo')
            .populate('scannedBy', 'name')
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ timestamp: -1 });

        const total = await CheckLog.countDocuments(filter);
        res.json({ success: true, logs, total });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/checkins/scan — QR scan check-in/out
router.post('/scan', protect, authorize('admin', 'security'), async (req, res) => {
    try {
        const { passId, location, method = 'qr_scan', remarks } = req.body;

        const pass = await Pass.findOne({ passId })
            .populate('visitor')
            .populate('host', 'name');

        if (!pass) return res.status(404).json({ success: false, message: 'Pass not found. Invalid QR code.' });

        // Validity check
        const now = new Date();
        if (pass.status === 'revoked') return res.status(400).json({ success: false, message: 'Pass has been revoked.' });
        if (pass.status === 'expired' || now > pass.validTo) {
            pass.status = 'expired';
            await pass.save();
            return res.status(400).json({ success: false, message: 'Pass has expired.' });
        }
        if (now < pass.validFrom) return res.status(400).json({ success: false, message: 'Pass is not valid yet.' });

        // Determine check-in or check-out
        const lastLog = await CheckLog.findOne({ pass: pass._id }).sort({ timestamp: -1 });
        const type = (!lastLog || lastLog.type === 'check-out') ? 'check-in' : 'check-out';

        const log = await CheckLog.create({
            pass: pass._id,
            visitor: pass.visitor._id,
            type,
            scannedBy: req.user._id,
            location: location || 'Main Entrance',
            method,
            remarks,
            ipAddress: req.ip
        });

        if (type === 'check-in') {
            pass.status = 'used';
            await pass.save();
        }

        const populated = await CheckLog.findById(log._id)
            .populate('visitor', 'name email photo')
            .populate('scannedBy', 'name');

        res.json({ success: true, log: populated, type, visitor: pass.visitor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/checkins/manual — manual check-in by visitor name/phone
router.post('/manual', protect, authorize('admin', 'security'), async (req, res) => {
    try {
        const { passId, location, remarks } = req.body;
        return await handleCheckin(req, res, passId, location, 'manual', remarks);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/checkins/today
router.get('/today', protect, authorize('admin', 'security'), async (req, res) => {
    try {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        const logs = await CheckLog.find({ timestamp: { $gte: start, $lte: end } })
            .populate('visitor', 'name email phone photo')
            .populate('scannedBy', 'name')
            .sort({ timestamp: -1 });
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
