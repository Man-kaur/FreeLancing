const mongoose = require('mongoose');

const inviteTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '24h'
    }
})

module.exports = mongoose.model('InviteToken', inviteTokenSchema);