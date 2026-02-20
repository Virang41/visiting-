const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const passSchema = new mongoose.Schema({
    passId: { type: String, default: () => uuidv4(), unique: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    qrCode: { type: String }, // base64 QR image
    qrData: { type: String }, // JSON string encoded in QR
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    status: {
        type: String,
        enum: ['active', 'used', 'expired', 'revoked'],
        default: 'active'
    },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: { type: String, default: 'Main Office' },
    accessAreas: [{ type: String }] // array of allowed areas
}, { timestamps: true });

// Auto-expire check
passSchema.methods.isValid = function () {
    const now = new Date();
    return this.status === 'active' && now >= this.validFrom && now <= this.validTo;
};

module.exports = mongoose.model('Pass', passSchema);
