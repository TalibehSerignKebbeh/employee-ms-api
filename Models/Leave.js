const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Employee'
    },
    createdby: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Employee'
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Employee'
    },
    category: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        default: new Date()
    },
    beginDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    accepted: {
        type: Boolean,
        default: false
    },
     rejected: {
        type: Boolean,
        default: false
    },
      isComplete: {
        type: Boolean,
        default: false
    }
},
    {
    timestamps: true
    }
)

module.exports = mongoose.model('Leave', leaveSchema)