const cron = require('node-cron');
const RentContract = require('../models/RentContract');
const LeaseContract = require('../models/LeaseContract');
const NotificationService = require('./NotificationService');

class LeaseCronService {
    static init() {
        // Run daily at midnight: 0 0 * * *
        cron.schedule('0 0 * * *', async () => {
            await this.runCheck();
        });

        console.log('Lease expiration cron job initialized.');
    }

    static async runCheck() {
        console.log('Running check for expiring leases/rents...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check Rent Contracts
            const activeRents = await RentContract.find({ status: 'Active' })
                .populate({
                    path: 'unit',
                    populate: { path: 'property' }
                })
                .populate('tenant');

            for (const rent of activeRents) {
                if (!rent.endDate || !rent.unit || !rent.unit.property || !rent.tenant) continue;

                const endDate = new Date(rent.endDate);
                endDate.setHours(0, 0, 0, 0);

                const diffTime = endDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const tenantId = rent.tenant._id;
                const landlordId = rent.unit.property.owner;
                const propertyName = rent.unit.property.propertyName || 'the property';
                const unitId = rent.unit._id;

                await this.handleLeaseNotification(rent, diffDays, tenantId, landlordId, propertyName, unitId, 'rent');
            }

            // Check Lease Contracts
            const activeLeases = await LeaseContract.find({ status: 'Active' })
                .populate({
                    path: 'unit',
                    populate: { path: 'property' }
                })
                .populate('tenant');

            for (const lease of activeLeases) {
                if (!lease.endDate || !lease.unit || !lease.unit.property || !lease.tenant) continue;

                const endDate = new Date(lease.endDate);
                endDate.setHours(0, 0, 0, 0);

                const diffTime = endDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const tenantId = lease.tenant._id;
                const landlordId = lease.unit.property.owner;
                const propertyName = lease.unit.property.propertyName || 'the property';
                const unitId = lease.unit._id;

                await this.handleLeaseNotification(lease, diffDays, tenantId, landlordId, propertyName, unitId, 'lease');
            }

        } catch (error) {
            console.error('Error in lease/rent expiration cron job:', error);
        }
    }

    static async handleLeaseNotification(contract, diffDays, tenantId, landlordId, propertyName, referenceId, type) {
        let title = '';
        let message = '';

        if (diffDays === 30) {
            title = 'Lease Expiring Soon';
            message = `The ${type} contract for ${propertyName} will expire in 30 days.`;
        } else if (diffDays === 7) {
            title = 'Lease Expiring Next Week';
            message = `Notice: The ${type} contract for ${propertyName} will expire in 7 days.`;
        } else if (diffDays === 1) {
            title = 'Lease Expires Tomorrow';
            message = `Urgent: The ${type} contract for ${propertyName} expires tomorrow.`;
        } else if (diffDays === 0) {
            title = 'Lease Expired Today';
            message = `The ${type} contract for ${propertyName} has expired today.`;

            // Mark contract as expired if it's the end date
            contract.status = 'Expired';
            await contract.save();
        } else if (diffDays < 0 && contract.status === 'Active') {
            // Failsafe for past-due that weren't caught
            contract.status = 'Expired';
            await contract.save();

            title = 'Lease Expired';
            message = `The ${type} contract for ${propertyName} has expired.`;
        }

        if (title && message) {
            // Notify Tenant
            if (tenantId) {
                await NotificationService.createNotification(
                    tenantId,
                    title,
                    message,
                    'lease_alert', // A new type or just 'bell' default via UI
                    referenceId
                );
            }

            // Notify Landlord
            if (landlordId) {
                await NotificationService.createNotification(
                    landlordId,
                    title,
                    message,
                    'lease_alert',
                    referenceId
                );
            }
        }
    }
}

module.exports = LeaseCronService;
