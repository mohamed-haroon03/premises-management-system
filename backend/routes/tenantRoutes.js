const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            next();
        } catch (error) { res.status(401).json({ message: 'Not authorized' }); }
    } else { res.status(401).json({ message: 'Not authorized' }); }
};

// @route   GET /api/tenants
// @access  Private (Landlord usually fetches all tenants associated with their properties, but simplified here)
router.get('/', protect, async (req, res) => {
    try {
        // Basic implementation: fetch all for now, ideally filter by landlord
        const tenants = await Tenant.find().populate('currentUnit').populate('user', 'name email');
        res.json(tenants);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   POST /api/tenants
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const tenant = new Tenant(req.body);
        const createdTenant = await tenant.save();
        res.status(201).json(createdTenant);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   PUT /api/tenants/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

        tenant = await Tenant.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('currentUnit').populate('user', 'name email');

        res.json(tenant);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   DELETE /api/tenants/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

        await tenant.deleteOne();
        res.json({ message: 'Tenant removed' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
