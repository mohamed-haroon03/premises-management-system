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
        const activeLeaseContractsList = await LeaseContract.find({
            unit: { $in: unitIds },
            status: 'Active'
        }).select('_id leaseAmount');
        const activeLeases = activeLeaseContractsList.length;

        const allActiveRentContractsList = await RentContract.find({
            unit: { $in: unitIds },
            status: 'Active'
        }).select('_id securityDeposit monthlyRentAmount');

        const totalSecurityDeposit = allActiveRentContractsList.reduce((sum, c) => sum + (c.securityDeposit || 0), 0);
        const totalMonthlyRent = allActiveRentContractsList.reduce((sum, c) => sum + (c.monthlyRentAmount || 0), 0);
        const totalLeaseAmount = activeLeaseContractsList.reduce((sum, c) => sum + (c.leaseAmount || 0), 0);

        // The user requested total payment amount as the sum of these three fields
        const monthlyIncome = totalSecurityDeposit + totalMonthlyRent + totalLeaseAmount;

        // 3. Dynamic Revenue Graph Logic (Last 6 Months, Filtered by Landlord's Units)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of that month
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const paymentsForGraph = await Payment.aggregate([
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
        ]);

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

        // 4. Calculate Pending Rent (Simplified Logic)
        const activeRentContracts = await RentContract.find({
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
        }).select('unit tenant monthlyRentAmount');

        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();
        let totalPendingRent = 0;
        const pendingRentDetails = [];

        // PRE-FETCH ALL PAYMENTS FOR THIS MONTH TO AVOID N+1 QUERIES
        const monthRegex = new RegExp(currentMonth, 'i');
        const yearRegex = new RegExp(currentYear.toString());
        
        const allCurrentMonthPayments = await Payment.find({
            unit: { $in: unitIds },
            paymentCategory: 'Monthly Residential Rent',
            rentPaymentType: 'Monthly Rent',
            rentMonthYear: monthRegex,
            status: { $in: ['Paid', 'Late'] }
        }).select('unit tenant rentMonthYear amountPaid');

        for (const contract of activeRentContracts) {
            // Check if a payment for current month has been made in memory
            const paymentsFound = allCurrentMonthPayments.filter(p => 
                p.unit && contract.unit && p.unit.toString() === contract.unit._id.toString() &&
                p.tenant && contract.tenant && p.tenant.toString() === contract.tenant._id.toString()
            );

            const thisMonthPayments = paymentsFound.filter(p => {
                if (!p.rentMonthYear) return false;
                if (yearRegex.test(p.rentMonthYear)) return true;
                if (!/\d{4}/.test(p.rentMonthYear)) return true;
                return false;
            });
            const totalPaidThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amountPaid, 0);

            console.log("DASHBOARD CALC:", { contractAmount: contract.monthlyRentAmount, paymentsFound: paymentsFound.length, thisMonthPayments: thisMonthPayments.length, totalPaidThisMonth });

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
