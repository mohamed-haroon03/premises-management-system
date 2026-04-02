const express = require('express');
const router = express.Router();
const RentContract = require('../models/RentContract');
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

// @route   GET /api/rents
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const rents = await RentContract.find()
            .populate({
                path: 'unit',
                populate: { path: 'property' }
            })
            .populate('tenant', 'name email');
        res.json(rents);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   GET /api/rents/trigger-cron
// @access  Public (for testing)
router.get('/trigger-cron', async (req, res) => {
    try {
        const RentContract = require('../models/RentContract');
        const NotificationService = require('../services/NotificationService');

        const today = new Date().getDate();
        const dueRents = await RentContract.find({
            status: 'Active',
            paymentDate: today
        }).populate({
            path: 'unit',
            populate: { path: 'property' }
        }).populate('tenant');

        let count = 0;
        for (const rent of dueRents) {
            if (rent.tenant && rent.unit && rent.unit.property) {
                // Notify Tenant
                await NotificationService.createRentReminder(
                    rent.tenant._id,
                    rent.unit.property.propertyName || 'your property',
                    rent.monthlyRentAmount,
                    rent.unit._id
                );
                count++;

                // Notify Landlord
                if (rent.unit.property.owner) {
                    await NotificationService.createLandlordRentReminder(
                        rent.unit.property.owner,
                        rent.tenant.name || 'Tenant',
                        rent.unit.property.propertyName || 'a property',
                        rent.monthlyRentAmount,
                        rent.unit._id
                    );
                    count++;
                }
            }
        }
        res.json({ message: `Triggered successfully. Generated ${count} notifications.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/rents/debug-notif
// @access  Public
router.get('/debug-notif', async (req, res) => {
    try {
        const RentContract = require('../models/RentContract');
        const NotificationService = require('../services/NotificationService');

        const lastRent = await RentContract.findOne().sort({ updatedAt: -1 }).populate({
            path: 'unit',
            populate: { path: 'property' }
        }).populate('tenant');

        if (!lastRent) return res.json({ error: "No rents found" });

        const today = new Date().getDate();
        const rentDate = lastRent.paymentDate;

        let result = {
            rentId: lastRent._id,
            status: lastRent.status,
            paymentDate: rentDate,
            paymentDateType: typeof rentDate,
            todayDate: today,
            todayDateType: typeof today,
            isEqual: rentDate === today,
            tenantPopulated: !!lastRent.tenant,
            propertyOwnerPopulated: !!lastRent.unit?.property?.owner
        };

        if (lastRent.status === 'Active' && lastRent.paymentDate === today) {
            try {
                // Try creating manually right now
                await NotificationService.createRentReminder(
                    lastRent.tenant._id,
                    lastRent.unit.property.propertyName || 'your property',
                    lastRent.monthlyRentAmount,
                    lastRent.unit._id
                );

                await NotificationService.createLandlordRentReminder(
                    lastRent.unit.property.owner,
                    lastRent.tenant?.name || 'Tenant',
                    lastRent.unit.property.propertyName || 'a property',
                    lastRent.monthlyRentAmount,
                    lastRent.unit._id
                );
                result.notificationCreation = "Success";
            } catch (err) {
                result.notificationCreation = "Failed: " + err.message;
            }
        }

        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// @route   POST /api/rents
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const rent = new RentContract(req.body);
        const createdRent = await rent.save();

        // Populate after save to return complete object for frontend
        const populatedRent = await RentContract.findById(createdRent._id)
            .populate({
                path: 'unit',
                populate: { path: 'property' }
            })
            .populate('tenant', 'name email');

        if (populatedRent.status === 'Active') {
            await Unit.findByIdAndUpdate(populatedRent.unit._id || populatedRent.unit, { status: 'Rented' });
        }

        // Check if the due date is today, and if so, trigger notifications immediately!
        console.log(`[POST /rents] Status: ${populatedRent.status}, PaymentDate: ${populatedRent.paymentDate}, TodayDate: ${new Date().getDate()}`);
        console.log(`[POST /rents] Evaluates to: ${populatedRent.status === 'Active' && populatedRent.paymentDate === new Date().getDate()}`);
        console.log(`[POST /rents] Tenant Populated: ${!!populatedRent.tenant}, Property Populated: ${!!populatedRent.unit?.property?.owner}`);

        if (populatedRent.status === 'Active') {
            const NotificationService = require('../services/NotificationService');

            // 1. Notify about Deposit
            if (populatedRent.tenant && populatedRent.unit && populatedRent.unit.property && populatedRent.securityDeposit > 0) {
                await NotificationService.createRentDepositReminder(
                    populatedRent.tenant._id,
                    populatedRent.unit.property.propertyName || 'your property',
                    populatedRent.securityDeposit,
                    populatedRent.unit._id
                );
            }
            if (populatedRent.unit && populatedRent.unit.property && populatedRent.unit.property.owner && populatedRent.securityDeposit > 0) {
                await NotificationService.createLandlordRentDepositReminder(
                    populatedRent.unit.property.owner,
                    populatedRent.tenant?.name || 'Tenant',
                    populatedRent.unit.property.propertyName || 'a property',
                    populatedRent.securityDeposit,
                    populatedRent.unit._id
                );
            }

            // 2. Notify about Monthly Rent (Only if deposit is 0 and today is the payment date!)
            if (populatedRent.securityDeposit === 0 || !populatedRent.securityDeposit) {
                if (populatedRent.paymentDate === new Date().getDate()) {
                    if (populatedRent.tenant && populatedRent.unit && populatedRent.unit.property) {
                        await NotificationService.createRentReminder(
                            populatedRent.tenant._id,
                            populatedRent.unit.property.propertyName || 'your property',
                            populatedRent.monthlyRentAmount || 0,
                            populatedRent.unit._id
                        );
                    }
                    if (populatedRent.unit && populatedRent.unit.property && populatedRent.unit.property.owner) {
                        await NotificationService.createLandlordRentReminder(
                            populatedRent.unit.property.owner,
                            populatedRent.tenant?.name || 'Tenant',
                            populatedRent.unit.property.propertyName || 'a property',
                            populatedRent.monthlyRentAmount || 0,
                            populatedRent.unit._id
                        );
                    }
                }
            }
        }

        // Immediate check for expiration upon creation
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (populatedRent.endDate && populatedRent.unit && populatedRent.unit.property && populatedRent.tenant) {
            const endDate = new Date(populatedRent.endDate);
            endDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            const tenantId = populatedRent.tenant._id;
            const landlordId = populatedRent.unit.property.owner;
            const propertyName = populatedRent.unit.property.propertyName || 'the property';
            const unitId = populatedRent.unit._id;

            if (diffDays <= 30) {
                const LeaseCronService = require('../services/leaseCron');
                await LeaseCronService.handleLeaseNotification(populatedRent, diffDays, tenantId, landlordId, propertyName, unitId, 'rent');
            }
        }

        res.status(201).json(populatedRent);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   PUT /api/rents/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const rent = await RentContract.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate({
                path: 'unit',
                populate: { path: 'property' }
            })
            .populate('tenant', 'name email');
        if (!rent) {
            return res.status(404).json({ message: 'Rent agreement not found' });
        }

        if (rent.status === 'Active') {
            await Unit.findByIdAndUpdate(rent.unit._id || rent.unit, { status: 'Rented' });
        } else {
            // Might want to check if there are other active rents/leases for this unit before marking available
            await Unit.findByIdAndUpdate(rent.unit._id || rent.unit, { status: 'Available' });
        }

        // Check if the due date is today, and if so, trigger notifications immediately!
        console.log(`[PUT /rents] Status: ${rent.status}, PaymentDate: ${rent.paymentDate}, TodayDate: ${new Date().getDate()}`);
        console.log(`[PUT /rents] Evaluates to: ${rent.status === 'Active' && rent.paymentDate === new Date().getDate()}`);
        console.log(`[PUT /rents] Tenant Populated: ${!!rent.tenant}, Property Populated: ${!!rent.unit?.property?.owner}`);

        if (rent.status === 'Active' && rent.paymentDate === new Date().getDate()) {
            const NotificationService = require('../services/NotificationService');

            // Notify tenant
            if (rent.tenant && rent.unit && rent.unit.property) {
                await NotificationService.createRentReminder(
                    rent.tenant._id,
                    rent.unit.property.propertyName || 'your property',
                    rent.monthlyRentAmount,
                    rent.unit._id
                );
            }
            // Notify landlord
            if (rent.unit && rent.unit.property && rent.unit.property.owner) {
                await NotificationService.createLandlordRentReminder(
                    rent.unit.property.owner,
                    rent.tenant?.name || 'Tenant',
                    rent.unit.property.propertyName || 'a property',
                    rent.monthlyRentAmount,
                    rent.unit._id
                );
            }
        }

        // Immediate check for expiration upon update
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (rent.endDate && rent.unit && rent.unit.property && rent.tenant) {
            const endDate = new Date(rent.endDate);
            endDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            const tenantId = rent.tenant._id;
            const landlordId = rent.unit.property.owner;
            const propertyName = rent.unit.property.propertyName || 'the property';
            const unitId = rent.unit._id;

            // if manually expired or due
            if (diffDays <= 30 || rent.status === 'Expired') {
                const LeaseCronService = require('../services/leaseCron');
                await LeaseCronService.handleLeaseNotification(rent, rent.status === 'Expired' && diffDays > 0 ? -1 : diffDays, tenantId, landlordId, propertyName, unitId, 'rent');
            }
        }

        res.json(rent);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route   DELETE /api/rents/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const rent = await RentContract.findByIdAndDelete(req.params.id);
        if (!rent) {
            return res.status(404).json({ message: 'Rent agreement not found' });
        }

        await Unit.findByIdAndUpdate(rent.unit, { status: 'Available' });

        res.json({ message: 'Rent agreement deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
