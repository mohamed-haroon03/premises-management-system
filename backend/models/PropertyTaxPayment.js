const mongoose = require('mongoose');

const propertyTaxPaymentSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    year: {
        type: String, // e.g., "2023-2024"
        required: true
    },
    period: {
        type: String,
        enum: ['H1', 'H2', 'Yearly'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paidDate: {
        type: Date,
        required: true
    },
    receiptFile: {
        type: String // URL or path
    }
}, { timestamps: true });

// Ensure unique payment period per year per property
propertyTaxPaymentSchema.index({ property: 1, year: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('PropertyTaxPayment', propertyTaxPaymentSchema);
