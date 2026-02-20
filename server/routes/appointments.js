const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Visitor = require('../models/Visitor');
const { protect, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

// @route GET /api/appointments
router.get('/', protect, async (req, res) => {
    try {
        const { status, search, from, to, page = 1, limit = 20 } = req.query;
        const filter = {};

        // Employees see only their appointments
        if (req.user.role === 'employee') filter.host = req.user._id;

        if (status) filter.status = status;
        if (from || to) {
            filter.scheduledDate = {};
            if (from) filter.scheduledDate.$gte = new Date(from);
            if (to) filter.scheduledDate.$lte = new Date(to);
        }

        const appointments = await Appointment.find(filter)
            .populate('visitor', 'name email phone photo')
            .populate('host', 'name email department')
            .populate('approvedBy', 'name')
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ scheduledDate: -1 });

        const total = await Appointment.countDocuments(filter);
        res.json({ success: true, appointments, total });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/appointments/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const appt = await Appointment.findById(req.params.id)
            .populate('visitor')
            .populate('host', 'name email department phone')
            .populate('approvedBy', 'name');
        if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
        res.json({ success: true, appointment: appt });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/appointments — create appointment (employee or admin)
router.post('/', protect, authorize('admin', 'employee'), async (req, res) => {
    try {
        const { visitorId, purpose, scheduledDate, scheduledTime, duration, location, department, notes } = req.body;

        const visitor = await Visitor.findById(visitorId);
        if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

        const inviteToken = uuidv4();
        const appointment = await Appointment.create({
            visitor: visitorId,
            host: req.user._id,
            purpose,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            duration: duration || 60,
            location: location || 'Main Office',
            department: department || req.user.department,
            notes,
            inviteToken
        });

        // Auto-approve if created by admin
        if (req.user.role === 'admin') {
            appointment.status = 'approved';
            appointment.approvedBy = req.user._id;
            appointment.approvedAt = new Date();
            await appointment.save();
        }

        // Send notification email to visitor
        try {
            await emailService.sendInviteEmail(visitor.email, visitor.name, {
                host: req.user.name,
                date: scheduledDate,
                time: scheduledTime,
                purpose,
                location: location || 'Main Office'
            });
            appointment.notificationSent = true;
            await appointment.save();
        } catch (emailErr) {
            console.log('Email notification failed:', emailErr.message);
        }

        const populated = await Appointment.findById(appointment._id)
            .populate('visitor', 'name email phone')
            .populate('host', 'name email');

        res.status(201).json({ success: true, appointment: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/appointments/:id/status — approve or reject
router.put('/:id/status', protect, authorize('admin', 'employee'), async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const appt = await Appointment.findById(req.params.id).populate('visitor');
        if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

        // Employees can only approve their own
        if (req.user.role === 'employee' && appt.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        appt.status = status;
        if (status === 'approved') {
            appt.approvedBy = req.user._id;
            appt.approvedAt = new Date();
        }
        if (status === 'rejected') appt.rejectionReason = rejectionReason;
        await appt.save();

        // Send status email
        try {
            await emailService.sendStatusUpdateEmail(appt.visitor.email, appt.visitor.name, status, rejectionReason);
        } catch (e) { console.log('Email error:', e.message); }

        res.json({ success: true, appointment: appt });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route DELETE /api/appointments/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        await Appointment.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Appointment deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
