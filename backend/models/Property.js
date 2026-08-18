const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    propertyName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['House', 'Apartment', 'Shop'],
        required: true
    },
    totalUnits: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    images: [{
        type: String // Array of image URLs
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

propertySchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('Property', propertySchema);
