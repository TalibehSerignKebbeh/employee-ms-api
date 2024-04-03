const mongoose = require('mongoose')

const readSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee',
    },
     date: {
         type: Date,
         default: new Date()
    },
})
const messageSchema = mongoose.Schema({
    text: {
        type: String,
    },
    sender: {
        type: mongoose.Types.ObjectId,
        ref: 'Employee',
        required:false
    },
    reads: {
        type: [mongoose.Types.ObjectId],
        default: [],
        ref:'Employee'
    },
    readers: [readSchema],
    // readers:[readSchema],
    read_by: [{
        type: mongoose.Types.ObjectId,
        ref: 'Employee'
    }],
    //  fans: [{ type: Schema.Types.ObjectId, ref: 'Person' }]
    delivered: {
        type: Boolean,
        default: true,
        
    },
    deleted: {
        type: Boolean,
        default: false,
    },
     deleted_by: {
       type: mongoose.Types.ObjectId,
        ref: 'Employee',
        required:false
    },
    time_delivered: {
        type: Date,
        default: new Date(),
       required:false

    },
    is_reply: {
         type: Boolean,
        default:false,
    },
    reply_to: {
        type: mongoose.Types.ObjectId,
        ref: 'Message',
        required: false,
        // default:'',
    },
    todo: {
        type: mongoose.Types.ObjectId,
        ref: 'Todo',
    }

})


module.exports = mongoose.model("Message", messageSchema)