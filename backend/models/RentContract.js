const mongoose = require('mongoose');

const rentContractSchema = new mongoose.Schema({
    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
        required: true
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    rentType: {
        type: String,
        default: 'Monthly',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    monthlyRentAmount: {
        type: Number,
        required: true,
        min: 0
    },
    securityDeposit: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Number,
        required: true,
        min: 1,
        max: 31,
        default: 1 // Default to 1st of the month
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Terminated'],
        default: 'Active'
    }
}, { timestamps: true });

rentContractSchema.index({ unit: 1, status: 1 });

module.exports = mongoose.model('RentContract', rentContractSchema);
