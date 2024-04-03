const mongoose = require('mongoose')
const asyncHandler = require('express-async-handler')
const Leave = require('../Models/Leave');
const Employee = require('../Models/EmpModel');
const Roles = require('../config/Roles')

const getLeaves = asyncHandler(async (req, res) => {
    // return res.status(400).json({message:'some generated error'})
    const page = +req.params.page || +req.query.page || 0;
    const pageSize = +req.params.pageSize || +req.query.pageSize || 0;
    const userId = req.params.userId || req.query.userId;
    let filters = {};

    const roles = req.roles;
    const username = req.user;
    const user = await Employee.findOne({ username }).select('-password').exec()

    if (user && (!user?.roles?.includes(Roles.admin) && !user?.roles?.includes(Roles?.ceo))) {
        filters.owner = user?.id;
    }
    const leavesList = await Leave.find(filters).sort({ createdAt: -1 })
        .populate({ path: 'owner', select: '-password -salary' })
        .populate({ path: 'createdby', select: '-password -salary' })
        .populate({ path: 'acceptedBy', select: '-password -salary' })
        .skip(+page * +pageSize).limit(+pageSize)
        .lean().exec()
    //    await Leave.updateMany({accepted:true}, {$set:{isComplete:false}})
    const total = await Leave.countDocuments(filters).exec()
    return res.json({ leaves: leavesList, total })





})
const Apply = asyncHandler(async (req, res) => {
    const { owner, createdDate, category, beginDate, endDate, createdBy } = req.body;
    if (!owner || !category || !beginDate || !endDate || !createdBy) {
        return res.status(400).json({ message: 'all fields are required' })
    }

    const creator = await Employee.findById(createdBy).collation({ locale: 'en', strength: 2 }).exec()

    if (creator?._id === owner) {
        const newLeave = await Leave.create({ owner, createdDate, createdby: owner, beginDate, endDate, category });
        creator.onLeave = true;
        creator.current_leave = newLeave?.id;;
        await Employee.findByIdAndUpdate(creator?.id, { current_leave: newLeave?.id })
        return res.json({ message: "leave booked successfully" })
    } else {

        const newLeave = await Leave.create({ owner, createdDate, createdby: creator._id, beginDate, endDate, category });

        const leavEmp = await Employee.findByIdAndUpdate(owner, { onLeave: true, current_leave: newLeave?.id })
        return res.json({ message: `leave booked successfully` })
    }

})

const completeChange = asyncHandler(async (req, res) => {

    // let id = '';
    let id = req.query.id || req.params.id || '';
    let newUpdate = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid parameter(s)" })
    }
    // return res.json({message:'good message'})
    const leave = await Leave.findById(id).exec();
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    // console.log("leave status before",leave.accepted);
    const updatedLeave = await Leave.findByIdAndUpdate(id, { ...newUpdate });
    if (!updatedLeave) return res.status(400).json({ message: "leave not found" })
    // console.log("leave status after",updatedLeave.accepted);
    // const usersCurrentLeaves = await Leave.findOne({
    //     isComplete: false, owner: leave?.owner
    // }).exec();
    const usersCurrentLeaves = await Leave.findById(id).exec();

    let isEmplyeeOnLeave = usersCurrentLeaves ? true : false;
    await Employee.findByIdAndUpdate(updatedLeave.owner, {
        $set: {
            onLeave: isEmplyeeOnLeave,
            current_leave: isEmplyeeOnLeave ? updatedLeave?.id : null
        }
    }).lean().exec()
    // const ownerId = updatedLeave.owner;
    // const owner = await 
    // if(!owner) return res.status(400).json({message: "leave owner not found"})

    return res.json({ message: `update success` })
})

const acceptOrReject = asyncHandler(async (req, res) => {
    let id = req.query.id || req.params.id;
    const { accepted, rejected } = req.body;
    //    console.log(req.query);
    //    console.log(req.params);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid parameter(s)" })
    }
    if (typeof accepted !== 'boolean' || typeof rejected !== 'boolean') {
        return res.status(400).json({ message: "Invalid request body" })
    }
    const leave = await Leave.findById(id).exec();

    if (!leave) return res.status(400).json({ message: 'data not found' })

    const update = await Leave.findByIdAndUpdate(id, {
        accepted: accepted,
        rejected: rejected
    }).exec()

    if (update) {
        if (accepted) {
            await Employee.findByIdAndUpdate(update?.owner, { current_leave: update?.id })
        }
        if (rejected) {
            await Employee.findByIdAndUpdate(update?.id, { current_leave: null })
        }
        return res.json({ message: 'leave updated' })
    }
    return res.status(400).json({ message: 'something went' })
})

const deletePermanently = asyncHandler(async (req, res) => {

    let id = req.query.id || req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid parameter(s)" })
    }

    const leave = await Leave.findById(id).exec();
    if (!leave) return res.status(400).json({ message: 'Leave not found' });

    // check if leave is accepted and modify the employee status
    if (leave?.accepted) {
        const employee = await Employee.findById(leave?.owner).exec()
        if (employee && employee?.current_leave?.toString() === id) {
            await Employee.findByIdAndUpdate(leave.owner, {
                $set: {
                    onLeave: false,
                    current_leave: null
                }
            }).lean().exec()

        }
    }
    const deleted = await Leave.findOneAndRemove(id).lean().exec()
    // console.log(deleted);
  return res.json({ message: `leave deleted successfully` })

})

module.exports = {
    getLeaves, Apply, completeChange,
    acceptOrReject,
    deletePermanently
}