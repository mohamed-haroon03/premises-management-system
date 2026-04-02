const express = require('express');
const router = express.Router();
const propertyTaxController = require('../controllers/propertyTaxController');
const jwt = require('jsonwebtoken');

// Authorization Middleware
const protect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            next();
        } catch (error) { res.status(401).json({ message: 'Not authorized' }); }
    } else { res.status(401).json({ message: 'Not authorized, no token' }); }
};

// --- TAX CALCULATION & MANAGEMENT ROUTES ---

// @route   POST /api/taxes
// @desc    Create or update property tax configuration
// @access  Private (Landlord)
router.post('/', protect, propertyTaxController.createOrUpdateTax);

// @route   GET /api/taxes/property/:propertyId
// @desc    Get property tax configuration and details
// @access  Private (Landlord)
router.get('/property/:propertyId', protect, propertyTaxController.getTaxForProperty);

// @route   POST /api/taxes/property/:propertyId/pay
// @desc    Mark property tax as paid
// @access  Private (Landlord)
router.post('/property/:propertyId/pay', protect, propertyTaxController.payTax);

module.exports = router;
