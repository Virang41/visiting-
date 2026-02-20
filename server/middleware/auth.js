const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user || !req.user.isActive) {

                return res.status(401).json({ success: false, message: 'Not authorized' });
            }
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Token invalid or expired' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
};

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
