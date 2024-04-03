const {body } = require('express-validator')
const Employee = require('../Models/EmpModel')

const validateEmployee = [
    body('username')
        .notEmpty({ ignore_whitespace: true })?.withMessage('username cannot be empty')
        .trim()?.withMessage('username cannot contain spaces')
        .escape()?.withMessage('invalid, html string not allowed')
        .matches(/^[a-zA-Z0-9_-]+$/)
        ?.withMessage('invalid username')
        .isLength({ min: 5, max: 20 })?.withMessage('username must has length betwenn 5 to 15 characters')
        .custom(async (value) => {
            const existingEmployee = await Employee.findOne({ username: value }).exec();
            if (existingEmployee) {
                return Promise.reject('Username already exists');
            }
        }),

    body('email').notEmpty({ ignore_whitespace: true })?.withMessage('email cannot be empty')
        .escape()?.withMessage('invalid, html string not allowed')
        .isEmail()?.withMessage('invalid email')
        .custom(async (value) => {
            const existingEmployee = await Employee.findOne({ email: value }).exec();
            if (existingEmployee) {
                return Promise.reject('Email already exists');
            }
        }),

    body('public_name').notEmpty({ ignore_whitespace: true })?.withMessage('public name cannot be empty')
        .trim()
        .escape()?.withMessage('invalid, html string not allowed')
        .isLength({ min: 3, max: 15 })
        ?.withMessage('public name must be between 3 to 15 characters lenght')
        .custom(async (value) => {
            const existingEmployee = await Employee.findOne({ public_name: value }).exec();
            if (existingEmployee) {
                return Promise.reject('Public name already exists');
            }
        }),
    body('firstName').notEmpty({ ignore_whitespace: true })?.withMessage('firstName cannot be empty')
        .escape()?.withMessage('invalid, html string not allowed')
        .isLength({ min: 1, max: 20 })?.withMessage('firsName must has les than or equal to 15 characters')
    ,
    body('lastName').notEmpty({ ignore_whitespace: true })?.withMessage('lastName cannot be empty')
        .escape()?.withMessage('invalid, html string not allowed')
        .isLength({ min: 1, max: 20 })?.withMessage('lastName must has les than or equal to 15 characters'),
    body('middleName')
        .isLength({min:0,max:15}).withMessage('middleName cannot exceed 15 characters length')
        .escape().withMessage('invalid, html string not allowed')
        .isLength({ max: 20 })?.withMessage('middleName must has les than or equal to 15 characters'),
     
    body('address').notEmpty({ ignore_whitespace: true })?.withMessage('address cannot be empty')
        .escape()?.withMessage('invalid, html string not allowed')
        .isLength({ max: 20 })?.withMessage('address must has les than or equal to 15 characters')
    ,
    body('jobTitle').notEmpty({ ignore_whitespace: true })?.withMessage('job title cannot be empty')
        .escape()?.withMessage('invalid, html string not allowed')
        .isLength({ max: 20 })?.withMessage('job title must has les than or equal to 15 characters')
    ,
    body('salary').notEmpty()?.withMessage('salary cannot be empty')
        .isNumeric()?.withMessage('salary shoud be a number')
    ,
    body('dob').notEmpty({ ignore_whitespace: true })?.withMessage('date of birth cannot be empty')
        .isDate()?.withMessage('date of birth is not a valid date')
        // .isBefore()
    ,
    body('password').notEmpty({ ignore_whitespace: true })?.withMessage('password cannot be empty')
        .isLength({ min: 5, max: 15 })?.withMessage('password must be between 5 to 15 characters length ')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!#@$&*?]).{5,}$/)?.withMessage('invalid password')
         
    //  .isCurrency({})
];


module.exports = { validateEmployee }


