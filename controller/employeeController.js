const mongoose = require('mongoose')
const Employee = require('../Models/EmpModel')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const Roles = require('../config/Roles')
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator')
const mongodb = require('mongodb')


const getEmployees = asyncHandler(async (req, res) => {
    const employees = await Employee.find()
        .populate({ path: 'current_leave', })
        .sort({ createdAt: -1 }).select('-password').lean().exec();


    // if (!employees.length) {
    //     return res.status(204).json({ message: "Whoops! No employee on database" })
    // }
    employees.map(emp => {
        const middleName = emp?.middleName+" " || '';
        emp.fullName = emp?.firstName +" "+middleName+ ""+ emp?.lastName
    })

    return res.json(employees)
})

const createEmployee = asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    console.log(errors?.array());
    const { firstName, middleName,public_name, dob,
        lastName, address, username, password,
        email, telephone, salary, roles,
        jobTitle, gender, profile } = req.body;
    if (!firstName || !dob || !lastName || !address || !username || !email ||
        !telephone || !salary || !roles?.length || !jobTitle || !gender) {
          return res.status(400).json({message: "All fields are required"})            
        }  
    const duplicateEmp = await Employee.findOne({ username }).collation({locale: 'en', strength: 2}).exec();
    if (duplicateEmp) {
        return res.status(400).json({ message: "username already exist boss ", })
    }
    const duplicateEmpEmail = await Employee.findOne({ email }).collation({ locale: 'en', strength: 2 }).exec();
    if (duplicateEmpEmail) {
         return res.status(400).json({message: "email already exist"})
    }
    let hashPass =""
    if (password) {
        hashPass = bcrypt.hashSync(password, 13)
    }else{hashPass = bcrypt.hashSync("pass123", 13)}
    const newEmployee = await Employee.create({ firstName, middleName, dob, lastName, public_name, address, username, password: hashPass, email, telephone, salary, roles, jobTitle, gender, profile })
    if (newEmployee) {
        
    return res.status(200).json({ message: 'employee successfully created' })
    }
    return res.status(400).json({ message: 'unknow error ocurred' })

}
)
const updateEmployee = asyncHandler(async (req, res) => {
       return res.status(400).json({message:'error message'})
    
    const { _id, firstName, middleName,
        lastName,public_name, username,
        password, email, salary, telephone,
        roles, jobTitle, active, onLeave,
        retired, dob } = req.body;
    const user = req.user;
    const persone = await Employee.findOne({ username: user }).collation({ locale: 'en', strength: 2 }).exec();
    
    const employee = await Employee.findById(_id).exec();
    if (!employee && req?.file?.filename) {
        fs.unlink(path.join(__dirname), "images", req.file.filename, (err) => {
            if(err) return res.status(400).json({})
        })
        return res.status(400).json({ message: "Employee not found" });
    }
    const duplicateEmp = await Employee.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec();
    if (duplicateEmp && duplicateEmp._id.toString() !== _id) {
        return res.status(400).json({ message: "Duplicate username" });
    }
    employee.firstName = firstName;
    employee.lastName = lastName;
    employee.middleName = middleName;
    employee.username = username;
    employee.email = email;
    employee.salary = salary;
    employee.dob = dob;
    employee.public_name = public_name;
    employee.telephone = telephone;
    employee.roles = roles;
    employee.jobTitle = jobTitle;
    employee.active = active;
    employee.onLeave = onLeave;
    employee.retired = retired;
    if (req?.file?.filename) {
       employee.profile = req?.file?.filename;
    }
    if (password) {
        employee.password = await bcrypt.hashSync(password, 13);
    }
    const updated = await Employee.findByIdAndUpdate(_id, { ...employee },{timestamps:true});
    if (updated) {
    return res.json({ message: `user successfully updated` })
    }
    return res.status(400).json({message:'unknown error occured'})

}
)

const updateEmployeeProfile = asyncHandler(async (req, res) => {
    
    const { _id, firstName, middleName,
        lastName,public_name, username,
        password, email,  telephone,
          dob, profile } = req.body;
    const user = req.user;
    const persone = await Employee.findOne({ username: user }).collation({ locale: 'en', strength: 2 }).exec();
   
    const employee = await Employee.findById(_id).exec();
    
    if (!employee) {
        return res.status(400).json({ message: "data not found" });
    }
    const duplicateEmp = await Employee.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec();
    if (duplicateEmp && duplicateEmp._id.toString() !== _id) {
        return res.status(400).json({ message: "Duplicate username" });
    }
    employee.firstName = firstName;
    employee.lastName = lastName;
    employee.middleName = middleName;
    employee.username = username;
    employee.email = email;
    employee.dob = dob;
    employee.profile = profile;
    // employee.public_name = public_name;
    employee.telephone = telephone;
   
    if (password) {
        employee.password = await bcrypt.hashSync(password, 13);
    }
    const updated = await Employee.findByIdAndUpdate(_id, { ...employee });
    if (updated) {
    return res.json({ message: `profile successfully updated` })
    }
    return res.status(400).json({message:'unknown error occured'})

}
)

const updateMyProfile = asyncHandler(async (req, res) => {

    const { _id, firstName, middleName,
        lastName,public_name, username,
        password, email,  telephone,
          dob, profile } = req.body;
    const user = req.user;
    const persone = await Employee.findOne({ username: user }).collation({ locale: 'en', strength: 2 }).exec();
    if (!persone) {
       return res.status(400).json({message:'missing data'})
   }
    const employee = await Employee.findById(_id).exec();
    
    const duplicateEmp = await Employee.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec();
    if (duplicateEmp && duplicateEmp._id.toString() !== _id) {
        return res.status(400).json({ message: "Duplicate username" });
    }
    employee.firstName = firstName;
    employee.lastName = lastName;
    employee.middleName = middleName;
    employee.username = username;
    employee.email = email;
    employee.dob = dob;
    employee.profile = profile;
    // employee.public_name = public_name;
    employee.telephone = telephone;

    if (password) {
        employee.password = await bcrypt.hashSync(password, 13);
    }
    const updated = await Employee.findByIdAndUpdate(_id, { ...employee },
        { new: true, lean: true, timestamps: true, populate: { path: 'current', justOne: true } }
    ).select('profil');
    if (updated) {
        return res.json({
            message: `profile successfully updated`,
    employee: updated,   })
    }
    return res.status(400).json({message:'unknown error occured'})

}
)

const acceptEmployee = asyncHandler(async (req, res) => {
    const { id } = req.body
    const user = req?.user;
    const roles = req?.roles
    if(!user || !roles.length>0) return res.status(401).json({message: 'Unauthorized'})
    if (!id) {
        return res.status(400).json({ message: 'Invalid data on request body' })
    }
    const currentUser = await Employee.findOne({ username: user }).collation({ locale: 'en', strength: 2 }).exec();
    if (!currentUser?.roles?.includes(Roles.admin) && !currentUser?.roles?.includes(Roles.manager)) {
         return res.status(400).json({message: "Unathorized"})
     }
    const employee = await Employee.findById(id).lean().exec()
    if (!employee) return res.status(400).json({ message: "Employee does not exist" })
    employee.active = !employee.active;
    const updatedUser = await Employee.findByIdAndUpdate(id, {active: !employee?.active})
    if (updatedUser) {
    return res.json(updatedUser)
    }
    return res.status(400).json({message:'unknown error occured'})
})


const deleteEmployee = asyncHandler(async (req, res) => {
    const  id  = req.params.id || req.query.id;
    const user = req?.user;
    const roles = req?.roles;
    // console.log("Employees requested");
    // console.log({id, user, roles });
    if(!user || !roles.length>0) return res.status(401).json({message: 'Unauthorized'})
    if (!id) {
        return res.status(400).json({ message: 'Invalid data on request body' })
    }
    const currentUser = await Employee.findOne({ username: user }).collation({ locale: 'en', strength: 2 }).exec();
    if (!currentUser?.roles?.includes(Roles.admin) && !currentUser?.roles?.includes(Roles.manager)) {
         return res.status(400).json({message: "Unathorized"})
     }

    const employee = await Employee.findById(id).exec();
    if (!employee) return res.status(404).json({ message: "Data not found" })
    employee.deleted = !employee.deleted;
    const updatedEmployee = await Employee.findByIdAndUpdate(id, {deleted: employee.deleted})
    // console.log(updatedEmployee);
    const deleteStatus = updatedEmployee?.deleted? "Deleted": "Un Deleted"
    if (updatedEmployee) return res.status(200).json({ message: `employee with ${updatedEmployee.username} ${deleteStatus}` });
    
    return res.status(400).json({ message: `employee does not exist` })
})

const getEmpStatistics = asyncHandler(async (req, res) => {
    const activeCount = await Employee.countDocuments({ active: true })
    const leaveCount = await Employee.countDocuments({ onLeave: true })
    const deletedCount = await Employee.countDocuments({ deleted: true })

    return res.json({
        activeCount,
        leaveCount,
        deletedCount
    })
    
})

const getProfile = asyncHandler(async (req, res) => {
    const username = req.user;
    if (!username?.length) {
        return res.status(400).json({message:'invalid data'})
    }

    const profile = await Employee.findOne({username}).select('-password').lean().exec()
    return res.json(profile)
 })

module.exports =
{
    createEmployee, getEmployees,
    updateEmployee, deleteEmployee,
    acceptEmployee, getEmpStatistics,
    updateEmployeeProfile, updateMyProfile,
    getProfile
}
