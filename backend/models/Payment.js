const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentCategory: {
        type: String,
        enum: ['Monthly Residential Rent', 'Lease Rent'],
        required: true
    },

    // Shared fields
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    amountPaid: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Online Transaction'],
        required: true
    },
    reference: {
        type: String, // Receipt Number / Bank Trx ID
        trim: true
    },

    // Fields specific to Monthly Residential Rent
    rentPaymentType: {
        type: String,
        enum: ['Monthly Rent', 'Security Deposit'],
        default: 'Monthly Rent'
    },
    rentMonthYear: {
        type: String // e.g. "April-2024"
    },
    dueDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Paid', 'Late', 'Pending']
    },

    // Fields specific to Lease Rent (Deposit/Fees)
    lease: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeaseContract'
    },
    leasePaymentType: {
        type: String,
        enum: ['Security Deposit', 'Full Deposit']
    }

}, { timestamps: true });

// Basic validation for categories
paymentSchema.pre('validate', function () {
    if (this.paymentCategory === 'Monthly Residential Rent') {
        if (!this.unit) this.invalidate('unit', 'Unit is required for Monthly Rent');
        if (this.rentPaymentType === 'Monthly Rent' && !this.rentMonthYear) {
            this.invalidate('rentMonthYear', 'Rent Month/Year is required');
        }
        if (!this.status) this.invalidate('status', 'Status is required for Monthly Rent');
    } else if (this.paymentCategory === 'Lease Rent') {
        if (!this.lease) this.invalidate('lease', 'Lease Contract is required for Lease Rent');
        if (!this.leasePaymentType) this.invalidate('leasePaymentType', 'Lease Payment Type is required');
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
