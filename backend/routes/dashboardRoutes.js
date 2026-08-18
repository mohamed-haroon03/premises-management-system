const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const LeaseContract = require('../models/LeaseContract');
const RentContract = require('../models/RentContract');
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

// @route   GET /api/dashboard/owner
// @access  Private (Landlord)
router.get('/owner', protect, async (req, res) => {
    try {
        // 1. Fetch properties belonging to owner (possibly filtering out inactive)
        const properties = await Property.find({ owner: req.user.id, status: 'Active' }).select('_id');
        const propertyIds = properties.map(p => p._id);

        const units = await Unit.find({ property: { $in: propertyIds } }).select('_id status');
        const unitIds = units.map(u => u._id);

        // Calculate Occupancy
        const totalUnitsCount = units.length;
        let occupiedUnitsCount = 0;
        units.forEach(u => { if (u.status === 'Rented') occupiedUnitsCount++; });
        const vacantUnitsCount = totalUnitsCount - occupiedUnitsCount;

        // 1.5 Active Leases & Total Payment Amount Calculation
        // OPTIMIZATION: Removed duplicate RentContract fetch. We will fetch everything in Promise.all

        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();
        const monthRegex = new RegExp(currentMonth, 'i');
        const yearRegex = new RegExp(currentYear.toString());

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of that month
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const [
            activeLeaseContractsList,
            activeRentContracts,
            paymentsForGraph,
            allCurrentMonthPayments
        ] = await Promise.all([
            LeaseContract.find({
                unit: { $in: unitIds },
                status: 'Active'
            }).select('_id leaseAmount'),
            
            RentContract.find({
                unit: { $in: unitIds },
                status: 'Active'
            }).populate('tenant', 'name')
              .populate({
                path: 'unit',
                select: 'unitNumber property',
                populate: {
                    path: 'property',
                    select: 'propertyName'
                }
            }).select('unit tenant monthlyRentAmount securityDeposit'),
            
            Payment.aggregate([
                {
                    $match: {
                        paymentDate: { $gte: sixMonthsAgo },
                        unit: { $in: unitIds },
                        $or: [{ status: 'Paid' }, { status: 'Late' }, { status: { $exists: false } }]
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$paymentDate" },
                            year: { $year: "$paymentDate" }
                        },
                        income: { $sum: "$amountPaid" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),
            
            Payment.find({
                unit: { $in: unitIds },
                paymentCategory: 'Monthly Residential Rent',
                rentPaymentType: 'Monthly Rent',
                rentMonthYear: monthRegex,
                status: { $in: ['Paid', 'Late'] }
            }).select('unit tenant rentMonthYear amountPaid')
        ]);

        const activeLeases = activeLeaseContractsList.length;

        const totalSecurityDeposit = activeRentContracts.reduce((sum, c) => sum + (c.securityDeposit || 0), 0);
        const totalMonthlyRent = activeRentContracts.reduce((sum, c) => sum + (c.monthlyRentAmount || 0), 0);
        const totalLeaseAmount = activeLeaseContractsList.reduce((sum, c) => sum + (c.leaseAmount || 0), 0);

        // The user requested total payment amount as the sum of these three fields
        const monthlyIncome = totalSecurityDeposit + totalMonthlyRent + totalLeaseAmount;

        // 3. Dynamic Revenue Graph Logic (Last 6 Months, Filtered by Landlord's Units)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const revenueData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth() + 1; // 1-12
            const y = d.getFullYear();

            const found = paymentsForGraph.find(p => p._id.month === m && p._id.year === y);

            revenueData.push({
                name: monthNames[m - 1],
                income: found ? found.income : 0,
                expenses: 0 // Placeholder until expenses are tracked
            });
        }

        // 4. Calculate Pending Rent (Optimized O(N) Lookup)
        let totalPendingRent = 0;
        const pendingRentDetails = [];

        const paymentMap = new Map();
        for (const p of allCurrentMonthPayments) {
            if (!p.rentMonthYear) continue;
            if (!yearRegex.test(p.rentMonthYear) && /\d{4}/.test(p.rentMonthYear)) continue;
            
            const key = `${p.unit}_${p.tenant}`;
            paymentMap.set(key, (paymentMap.get(key) || 0) + p.amountPaid);
        }

        for (const contract of activeRentContracts) {
            const unitIdStr = contract.unit && contract.unit._id ? contract.unit._id.toString() : '';
            const tenantIdStr = contract.tenant && contract.tenant._id ? contract.tenant._id.toString() : '';
            const key = `${unitIdStr}_${tenantIdStr}`;
            
            const totalPaidThisMonth = paymentMap.get(key) || 0;

            if (totalPaidThisMonth < contract.monthlyRentAmount) {
                const pendingAmt = contract.monthlyRentAmount - totalPaidThisMonth;
                totalPendingRent += pendingAmt;
                if (contract.tenant && contract.unit) {
                    pendingRentDetails.push({
                        tenantId: contract.tenant._id,
                        tenantName: contract.tenant.name || 'Unknown',
                        unitNumber: contract.unit.unitNumber,
                        propertyName: contract.unit.property ? contract.unit.property.propertyName : 'Unknown Property',
                        amountPending: pendingAmt
                    });
                }
            }
        }

        res.json({
            totalProperties: properties.length,
            totalUnits: totalUnitsCount,
            occupiedUnits: occupiedUnitsCount,
            vacantUnits: vacantUnitsCount,
            occupancyRate: totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0,
            activeLeases,
            monthlyIncome,
            expenses: 0, // Placeholder
            profit: monthlyIncome - 0, // Placeholder
            pendingRent: totalPendingRent,
            pendingRentDetails,
            revenueData
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
