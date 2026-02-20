const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const { protect, authorize } = require('../middleware/auth');
const { createObjectCsvStringifier } = require('csv-writer');

// @route GET /api/dashboard/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalVisitors, totalUsers, totalAppointments, totalPasses,
            todayAppointments, pendingAppointments, todayCheckins,
            activePassCount, monthlyVisitors
        ] = await Promise.all([
            Visitor.countDocuments(),
            User.countDocuments({ isActive: true }),
            Appointment.countDocuments(),
            Pass.countDocuments(),
            Appointment.countDocuments({ scheduledDate: { $gte: todayStart, $lte: todayEnd } }),
            Appointment.countDocuments({ status: 'pending' }),
            CheckLog.countDocuments({ timestamp: { $gte: todayStart, $lte: todayEnd }, type: 'check-in' }),
            Pass.countDocuments({ status: 'active' }),
            Visitor.countDocuments({ createdAt: { $gte: thisMonthStart } })
        ]);

        // Visitors per day (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const start = new Date(d); start.setHours(0, 0, 0, 0);
            const end = new Date(d); end.setHours(23, 59, 59, 999);
            const count = await CheckLog.countDocuments({ timestamp: { $gte: start, $lte: end }, type: 'check-in' });
            last7Days.push({ date: start.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }), count });
        }

        // Status distribution
        const statusCounts = await Appointment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Role distribution
        const roleCounts = await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalVisitors, totalUsers, totalAppointments, totalPasses,
                todayAppointments, pendingAppointments, todayCheckins,
                activePassCount, monthlyVisitors, last7Days, statusCounts, roleCounts
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/dashboard/recent — recent activities
router.get('/recent', protect, authorize('admin', 'security'), async (req, res) => {
    try {
        const recentLogs = await CheckLog.find()
            .populate('visitor', 'name email photo')
            .sort({ timestamp: -1 })
            .limit(10);
        const recentAppointments = await Appointment.find()
            .populate('visitor', 'name email')
            .populate('host', 'name')
            .sort({ createdAt: -1 })
            .limit(5);
        res.json({ success: true, recentLogs, recentAppointments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/dashboard/export — export visitors CSV
router.get('/export', protect, authorize('admin'), async (req, res) => {
    try {
        const { from, to } = req.query;
        const filter = {};
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const visitors = await Visitor.find(filter).lean();
        const appointments = await Appointment.find(filter)
            .populate('visitor', 'name email phone')
            .populate('host', 'name department')
            .lean();

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'name', title: 'Visitor Name' },
                { id: 'email', title: 'Email' },
                { id: 'phone', title: 'Phone' },
                { id: 'company', title: 'Company' },
                { id: 'purpose', title: 'Purpose' },
                { id: 'host', title: 'Host' },
                { id: 'date', title: 'Visit Date' },
                { id: 'status', title: 'Status' }
            ]
        });

        const records = appointments.map(a => ({
            name: a.visitor?.name || '',
            email: a.visitor?.email || '',
            phone: a.visitor?.phone || '',
            company: a.visitor?.company || '',
            purpose: a.purpose || '',
            host: a.host?.name || '',
            date: a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString('en-IN') : '',
            status: a.status || ''
        }));

        const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=visitors-report.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
