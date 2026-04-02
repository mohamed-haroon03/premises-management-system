const PropertyTax = require('../models/PropertyTax');
const Property = require('../models/Property');
const NotificationService = require('../services/NotificationService');
const Notification = require('../models/Notification');

exports.createOrUpdateTax = async (req, res) => {
    try {
        const { propertyId, startYear, nextDueDate } = req.body;

        const property = await Property.findOne({ _id: propertyId, owner: req.user.id });
        if (!property) return res.status(401).json({ message: 'Not authorized for this property' });

        let tax = await PropertyTax.findOne({ property: propertyId });

        if (tax) {
            tax.startYear = startYear;
            tax.nextDueDate = new Date(nextDueDate);
            tax.status = 'Pending';
            tax = await tax.save();
        } else {
            tax = new PropertyTax({
                property: propertyId,
                startYear,
                nextDueDate: new Date(nextDueDate),
                status: 'Pending'
            });
            tax = await tax.save();
        }

        // Check if the due date is today. If so, immediately trigger a notification
        // so the user receives it in their notification bell without waiting for the cron job.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(tax.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            await NotificationService.createNotification(
                req.user.id,
                'Property Tax Due Today',
                `Your property tax for ${property.propertyName} is due today.`,
                'tax_due',
                propertyId
            );
        }

        res.status(201).json(tax);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getTaxForProperty = async (req, res) => {
    try {
        const property = await Property.findOne({ _id: req.params.propertyId, owner: req.user.id });
        if (!property) return res.status(401).json({ message: 'Not authorized for this property' });

        const tax = await PropertyTax.findOne({ property: req.params.propertyId });
        if (!tax) return res.status(404).json({ message: 'Tax record not found' });

        res.json({ tax });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.payTax = async (req, res) => {
    try {
        const property = await Property.findOne({ _id: req.params.propertyId, owner: req.user.id });
        if (!property) return res.status(401).json({ message: 'Not authorized for this property' });

        const tax = await PropertyTax.findOne({ property: req.params.propertyId });
        if (!tax) return res.status(404).json({ message: 'Tax record not found' });

        tax.status = 'Paid';
        await tax.save();

        // Automatically mark all related tax reminders as read
        await Notification.updateMany(
            { user: req.user.id, type: 'tax_due', referenceId: req.params.propertyId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: 'Tax marked as paid successfully', tax });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
