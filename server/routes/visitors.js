const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route GET /api/visitors
router.get('/', protect, authorize('admin', 'security', 'employee'), async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (search) filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
        const visitors = await Visitor.find(filter)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        const total = await Visitor.countDocuments(filter);
        res.json({ success: true, visitors, total });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/visitors/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
        res.json({ success: true, visitor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/visitors — register a visitor (with photo)
router.post('/', upload.single('photo'), async (req, res) => {
    try {
        const { name, email, phone, idType, idNumber, company, address } = req.body;
        let photo = '';
        if (req.file) {

            photo = `/uploads/${req.file.filename}`;
        }
        // Check if visitor already exists
        let visitor = await Visitor.findOne({ email });
        if (visitor) {

            // Update existing
            visitor.name = name || visitor.name;
            visitor.phone = phone || visitor.phone;
            visitor.photo = photo || visitor.photo;
            visitor.idType = idType || visitor.idType;
            visitor.idNumber = idNumber || visitor.idNumber;
            visitor.company = company || visitor.company;
            visitor.address = address || visitor.address;
            await visitor.save();
        } else {
            visitor = await Visitor.create({ name, email, phone, photo, idType, idNumber, company, address });
        }
        res.status(201).json({ success: true, visitor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/visitors/:id
router.put('/:id', protect, upload.single('photo'), async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.file) updates.photo = `/uploads/${req.file.filename}`;
        const visitor = await Visitor.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
        res.json({ success: true, visitor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
