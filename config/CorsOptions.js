const allowedOrigins = require('./AllowedOrigins')

const corsOptions = {
    origin: (origin, callback) => {
        console.log(allowedOrigins?.indexOf(origin));
        if (allowedOrigins?.indexOf(origin) !== -1) {
             callback(null, true)
        } else{
            //  callback(null, true)
            callback(new Error(`origin ${origin} not allowed by cors`))
        }
    },
    credentials: true,
    // AllowCredentials: false,
    optionsSuccessStatus: 200
}

module.exports = corsOptions;