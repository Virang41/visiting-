const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendOTPEmail } = require('../services/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, department } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

        const user = await User.create({ name, email, password, role: role || 'visitor', phone, department });
        const token = generateToken(user._id);
        res.status(201).json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);
        res.json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/auth/send-otp
// purpose: 'login' or 'reset'
router.post('/send-otp', async (req, res) => {
    try {
        const { email, purpose } = req.body;
        if (!email || !purpose) return res.status(400).json({ success: false, message: 'Email and purpose required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });
        if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otpPurpose = purpose;
        await user.save();

        console.log(`\n📧 OTP for ${email}: ${otp}\n`);

        // Return OTP + name so frontend can send email via EmailJS browser
        res.json({
            success: true,
            message: `OTP generated for ${email}`,
            otp,
            userName: user.name
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/auth/verify-otp-login
// Verify OTP and return JWT token (OTP login)
router.post('/verify-otp-login', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

        const user = await User.findOne({ email }).select('+otp +otpExpiry +otpPurpose');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Check expiry first
        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP expire ho gaya, dobara bhejo' });
        }
        if (user.otpPurpose !== 'login') {

            return res.status(400).json({ success: false, message: 'OTP login ke liye nahi tha' });
        }
        // Trim & toString compare to avoid whitespace/type mismatch
        if (!user.otp || user.otp.toString().trim() !== otp.toString().trim()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP — please check and try again' });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpPurpose = undefined;
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);
        // Re-fetch user without sensitive fields for the response
        const safeUser = await User.findById(user._id);
        res.json({ success: true, token, user: safeUser, message: 'Login successful via OTP' });
    } catch (err) {
        console.error('verify-otp-login error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/auth/verify-otp-reset
// Verify OTP for password reset — returns a short-lived reset token
router.post('/verify-otp-reset', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.otpPurpose !== 'reset') return res.status(400).json({ success: false, message: 'OTP not issued for reset' });
        if (!user.otp || user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
        if (!user.otpExpiry || user.otpExpiry < new Date()) return res.status(400).json({ success: false, message: 'OTP has expired' });

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpPurpose = undefined;
        await user.save();

        // Issue a short-lived reset token (15 min)
        const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ success: true, resetToken, message: 'OTP verified. You can now reset your password.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/auth/reset-password
// Reset password using resetToken from verify-otp-reset
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password required' });
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch {
            return res.status(400).json({ success: false, message: 'Reset token expired or invalid' });
        }
        if (decoded.purpose !== 'reset') return res.status(400).json({ success: false, message: 'Invalid reset token' });

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully! You can now login.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    res.json({ success: true, user: req.user });
});

// @route PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, department, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (department) user.department = department;
        if (newPassword) {

            if (!currentPassword || !(await user.matchPassword(currentPassword))) {
                return res.status(400).json({ success: false, message: 'Current password incorrect' });
            }
            user.password = newPassword;
        }

        await user.save();
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
