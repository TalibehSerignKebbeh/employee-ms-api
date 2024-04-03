const mongoose = require("mongoose");

const DbConnect = async () => {
    await mongoose.connect(process.env.LOCAL_DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
        .catch(err => {
        console.log(err);
    })
}

module.exports = DbConnect;
