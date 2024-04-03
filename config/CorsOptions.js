const allowedOrigins = require('./AllowedOrigins')

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins?.indexOf(origin) !== -1 || !origin) {
             callback(null, true)
        } else{
            //  callback(null, true)
            callback(new Error('Not allowed by cors'))
        }
    },
    credentials: true,
    // AllowCredentials: false,
    optionsSuccessStatus: 200
}

module.exports = corsOptions;