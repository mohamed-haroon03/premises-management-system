const express = require('express');
const router = express.Router();
const LeaseContract = require('../models/LeaseContract');
const Unit = require('../models/Unit');
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

// @route   GET /api/leases
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const Property = require('../models/Property');
        const properties = await Property.find({ owner: req.user.id }).select('_id');
        const units = await Unit.find({ property: { $in: properties } }).select('_id');
        const unitIds = units.map(u => u._id);

        const leases = await LeaseContract.find({ unit: { $in: unitIds } })
            .populate('unit', 'unitNumber property')
            .populate('tenant', 'name email');
        res.json(leases);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   GET /api/leases/trigger-cron
// @access  Public (for testing/manual trigger)
router.get('/trigger-cron', async (req, res) => {
    try {
        const LeaseCronService = require('../services/leaseCron');
        await LeaseCronService.runCheck();
        res.json({ message: `Triggered lease expiration check successfully.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/leases
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const lease = new LeaseContract(req.body);
        const createdLease = await lease.save();

        const populatedLease = await LeaseContract.findById(createdLease._id)
            .populate({ path: 'unit', populate: { path: 'property' } })
            .populate('tenant');

        if (populatedLease.status === 'Active') {
            await Unit.findByIdAndUpdate(populatedLease.unit._id || populatedLease.unit, { status: 'Rented' });
        }

        // Immediate check for expiration upon creation
        const NotificationService = require('../services/NotificationService');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (populatedLease.endDate && populatedLease.unit && populatedLease.unit.property && populatedLease.tenant) {
            const endDate = new Date(populatedLease.endDate);
            endDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            const tenantId = populatedLease.tenant._id;
            const landlordId = populatedLease.unit.property.owner;
            const propertyName = populatedLease.unit.property.propertyName || 'the property';
            const unitId = populatedLease.unit._id;

            if (diffDays <= 30) {
                const LeaseCronService = require('../services/leaseCron');
                await LeaseCronService.handleLeaseNotification(populatedLease, diffDays, tenantId, landlordId, propertyName, unitId, 'lease');
            }

            // Create lease deposit notification for advance payment immediately upon lease creation
            try {
                await NotificationService.createLeaseAdvanceReminder(tenantId, propertyName, populatedLease.leaseAmount, unitId);
                if (landlordId) {
                    await NotificationService.createLandlordLeaseAdvanceReminder(
                        landlordId, 
                        populatedLease.tenant.name || 'Tenant', 
                        propertyName, 
                        populatedLease.leaseAmount, 
                        unitId
                    );
                }
            } catch (notifErr) {
                console.error('Failed to create lease deposit notification:', notifErr);
            }
        }

        res.status(201).json(populatedLease);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   PUT /api/leases/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const lease = await LeaseContract.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate({ path: 'unit', populate: { path: 'property' } })
            .populate('tenant', 'name email');
        if (!lease) {
            return res.status(404).json({ message: 'Lease not found' });
        }

        if (lease.status === 'Active') {
            await Unit.findByIdAndUpdate(lease.unit._id || lease.unit, { status: 'Rented' });
        } else {
            await Unit.findByIdAndUpdate(lease.unit._id || lease.unit, { status: 'Available' });
        }

        // Immediate check for expiration upon update
        const NotificationService = require('../services/NotificationService');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (lease.endDate && lease.unit && lease.unit.property && lease.tenant) {
            const endDate = new Date(lease.endDate);
            endDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            const tenantId = lease.tenant._id;
            const landlordId = lease.unit.property.owner;
            const propertyName = lease.unit.property.propertyName || 'the property';
            const unitId = lease.unit._id;

            // if manually expired or due
            if (diffDays <= 30 || lease.status === 'Expired') {
                const LeaseCronService = require('../services/leaseCron');
                await LeaseCronService.handleLeaseNotification(lease, lease.status === 'Expired' && diffDays > 0 ? -1 : diffDays, tenantId, landlordId, propertyName, unitId, 'lease');
            }
        }

        res.json(lease);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   DELETE /api/leases/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const lease = await LeaseContract.findByIdAndDelete(req.params.id);
        if (!lease) {
            return res.status(404).json({ message: 'Lease not found' });
        }

        await Unit.findByIdAndUpdate(lease.unit, { status: 'Available' });

        res.json({ message: 'Lease deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
