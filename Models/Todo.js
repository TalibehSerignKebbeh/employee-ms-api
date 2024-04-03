const mongoose = require('mongoose')


const TodoSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    isComplete: {
        type: Boolean,
        default: false
    },
     deleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Employee'
    },
    dateLine: {
        type: Date,
        required: true
    },
    active_users:[{type:mongoose.Types.ObjectId, ref:'Employee'}],
    typing_users:[{type:mongoose.Types.ObjectId, ref:'Employee'}],
    collabs: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        required: false,
        ref: 'Employee'
    }
},
     {
    timestamps: true
}
)

// Same example as 'Populate Virtuals' section
TodoSchema.virtual('notifications', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'todo',
//   match: id=>({read_by: id}) // match option with basic query selector
});


module.exports = mongoose.model("Todo", TodoSchema);