const mongoose = require('mongoose')
const Todo = require('../Models/Todo')
const Employee = require('../Models/EmpModel')
const Message = require('../Models/Message')
const asyncHandler = require('express-async-handler')
const Roles = require('../config/Roles')


const getTodos = asyncHandler(async (req, res) => {

    // console.log(req.query.page); 
    // console.log(req.query.pageSize); 
    const page = Number(req.query.page) || 0;
    const pageSize = Number(req.query.pageSize) || 5;
      let filters = {};

    const roles = req.roles;
    const username = req.user;
    const user = await Employee.findOne({ username }).select('-password').exec()
    
    if (user && (!user?.roles?.includes(Roles.admin) && !user?.roles?.includes(Roles?.ceo))) {
        filters = { $or: [{ collabs: user?.id }, {createdBy:user?.id}]};
    }
     filters ={...filters,deleted:false}
    const todosList = await Todo.find({...filters})
        .populate({ path: 'createdBy', select: '-password' })
        .populate({ path: 'collabs', select: '-password' })
        .populate({ path: 'notifications', match:{reads: user?.id} })    
        .sort({ isComplete: 1 })
        .skip(+page * +pageSize)
        .limit(+pageSize)
        .lean().exec()
    // const todoWithMessages = await Promise.all(todosList?.map(async (todo) => {
    //     const messages = await Message.find({ todo: todo?._id,reads: { $nin: [user?.id] } }).exec()
    //     return {...todo, messages}
    // }))
    
    const total = await Todo.countDocuments({...filters}).exec()
    
    return res.json({todos: todosList, total})
    
})
const createTodo = asyncHandler(async (req, res) => {
    const { createdBy, name, dateLine, collabs, createdAt } = req.body
    if (!createdBy || !name || !dateLine) {
        return res.status(400).json({ message: "All fields are required" })
    }
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
        return res.status(400).json({ message: "invalid user parameters" })
    }
    const employee = await Employee.findById(createdBy).lean().exec();
    if (!employee) return res.status(400).json({ message: "Employee not found" })

    await Todo.create({ createdBy, name, dateLine, collabs, createdAt })
    return res.json({ message: "Todo successfully created" })
})

const updateTodo = asyncHandler(async (req, res) => {
    const { _id, name, isComplete,dateLine, deleted, collabs } = req.body
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid todo id" })
    }
    if (!_id || !name || !dateLine || !typeof (isComplete) === Boolean || !typeof (deleted) === Boolean || !Array.isArray(collabs)) {
        return res.status(400).json({ message: "All fields are required" })
    }
    const duplicateTodo = await Todo.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean().exec();
    if (duplicateTodo && duplicateTodo?._id?.toString() !== id) {
        return res.status(400).json({ message: "Duplicate todo name" })
    }
    const updatedTodo = await Todo.findByIdAndUpdate(id, { name, isComplete, deleted,dateLine, $set: { collabs: collabs } }).lean().exec();
    if (updatedTodo) {
    return res.json({ message: `Todo updated` });
    }
    return res.status(400).json({ message: `unknown error` });

})
const deletedTodo = asyncHandler(async (req, res) => {

    const { id } = req.query;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "invalid object id" });
    }
    const todo = await Todo.findById(id).lean().exec();
    if (!todo) return res.json({ message: 'data not found' })

    const update = await Todo.findByIdAndUpdate(id, { deleted: !todo.deleted }).lean().exec();

    // const successMessage = updated.deleted ? "deleted" : "renewed"
    return res.json({ message: `update success` })

})


const getSingleTodo = asyncHandler(async (req, res) => {
    const id = req.params.id || req.query.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({message:'invalid data'})
    }
    const todo = await Todo.findById(id)
        .populate({ path: 'createdBy', select: '-password -salary' })
        .populate({ path: 'collabs', select: '-password -salary' })
        // .populate({path:'active_users',select: '-password -salary'})
        // .populate({path:'typing_users',select: '-password -salary'})
        .lean().exec()
//     active_users
// typing_users
    if (todo) {
        return res.json(todo)
    }
    return res.status(400).json({message:'not found'})
})

module.exports = {
    getTodos, createTodo,
    updateTodo, deletedTodo,
    getSingleTodo
}