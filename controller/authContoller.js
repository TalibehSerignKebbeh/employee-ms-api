const Employee = require('../Models/EmpModel');
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');

const login = asyncHandler(async (req, res) => {
    // return res.status(500)
    const { username, password } = req.body;
    
    if (!username || !password) return res.status(400).json({ message: "All fields are required" });
    // console.log({ username, password });
    const employee = await Employee.findOne({ username }).collation({ locale: 'en', strength: 2 }).exec();
    if (!employee) return res.status(400).json({ message: "invalid credentials" });
    // if(employee.deleted === true) return res.status()

    const passwordMatch =  bcrypt.compare(employee.password, password);

    if (!passwordMatch) return res.status(400).json({ message: "invalid credentials" });
     const accessToken = jwt.sign({
            "UserInfo": {
                "username": employee?.username,
             "roles": employee?.roles,
                "status": employee?.status
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1d' }
    )
    const refreshToken = jwt.sign(
        { "username": employee.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    // Create secure cookie with refresh token 
    res.cookie('jwt', refreshToken, {
        httpOnly: true, //accessible only by web server 
        secure: true, //https
        sameSite: 'None', //cross-site cookie 
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT

    })
        

    return res.json({
        accessToken,
                profile: employee?.profile

    })
    
    

})

const refreshToken = async (req, res) => {
    const cookies = req.cookies
    
    if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" })

    const refreshToken = cookies?.jwt;

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'forbidden' });
            const employee = await Employee.findOne({ username: decoded.username }).collation({ locale: 'en', strength: 2 }).exec();
            if (!employee) return res.status(401).json({ message: 'unathorized' })
            const accessToken = jwt.sign({
                'UserInfo': {
                    'username': employee.username,
                    'roles': employee.roles,
                     "status": employee?.status,
                }
            },
                process.env.ACCESS_TOKEN_SECRET,
                {expiresIn: '1d'}

            )

            return res.json({
                accessToken,
                profile: employee?.profile
            })
        })
    )
    
}

const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.status(204);
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.json({message: 'cookie cleared'})
}


module.exports = {login, refreshToken, logout};