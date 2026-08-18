const mongoose = require('mongoose');

const leaseContractSchema = new mongoose.Schema({
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
    leaseType: {
        type: String,
        enum: ['Lumpsum'], // Adding explicitly based on user request
        default: 'Lumpsum',
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
    leaseAmount: {
        type: Number, // Also represents the Advance Amount
        required: true,
        min: 0
    },
    refundableAmount: {
        type: Number,
        required: true,
        min: 0
    },
    fullDepositOption: {
        type: Number,
        min: 0
    },
    deductionRules: {
        type: String, // String describing conditions for deductions
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Terminated'],
        default: 'Active'
    }
}, { timestamps: true });

leaseContractSchema.index({ unit: 1, status: 1 });

module.exports = mongoose.model('LeaseContract', leaseContractSchema);
