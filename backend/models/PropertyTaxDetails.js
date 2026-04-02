const mongoose = require('mongoose');

const propertyTaxDetailsSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true,
        unique: true // One detail per property
    },
    state: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    localBodyType: {
        type: String,
        enum: ['Corporation', 'Municipality', 'Panchayat'],
        required: true
    },
    wardNumber: {
        type: String
    },
    assessmentNumber: {
        type: String,
        required: true
    },
    taxCycle: {
        type: String,
        enum: ['Half-Yearly', 'Yearly'],
        default: 'Half-Yearly'
    },
    // If Half-Yearly: due Month 1 and 2
    dueMonth1: {
        type: String, // E.g., "April", "September"
    },
    dueMonth2: {
        type: String // E.g., "October", "March"
    },
    expectedAmount: {
        type: Number,
        min: 0
    }
}, { timestamps: true });

// Ensure due months are set if half-yearly
propertyTaxDetailsSchema.pre('validate', function (next) {
    if (this.taxCycle === 'Half-Yearly') {
        if (!this.dueMonth1 || !this.dueMonth2) {
            this.invalidate('dueMonth1', 'Both dueMonth1 and dueMonth2 are required for Half-Yearly cycle.');
        }
    } else if (this.taxCycle === 'Yearly') {
        if (!this.dueMonth1) {
            this.invalidate('dueMonth1', 'dueMonth1 is required for Yearly cycle.');
        }
    }
    next();
});

module.exports = mongoose.model('PropertyTaxDetails', propertyTaxDetailsSchema);
