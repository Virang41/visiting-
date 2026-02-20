const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
    pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    type: { type: String, enum: ['check-in', 'check-out'], required: true },
    timestamp: { type: Date, default: Date.now },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // security
    location: { type: String, default: 'Main Entrance' },
    remarks: { type: String },
    method: { type: String, enum: ['qr_scan', 'manual'], default: 'qr_scan' },
    ipAddress: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CheckLog', checkLogSchema);
