const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const LeaseContract = require('./models/LeaseContract');
const RentContract = require('./models/RentContract');
const Tenant = require('./models/Tenant');
const fs = require('fs');

async function generateReport() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management');

        // Calculate the date 6 months ago from today
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Fetch data from the last 6 months
        // Using paymentDate for payments, and createdAt or startDate for others
        const payments = await Payment.find({ paymentDate: { $gte: sixMonthsAgo } })
            .populate('tenant', 'name')
            .populate({ path: 'unit', populate: { path: 'property', select: 'propertyName' } });

        const leases = await LeaseContract.find({ startDate: { $gte: sixMonthsAgo } })
            .populate('tenant', 'name')
            .populate({ path: 'unit', populate: { path: 'property', select: 'propertyName' } });

        const rents = await RentContract.find({ createdAt: { $gte: sixMonthsAgo } })
            .populate('tenant', 'name')
            .populate({ path: 'unit', populate: { path: 'property', select: 'propertyName' } });

        const tenants = await Tenant.find({ createdAt: { $gte: sixMonthsAgo } });

        let report = `==========================================================\n`;
        report += `    PROPERTY MANAGEMENT - LAST 6 MONTHS DATA REPORT\n`;
        report += `==========================================================\n\n`;
        report += `Generated on: ${new Date().toLocaleString()}\n`;
        report += `Reporting Period: ${sixMonthsAgo.toLocaleDateString()} to ${new Date().toLocaleDateString()}\n\n`;

        // --- REVENUE & PAYMENTS ---
        report += `----------------------------------------------------------\n`;
        report += `1. PAYMENTS & REVENUE\n`;
        report += `----------------------------------------------------------\n`;
        report += `Total Transactions: ${payments.length}\n`;
        let totalRevenue = 0;

        if (payments.length > 0) {
            report += `\nDate\t\tAmount\t\tCategory\t\tTenant\t\tStatus\n`;
            report += `----------------------------------------------------------\n`;
            payments.sort((a, b) => b.paymentDate - a.paymentDate).forEach(p => {
                totalRevenue += (p.amountPaid || 0);
                const date = new Date(p.paymentDate).toLocaleDateString();
                const tenantName = p.tenant ? p.tenant.name : 'Unknown';
                report += `${date}\t₹${p.amountPaid}\t\t${p.paymentCategory}\t${tenantName}\t\t${p.status}\n`;
            });
        }
        report += `\n>> TOTAL REVENUE COLLECTED: ₹${totalRevenue.toLocaleString()}\n\n\n`;

        // --- RECENT LEASES ---
        report += `----------------------------------------------------------\n`;
        report += `2. NEW LEASE CONTRACTS\n`;
        report += `----------------------------------------------------------\n`;
        report += `Total New Leases: ${leases.length}\n`;

        if (leases.length > 0) {
            report += `\nStart Date\tTenant\t\tLease Type\tAmount\t\tStatus\n`;
            report += `----------------------------------------------------------\n`;
            leases.forEach(l => {
                const date = new Date(l.startDate).toLocaleDateString();
                const tenantName = l.tenant ? l.tenant.name : 'Unknown';
                report += `${date}\t${tenantName}\t\t${l.leaseType}\t₹${l.leaseAmount}\t\t${l.status || 'Active'}\n`;
            });
        }
        report += `\n\n`;

        // --- RECENT MONTHLY RENTS ---
        report += `----------------------------------------------------------\n`;
        report += `3. NEW MONTHLY RENT CONTRACTS\n`;
        report += `----------------------------------------------------------\n`;
        report += `Total New Rents: ${rents.length}\n`;

        if (rents.length > 0) {
            report += `\nCreated On\tTenant\t\tMonthly Rent\tDeposit\t\tStatus\n`;
            report += `----------------------------------------------------------\n`;
            rents.forEach(r => {
                const date = new Date(r.createdAt).toLocaleDateString();
                const tenantName = r.tenant ? r.tenant.name : 'Unknown';
                report += `${date}\t${tenantName}\t\t₹${r.monthlyRentAmount}\t\t₹${r.securityDeposit}\t\t${r.status}\n`;
            });
        }
        report += `\n\n`;

        // --- NEW TENANTS ---
        report += `----------------------------------------------------------\n`;
        report += `4. NEW TENANTS ONBOARDED\n`;
        report += `----------------------------------------------------------\n`;
        report += `Total New Tenants: ${tenants.length}\n`;

        if (tenants.length > 0) {
            report += `\nJoined Date\tName\t\t\tEmail\t\t\tPhone\n`;
            report += `----------------------------------------------------------\n`;
            tenants.forEach(t => {
                const date = new Date(t.createdAt).toLocaleDateString();
                report += `${date}\t${t.name}\t\t${t.email}\t${t.phone}\n`;
            });
        }

        // Write to output file in the main directory
        fs.writeFileSync('../last_6_months_data.txt', report);
        console.log('Report successfully generated!');
        process.exit(0);

    } catch (error) {
        console.error('Error generating report:', error);
        process.exit(1);
    }
}

generateReport();
