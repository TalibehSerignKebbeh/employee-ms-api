const express = require('express')
const router = express.Router();
const { createEmployee, getEmployees,
    updateEmployee, deleteEmployee,
    updateEmployeeProfile, 
    updateMyProfile,
    getProfile}
    = require('../controller/employeeController')
const VerifyJwtCred = require('../middleware/VerifyJwtCred')
const {validateEmployee} = require('../middleware/ValidateEmployee')
// const validateEmployee = require('../middleware/ValidateEmployee')

const {body } = require('express-validator')
const Employee = require('../Models/EmpModel')


router.use(VerifyJwtCred)
router.route('/')
    .get(getEmployees)
    .post(validateEmployee, createEmployee)
    .put(updateEmployee)
router.route('/profile').get(getProfile)

router.route('/:id')
    .delete(deleteEmployee)
    .put(updateEmployeeProfile)
    .patch(updateMyProfile)


module.exports = router;