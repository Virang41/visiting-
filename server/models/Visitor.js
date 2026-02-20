const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    photo: { type: String, default: '' }, // URL to uploaded photo
    idType: { type: String, enum: ['aadhar', 'pan', 'passport', 'driving_license', 'other'], default: 'other' },
    idNumber: { type: String, trim: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if visitor has account
    visitCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);
