const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Link to the user account for portal access
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    emergencyContact: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        relation: {
            type: String
        }
    },
    // We can track current unit via the lease contract, but keeping a direct reference is handy
    currentUnit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
