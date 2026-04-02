const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    unitNumber: {
        type: String,
        required: true,
        trim: true
    },
    bedrooms: {
        type: Number,
        required: true,
        min: 0
    },
    bathrooms: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ['Available', 'Rented', 'Maintenance'],
        default: 'Available'
    },
    images: [{
        type: String
    }]
}, { timestamps: true });

// Ensure unique unit number within a specific property
unitSchema.index({ property: 1, unitNumber: 1 }, { unique: true });

module.exports = mongoose.model('Unit', unitSchema);
