const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
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

// @route   GET /api/payments
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // Optionally filter by category if ?category=...
        const filters = {};
        if (req.query.category) filters.paymentCategory = req.query.category;

        const payments = await Payment.find(filters)
            .populate('tenant', 'name')
            .populate('unit', 'unitNumber')
            .populate('lease', 'leaseType startDate endDate');

        res.json(payments);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

const Notification = require('../models/Notification');

// @route   POST /api/payments
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const payment = new Payment(req.body);
        const createdPayment = await payment.save();

        if (payment.unit) {
            await Notification.updateMany(
                { type: { $in: ['rent_due', 'lease_due'] }, referenceId: payment.unit },
                { isRead: true }
            );
        }

        // Feature: Send monthly rent notification immediately after deposit is paid if based on payment date
        if (payment.paymentCategory === 'Monthly Residential Rent' && payment.rentPaymentType === 'Security Deposit' && payment.unit && payment.tenant) {
            const RentContract = require('../models/RentContract');
            const NotificationService = require('../services/NotificationService');

            const rent = await RentContract.findOne({
                unit: payment.unit,
                tenant: payment.tenant,
                status: 'Active'
            }).populate({ path: 'unit', populate: { path: 'property' } }).populate('tenant');

            if (rent && rent.unit && rent.unit.property) {
                // Feature: Send the first monthly rent notification immediately!
                if (rent.tenant) {
                    await NotificationService.createRentReminder(
                        rent.tenant._id,
                        rent.unit.property.propertyName || 'your property',
                        rent.monthlyRentAmount || 0,
                        rent.unit._id
                    );
                }
                if (rent.unit.property.owner) {
                    await NotificationService.createLandlordRentReminder(
                        rent.unit.property.owner,
                        rent.tenant.name || 'Tenant',
                        rent.unit.property.propertyName || 'a property',
                        rent.monthlyRentAmount || 0,
                        rent.unit._id
                    );
                }
            }
        }

        // Feature: Send lease full amount notification immediately after lease advance is paid
        if (payment.paymentCategory === 'Lease Rent' && payment.leasePaymentType === 'Security Deposit' && payment.unit && payment.tenant) {
            const LeaseContract = require('../models/LeaseContract');
            const NotificationService = require('../services/NotificationService');

            const lease = await LeaseContract.findOne({
                unit: payment.unit,
                tenant: payment.tenant,
                status: 'Active'
            }).populate({ path: 'unit', populate: { path: 'property' } }).populate('tenant');

            if (lease && lease.unit && lease.unit.property && lease.fullDepositOption > 0) {
                if (lease.tenant) {
                    await NotificationService.createLeaseFullAmountReminder(
                        lease.tenant._id,
                        lease.unit.property.propertyName || 'your property',
                        lease.fullDepositOption,
                        lease.unit._id
                    );
                }
                if (lease.unit.property.owner) {
                    await NotificationService.createLandlordLeaseFullAmountReminder(
                        lease.unit.property.owner,
                        lease.tenant.name || 'Tenant',
                        lease.unit.property.propertyName || 'a property',
                        lease.fullDepositOption,
                        lease.unit._id
                    );
                }
            }
        }

        res.status(201).json(createdPayment);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// @route   PUT /api/payments/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const updatedPayment = await Payment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedPayment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json(updatedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   DELETE /api/payments/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.unit && payment.paymentCategory === 'Monthly Residential Rent') {
            if (payment.rentPaymentType === 'Monthly Rent') {
                const NotificationService = require('../services/NotificationService');
                const RentContract = require('../models/RentContract');

                // Find the active rent contract for this unit and tenant to get details
                const rent = await RentContract.findOne({
                    unit: payment.unit,
                    tenant: payment.tenant,
                    status: 'Active'
                }).populate({
                    path: 'unit',
                    populate: { path: 'property' }
                }).populate('tenant');

                if (rent && rent.unit && rent.unit.property) {
                    // Create unread rent due notifications for tenant and landlord
                    if (rent.tenant) {
                        await NotificationService.createRentReminder(
                            rent.tenant._id,
                            rent.unit.property.propertyName || 'the property',
                            rent.monthlyRentAmount,
                            rent.unit._id
                        );
                    }
                    if (rent.unit.property.owner) {
                        await NotificationService.createLandlordRentReminder(
                            rent.unit.property.owner,
                            rent.tenant.name || 'Tenant',
                            rent.unit.property.propertyName || 'a property',
                            rent.monthlyRentAmount,
                            rent.unit._id
                        );
                    }
                } else {
                    // Fallback to just marking existing notifications as unread
                    const Notification = require('../models/Notification');
                    await Notification.updateMany(
                        { type: 'rent_due', referenceId: payment.unit },
                        { isRead: false }
                    );
                }
            }
        } else if (payment.unit && payment.paymentCategory === 'Lease Rent') {
            if (payment.leasePaymentType === 'Security Deposit') {
                const Notification = require('../models/Notification');
                await Notification.updateMany(
                    { type: 'lease_due', referenceId: payment.unit },
                    { isRead: false }
                );
            }
        }

        await payment.deleteOne();
        res.json({ message: 'Payment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
