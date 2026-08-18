const mongoose = require('mongoose');

const propertyTaxSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    startYear: {
        type: Number,
        required: true
    },
    endYear: {
        type: Number,
        required: false
    },
    nextDueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Overdue', 'Paid'],
        default: 'Pending'
    }
}, { timestamps: true });

propertyTaxSchema.index({ property: 1 });

module.exports = mongoose.model('PropertyTax', propertyTaxSchema);
