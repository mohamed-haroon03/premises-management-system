const cron = require('node-cron');
const PropertyTax = require('../models/PropertyTax');
const Property = require('../models/Property');
const NotificationService = require('./NotificationService');

class TaxCronService {
    static init() {
        // Run every day at 08:00 AM
        cron.schedule('0 8 * * *', async () => {
            await this.runCheck();
        });

        console.log('Tax notification cron job initialized.');
    }

    static async runCheck() {
        console.log('Running daily Property Tax Reminder Cron Job...');

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize to midnight for accurate day difference calculations

            // Fetch all taxes to handle recurrences correctly
            const allTaxes = await PropertyTax.find({}).populate('property');

            for (const tax of allTaxes) {
                const dueDate = new Date(tax.nextDueDate);
                dueDate.setHours(0, 0, 0, 0);

                // Calculate difference in days
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (!tax.property) continue;

                const userId = tax.property.owner;
                const propertyName = tax.property.propertyName;

                if (tax.status === 'Paid') {
                    // Check if we are approaching the NEW due date since it was previously paid
                    if (diffDays <= 7 && diffDays > 0) {
                        tax.status = 'Pending';
                        await tax.save();
                        await NotificationService.createNotification(
                            userId,
                            'Property Tax Reminder',
                            `Your property tax for ${propertyName} is due in ${diffDays} days.`,
                            'tax_due',
                            tax.property._id
                        );
                    } else if (diffDays <= 0) {
                        tax.status = diffDays === 0 ? 'Pending' : 'Overdue';
                        await tax.save();
                        await NotificationService.createNotification(
                            userId,
                            diffDays === 0 ? 'Property Tax Due Today' : 'Property Tax Overdue',
                            diffDays === 0 ? `Your property tax for ${propertyName} is due today.` : `Your property tax for ${propertyName} is OVERDUE.`,
                            'tax_due',
                            tax.property._id
                        );
                    }
                    continue;
                }

                if (diffDays < 0 && tax.status !== 'Overdue') {
                    // After due date -> mark as overdue
                    tax.status = 'Overdue';
                    await tax.save();

                    await NotificationService.createNotification(
                        userId,
                        'Property Tax Overdue',
                        `Your property tax for ${propertyName} is OVERDUE.`,
                        'tax_due',
                        tax.property._id
                    );
                } else if (diffDays === 0) {
                    // On exact due date (don't auto-advance unless paid)
                    await NotificationService.createNotification(
                        userId,
                        'Property Tax Due Today',
                        `Your property tax for ${propertyName} is due today.`,
                        'tax_due',
                        tax.property._id
                    );
                } else if (diffDays === 1) {
                    // 1 day before due date -> create urgent notification
                    await NotificationService.createNotification(
                        userId,
                        'Urgent: Property Tax Due Tomorrow!',
                        `Your property tax for ${propertyName} is due tomorrow.`,
                        'tax_due',
                        tax.property._id
                    );
                } else if (diffDays === 7) {
                    // 7 days before due date -> create reminder notification
                    await NotificationService.createNotification(
                        userId,
                        'Property Tax Reminder',
                        `Your property tax for ${propertyName} is due in 7 days.`,
                        'tax_due',
                        tax.property._id
                    );
                }
            }
        } catch (error) {
            console.error('Error running tax cron job:', error.message);
        }
    }
}

module.exports = TaxCronService;
