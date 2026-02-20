const express = require('express');
const router = express.Router();
const Pass = require('../models/Pass');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');
const qrService = require('../services/qrService');
const pdfService = require('../services/pdfService');

// @route GET /api/passes
router.get('/', protect, authorize('admin', 'security'), async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const passes = await Pass.find(filter)
            .populate('visitor', 'name email phone photo')
            .populate('host', 'name department')
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        const total = await Pass.countDocuments(filter);
        res.json({ success: true, passes, total });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/passes/my — visitor sees their own passes
router.get('/my', protect, async (req, res) => {
    try {
        const passes = await Pass.find({ visitor: req.user._id })
            .populate('appointment')
            .populate('host', 'name department')
            .sort({ createdAt: -1 });
        res.json({ success: true, passes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/passes/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const pass = await Pass.findById(req.params.id)
            .populate('visitor')
            .populate('host', 'name email department')
            .populate('appointment');
        if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });
        res.json({ success: true, pass });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/passes/verify/:passId — verify pass by UUID (for QR scan)
router.get('/verify/:passId', protect, async (req, res) => {
    try {
        const pass = await Pass.findOne({ passId: req.params.passId })
            .populate('visitor', 'name email phone photo')
            .populate('host', 'name department');
        if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

        const now = new Date();
        const isValid = pass.status === 'active' && now >= pass.validFrom && now <= pass.validTo;
        res.json({ success: true, pass, isValid });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/passes/issue/:appointmentId — issue a pass
router.post('/issue/:appointmentId', protect, authorize('admin', 'security', 'employee'), async (req, res) => {
    try {
        const appt = await Appointment.findById(req.params.appointmentId)
            .populate('visitor')
            .populate('host');

        if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
        if (appt.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Appointment must be approved before issuing a pass' });
        }

        // Check if pass already exists
        const existing = await Pass.findOne({ appointment: appt._id, status: 'active' });
        if (existing) return res.json({ success: true, pass: existing, message: 'Pass already exists' });

        // Set validity window
        const scheduledDateTime = new Date(appt.scheduledDate);
        const [hours, minutes] = appt.scheduledTime.split(':').map(Number);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        const validFrom = new Date(scheduledDateTime.getTime() - 30 * 60000); // 30 min before
        const validTo = new Date(scheduledDateTime.getTime() + (appt.duration + 60) * 60000); // duration + 1hr

        // Create pass first to get passId
        const pass = new Pass({
            appointment: appt._id,
            visitor: appt.visitor._id,
            host: appt.host._id,
            validFrom,
            validTo,
            issuedBy: req.user._id,
            location: appt.location,
            accessAreas: ['Main Lobby', 'Meeting Room', appt.location]
        });

        // Generate QR data
        const qrData = JSON.stringify({
            passId: pass.passId,
            visitorName: appt.visitor.name,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString()
        });
        pass.qrData = qrData;
        pass.qrCode = await qrService.generateQR(qrData);
        await pass.save();

        // Update appointment status
        appt.status = 'completed';
        await appt.save();

        // Update visitor count
        await appt.visitor.constructor.findByIdAndUpdate(appt.visitor._id, { $inc: { visitCount: 1 } });

        const populated = await Pass.findById(pass._id)
            .populate('visitor', 'name email phone photo company')
            .populate('host', 'name department')
            .populate('appointment', 'purpose scheduledDate scheduledTime location');

        res.status(201).json({ success: true, pass: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/passes/:id/pdf — download PDF badge
router.get('/:id/pdf', protect, async (req, res) => {
    try {
        const pass = await Pass.findById(req.params.id)
            .populate('visitor')
            .populate('host', 'name department');
        if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=visitor-pass-${pass.passId.slice(0, 8)}.pdf`);
        await pdfService.generatePassPDF(pass, res);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/passes/:id/revoke
router.put('/:id/revoke', protect, authorize('admin', 'security'), async (req, res) => {
    try {
        const pass = await Pass.findByIdAndUpdate(req.params.id, { status: 'revoked' }, { new: true });
        res.json({ success: true, pass });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
