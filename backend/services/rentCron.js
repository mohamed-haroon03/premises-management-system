const cron = require('node-cron');
const RentContract = require('../models/RentContract');
const NotificationService = require('./NotificationService');

class RentCronService {
    static init() {
        // Run daily at midnight: 0 0 * * *
        cron.schedule('0 0 * * *', async () => {
            console.log('Running daily check for due rents...');
            try {
                // Get current day of the month (1-31)
                const today = new Date().getDate();

                // Find active rent contracts where the paymentDate matches today
                const dueRents = await RentContract.find({
                    status: 'Active',
                    paymentDate: today
                }).populate({
                    path: 'unit',
                    populate: { path: 'property' }
                }).populate('tenant');

                const Payment = require('../models/Payment');
                let notificationCount = 0;

                for (const rent of dueRents) {
                    if (rent.tenant && rent.unit && rent.unit.property) {
                        // Check if security deposit is fully paid
                        if (rent.securityDeposit > 0) {
                            const depositPayment = await Payment.findOne({
                                paymentCategory: 'Monthly Residential Rent',
                                rentPaymentType: 'Security Deposit',
                                unit: rent.unit._id,
                                tenant: rent.tenant._id
                            });

                            if (!depositPayment) {
                                console.log(`[RentCron] Skipping rent notification for unit ${rent.unit._id} because security deposit is unpaid.`);
                                continue;
                            }
                        }

                        // Notify Tenant
                        await NotificationService.createRentReminder(
                            rent.tenant._id,
                            rent.unit.property.propertyName || 'your property',
                            rent.monthlyRentAmount,
                            rent.unit._id
                        );
                        notificationCount++;

                        // Notify Landlord
                        if (rent.unit.property.owner) {
                            await NotificationService.createLandlordRentReminder(
                                rent.unit.property.owner,
                                rent.tenant.name || 'Tenant',
                                rent.unit.property.propertyName || 'a property',
                                rent.monthlyRentAmount,
                                rent.unit._id
                            );
                            notificationCount++;
                        }
                    }
                }

                if (notificationCount > 0) {
                    console.log(`Generated ${notificationCount} rent due notifications for the ${today}th.`);
                }

            } catch (error) {
                console.error('Error in rentcron job:', error);
            }
        });

        console.log('Rent notification cron job initialized.');
    }
}

module.exports = RentCronService;
