const jwt = require('jsonwebtoken')

const VerifyJwtCred = async(req, res, next) => {
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization

    if (!authHeader?.startsWith('Bearer ')) {
        console.log("Bearer missing ");
        return res?.status(401).json({ message: 'unauthorized' })
    }
//    console.log(authHeader);
    const token = authHeader.split(' ')[1];
    jwt.verify(token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            // console.log('decoded infor');
            // console.log(decoded);
            if (err) return res.status(403).json({ message: 'forbidden' })
            req.user = decoded?.UserInfo?.username
            req.roles = decoded?.UserInfo?.roles
            next()
       } 
    )
}

module.exports = VerifyJwtCred;