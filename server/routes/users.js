const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// All user management routes require admin
// @route GET /api/users
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (search) filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];

        const users = await User.find(filter)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        const total = await User.countDocuments(filter);
        res.json({ success: true, users, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/users/employees — for dropdowns (employee list)
router.get('/employees', protect, async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee', isActive: true }).select('name email department');
        res.json({ success: true, employees });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/users
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, email, password, role, phone, department } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
        const user = await User.create({ name, email, password, role, phone, department });
        res.status(201).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/users/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, email, role, phone, department, isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, phone, department, isActive },
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        await User.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
