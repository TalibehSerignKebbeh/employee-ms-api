const asyncHandler = require('express-async-handler');
const { default: mongoose } = require('mongoose');
const Message = require('../Models/Message');

const AddMessage = asyncHandler(async (req, res) => {
    const { text, replyTo, user } = req.body;

    if (!text || (replyTo && !mongoose.Types.ObjectId(replyTo))
        || (user && !mongoose.Types.ObjectId(user)))
    {
        return res.status(400).json({message:'something went wrong in ur body'})
        }


})


const GetMessages = asyncHandler(async (req, res) => {
    // const updates = await Message.updateMany({}, {$set:{read_by:[]}})
    const page = Number(req.params.page) || Number(req.query.page) || 0;
    const pageSize = Number(req.params.pageSize) || Number(req.query.pageSize) || 10
    const messages = await Message.find().skip(page * pageSize).limit(pageSize).populate({ path: 'sender', select: '-password -salary' })
    // console.log(messages);
    return res.json(messages)
})

const GetTodoMessages = asyncHandler(async (req, res) => {
    // console.log('todo messages');
    const  id  = req.params.id || req.params.id;
    if (!id) {
        return res.status(400).json({ message: 'no data received' })
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'invalid data' })
    }
    const messages = await Message.find({ todo: id })
        .populate({ path: 'sender', select: '-password -salary' })
        .populate({ path: 'readers.user', select: '-password -salary',model:'Employee' })
        .populate({ path: 'reply_to', populate: { path: 'sender', select: '-password -salary' } }).exec()
    
        //   .populate({ path: 'read_by', select: '-password -salary',model:'Employee' })
        // .populate({ path: 'reads', select: '-password -salary', model:'Employee'})
    

    return res.json(messages)
    
})


module.exports = {GetMessages, GetTodoMessages, AddMessage}