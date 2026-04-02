const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');

// Simple auth middleware (usually this would be in a separate middleware file)
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            req.user = decoded; // we just need user ID
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @route   GET /api/properties
// @access  Private (Landlord)
router.get('/', protect, async (req, res) => {
    try {
        const properties = await Property.find({ owner: req.user.id });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/properties
// @access  Private (Landlord)
router.post('/', protect, async (req, res) => {
    try {
        const property = new Property({
            ...req.body,
            owner: req.user.id
        });

        const createdProperty = await property.save();
        res.status(201).json(createdProperty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/properties/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) {
            res.json(property);
        } else {
            res.status(404).json({ message: 'Property not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/properties/:id
// @access  Private (Landlord)
router.put('/:id', protect, async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Make sure user owns property
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to update this property' });
        }

        property = await Property.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/properties/:id
// @access  Private (Landlord)
router.delete('/:id', protect, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Make sure user owns property
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this property' });
        }

        await property.deleteOne();
        res.json({ message: 'Property removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
