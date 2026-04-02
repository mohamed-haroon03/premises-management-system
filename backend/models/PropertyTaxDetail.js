const mongoose = require('mongoose');

const propertyTaxDetailSchema = new mongoose.Schema({
    tax: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PropertyTax',
        required: true
    },
    fieldKey: {
        type: String,
        required: true
    },
    fieldValue: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('PropertyTaxDetail', propertyTaxDetailSchema);
