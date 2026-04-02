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

            // Fetch all pending taxes
            const pendingTaxes = await PropertyTax.find({ status: { $in: ['Pending', 'Overdue'] } }).populate('property');

            for (const tax of pendingTaxes) {
                const dueDate = new Date(tax.nextDueDate);
                dueDate.setHours(0, 0, 0, 0);

                // Calculate difference in days
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const userId = tax.property.owner;
                const propertyName = tax.property.propertyName;

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
                    // On exact due date
                    await NotificationService.createNotification(
                        userId,
                        'Property Tax Due Today',
                        `Your property tax for ${propertyName} is due today.`,
                        'tax_due',
                        tax.property._id
                    );

                    // Auto-advance by 3 months
                    const nextDate = new Date(tax.nextDueDate);
                    nextDate.setMonth(nextDate.getMonth() + 3);
                    tax.nextDueDate = nextDate;
                    tax.status = 'Pending';
                    await tax.save();
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
