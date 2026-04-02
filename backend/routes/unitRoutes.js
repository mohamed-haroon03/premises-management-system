const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            next();
        } catch (error) { res.status(401).json({ message: 'Not authorized' }); }
    } else { res.status(401).json({ message: 'Not authorized, no token' }); }
};

// @route   GET /api/units/property/:propertyId
// @access  Private (Landlord)
router.get('/property/:propertyId', protect, async (req, res) => {
    try {
        const property = await Property.findOne({ _id: req.params.propertyId, owner: req.user.id });
        if (!property) return res.status(404).json({ message: 'Property not found' });

        const units = await Unit.find({ property: req.params.propertyId });
        res.json(units);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   POST /api/units
// @access  Private (Landlord)
router.post('/', protect, async (req, res) => {
    try {
        console.log('Received unit creation request:', req.body);
        const property = await Property.findOne({ _id: req.body.property, owner: req.user.id });
        if (!property) {
            console.error('Property not found or unauthorized:', req.body.property, req.user.id);
            return res.status(401).json({ message: 'Not authorized for this property' });
        }

        const unit = new Unit(req.body);
        const createdUnit = await unit.save();
        console.log('Unit created successfully:', createdUnit._id);
        res.status(201).json(createdUnit);
    } catch (error) {
        console.error('Error creating unit:', error);
        // Specifically catch duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A unit with this number already exists in this property.' });
        }
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/units/:id
// @access  Private (Landlord)
router.put('/:id', protect, async (req, res) => {
    try {
        let unit = await Unit.findById(req.params.id);
        if (!unit) return res.status(404).json({ message: 'Unit not found' });

        const property = await Property.findOne({ _id: unit.property, owner: req.user.id });
        if (!property) return res.status(401).json({ message: 'Not authorized for this property' });

        unit = await Unit.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(unit);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A unit with this number already exists.' });
        }
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/units/:id
// @access  Private (Landlord)
router.delete('/:id', protect, async (req, res) => {
    try {
        const unit = await Unit.findById(req.params.id);
        if (!unit) return res.status(404).json({ message: 'Unit not found' });

        const property = await Property.findOne({ _id: unit.property, owner: req.user.id });
        if (!property) return res.status(401).json({ message: 'Not authorized for this property' });

        await unit.deleteOne();
        res.json({ message: 'Unit removed' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
