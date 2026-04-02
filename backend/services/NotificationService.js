const Notification = require('../models/Notification');

class NotificationService {
    /**
     * Creates a new notification record in the database.
     */
    static async createNotification(userId, title, message, type = 'general', referenceId = null) {
        try {
            const notification = new Notification({
                user: userId,
                title,
                message,
                type,
                referenceId
            });
            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Automates creating a tax due reminder.
     */
    static async createTaxReminder(userId, propertyId, propertyName, typeMsg) {
        const title = 'Property Tax Reminder';
        const message = `Your property tax for ${propertyName} ${typeMsg}.`;
        return await this.createNotification(userId, title, message, 'tax_due', propertyId);
    }
    /**
     * Automates creating a rent due reminder for a tenant.
     */
    static async createRentReminder(userId, propertyName, rentAmount, unitId) {
        const title = 'Monthly Rent Due';
        const message = `Your monthly rent of ₹${rentAmount} for ${propertyName} is due.`;
        return await this.createNotification(userId, title, message, 'rent_due', unitId);
    }

    /**
     * Automates creating a rent due reminder for a landlord.
     */
    static async createLandlordRentReminder(userId, tenantName, propertyName, rentAmount, unitId) {
        const title = 'Monthly Rent Payment Expected';
        const message = `Monthly rent of ₹${rentAmount} is due today from ${tenantName} for ${propertyName}.`;
        return await this.createNotification(userId, title, message, 'rent_due', unitId);
    }

    /**
     * Automates creating a rent deposit due reminder for a tenant.
     */
    static async createRentDepositReminder(userId, propertyName, depositAmount, unitId) {
        const title = 'Monthly Rent Deposit Due';
        const message = `Your monthly rent deposit of ₹${depositAmount} for ${propertyName} is due.`;
        return await this.createNotification(userId, title, message, 'rent_due', unitId);
    }

    /**
     * Automates creating a rent deposit expected reminder for a landlord.
     */
    static async createLandlordRentDepositReminder(userId, tenantName, propertyName, depositAmount, unitId) {
        const title = 'Monthly Rent Deposit Expected';
        const message = `Monthly rent deposit of ₹${depositAmount} is due from ${tenantName} for ${propertyName}.`;
        return await this.createNotification(userId, title, message, 'rent_due', unitId);
    }

    /**
     * Automates creating a lease advance payment reminder for a tenant.
     */
    static async createLeaseAdvanceReminder(userId, propertyName, advanceAmount, unitId) {
        const title = 'Lease Deposit Due';
        const message = `Your lease deposit of ₹${advanceAmount} for ${propertyName} is due.`;
        return await this.createNotification(userId, title, message, 'lease_due', unitId);
    }

    /**
     * Automates creating a lease advance payment expected reminder for a landlord.
     */
    static async createLandlordLeaseAdvanceReminder(userId, tenantName, propertyName, advanceAmount, unitId) {
        const title = 'Lease Deposit Expected';
        const message = `Lease deposit of ₹${advanceAmount} is expected from ${tenantName} for ${propertyName}.`;
        return await this.createNotification(userId, title, message, 'lease_due', unitId);
    }

    /**
     * Automates creating a lease full amount payment reminder for a tenant.
     */
    static async createLeaseFullAmountReminder(userId, propertyName, amount, unitId) {
        const title = 'Lease Full Amount Due';
        const message = `Your lease full amount of ₹${amount} for ${propertyName} is due.`;
        return await this.createNotification(userId, title, message, 'lease_due', unitId);
    }

    /**
     * Automates creating a lease full amount payment expected reminder for a landlord.
     */
    static async createLandlordLeaseFullAmountReminder(userId, tenantName, propertyName, amount, unitId) {
        const title = 'Lease Full Amount Expected';
        const message = `Lease full amount of ₹${amount} is expected from ${tenantName} for ${propertyName}.`;
        return await this.createNotification(userId, title, message, 'lease_due', unitId);
    }
}

module.exports = NotificationService;
