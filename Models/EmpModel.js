const mongoose = require('mongoose');
// const AutoIncrement = require("mongoose-sequence")(mongoose)


const EmpSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    middleName: {
        type: String,
        required: false,
        default: ""
    },

    lastName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
     gender: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,

    },
    status: {
        type: String,
        default: 'active'
    },
    public_name: {
        type: String,
        required: false,
        unique: true,

    },
    password: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true,

    },
     telephone: {
        type: Number,
         required: true,
        unique: true,

    },
    salary: {
        type: Number,
        required: true
    },
    roles: {
        type: [String],
        default: ["employee"]
    },
    jobTitle: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default:  Date.now
    },
    dob: {
        type: Date,
        required: false
    },
    profile: {
        type: String,
        required: false,
    },
     current_leave: {
        type: mongoose.Types.ObjectId,
         required: false,
        ref:'Leave'
    },
    active: {
        type: Boolean,
        default: false,
    },
    onLeave: {
        type: Boolean,
        default: false,
    },
    retired: {
        type: Boolean,
        default: false,
    },
    deleted: {
        type: Boolean,
        default: false,
    },

},
    {
    timestamps: true
}
)


module.exports = mongoose.model("Employee", EmpSchema);




// const db = connect("mongodb://localhost:27017/mydb"); // Replace with your MongoDB connection string and database name

// const userIdToExclude = "USER_ID_TO_EXCLUDE";

// // Query all messages where the 'reads' array does not contain the specified user id
// const messages = db.messages.find({
//   reads: {
//     $not: {
//       $elemMatch: { userId: userIdToExclude }
//     }
//   }
// });

// // To print the result
// messages.forEach((message) => {
//   printjson(message);
// });
