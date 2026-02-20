const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // employee
    purpose: { type: String, required: true, trim: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true }, // "10:30"
    duration: { type: Number, default: 60 }, // in minutes
    location: { type: String, trim: true, default: 'Main Office' },
    department: { type: String, trim: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
    notificationSent: { type: Boolean, default: false },
    inviteToken: { type: String } // unique token for self-registration links
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
