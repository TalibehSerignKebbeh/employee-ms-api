require("dotenv").config();
require("express-async-errors");
const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const { parse } = require("url");
const { resolve, sep } = require("path");
const DbConnect = require("./config/DbConnect");
const path = require("path");
const corsOptions = require("./config/CorsOptions");
const asyncHandler = require("express-async-handler");
const { Server } = require("socket.io");
const Leave = require("./Models/Leave");
const Todo = require("./Models/Todo");
const Employee = require("./Models/EmpModel");
const VerifyJwtCred = require("./middleware/VerifyJwtCred");
const http = require("http");
const allowedOrigins = require("./config/AllowedOrigins");
const Message = require("./Models/Message");
const cron = require("node-cron");
const {ExpressValidator} = require('express-validator')
const isBefore  = require("date-fns/isBefore");
const parseISO = require("date-fns/parseISO");

const { adminRoles } = require("./config/adminRoles");
const format  = require("date-fns/format");
const isAfter  = require("date-fns/isAfter");

// const { Server } = require("socket.io");
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [...allowedOrigins],
    credentials: true,
    preflightContinue: true,
    },
   

  allowRequest: (req, callback) => {
    // console.log(req.headers.origin);
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      // console.log(`${origin} allowed`);
      req.headers["access-control-allow-credentials"] = origin;
      callback(null, true);
    } else {
      callback(new Error(`${origin} not allowed by cors`));
    }
  },
});
io.listen(4000)
io.setMaxListeners(100);

DbConnect();


io.on(`connection`, async(socket) => {
  console.log("connection");
  
  // console.log(socket.eventNames());
  socket.on('error', (errorData) => {
    console.log('error');
    console.dirxml(errorData)
    console.log(JSON.stringify(errorData));
    // console.log(socket._error());
  })


  socket.on(`message_send`, async ({ text, sender, todo, reply_to }) => {
    console.log("message receive");
    const newMessage = await Message.create({ text, sender, todo, reply_to });
    // console.log(newMessage);
    if (newMessage) {
      const message_data = await Message.findById(newMessage?._id)
        .populate({ path: "sender", select: "-password -salary" })
        .populate({
          path: "readers.user",
          select: "-password -salary",
          model: "Employee",
        })
        .populate({
          path: "reply_to",
          populate: { path: "sender", select: "-password -salary" },
        })
        .lean()
        .exec();
        
      
      socket.emit(`message_receive_${todo}`, message_data);
      socket.broadcast.emit(`message_receive_${todo}`, message_data);
    }
  });

  socket.on(`read_message`, async ({ id, userId, date }) => {
    // console.log({ id, userId, date });
    const messageInstance = await Message.findById(id).lean().exec();
    const read_users_ids = messageInstance?.readers?.map((read) => read?.user);
    if (read_users_ids?.includes(userId)) {
      return;
    }
    const readMessage = await Message.findByIdAndUpdate(id, {
      $push: { readers: { user: userId, date } },
    }).exec();
    if (readMessage) {
      const updatedMessage = await Message.findById(id)
        .populate({ path: "sender", select: "-password -salary" })
        
        .populate({
          path: "readers.user",
          select: "-password -salary",
          model: "Employee",
        })
        .populate({
          path: "reply_to",
          populate: { path: "sender", select: "-password -salary" },
        })
        .lean()
        .exec();
        
         // .populate({
        //   path: "reads",
        //   select: "-password -salary",
        //   model: "Employee",
        // })
        // .populate({
        //   path: "read_by",
        //   select: "-password -salary",
        //   model: "Employee",
        // })
      // console.log(updatedMessage);
      socket.emit(`read_message_${id}`, updatedMessage);
      socket.broadcast.emit(`read_message_${id}`, updatedMessage);
    }
  });

  socket.on(`enter_chat`, async ({ userId, chatId }) => {
    // console.log(userId, chatId);
    
    if (
      mongoose.Types.ObjectId.isValid(userId) &&
      mongoose.Types.ObjectId.isValid(chatId)
    ) {
        const user = await Employee.findById(userId).lean().exec();
    console.log('in chat ',user?.username);
      const results = await Todo.findByIdAndUpdate(chatId, {
        $addToSet: { active_users: userId },
      });
      // console.log(results);
      if (results) {
      console.log(results?.name);
        socket.broadcast.emit(`enter_chat_${chatId}`, userId);
        const messages = await Message.find({todo: chatId}).exec()
        socket.emit(`enter_chat_${chatId}`, messages);
      }
    }
  });

   socket.on(`leave_chat`, async ({ userId, chatId }) => {
    // console.log(userId, chatId);
    
    if (
      mongoose.Types.ObjectId.isValid(userId) &&
      mongoose.Types.ObjectId.isValid(chatId)
    ) {
        const user = await Employee.findById(userId).exec();
    console.log('leaving chat ',user?.username);
      const results = await Todo.findByIdAndUpdate(chatId, {
        $pull: { active_users: userId },
      });
      // console.log(results);
      if (results) {
        socket.broadcast.emit(`leave_chat_${chatId}`, userId);
        // socket.emit(`enter_chat_${chatId}`, userId);
      }
    }
  });

  socket.on(`user_typing`, async ({ userId, chatId }) => {
    if (
      mongoose.Types.ObjectId.isValid(userId) &&
      mongoose.Types.ObjectId.isValid(chatId)
    ) {
      const results = await Todo.findByIdAndUpdate(chatId, {
        $addToSet: { typing_users: userId },
      });
      if (results) {
        socket.broadcast.emit(`user_typing_${chatId}`, userId);
      }
    }
  });

  socket.on(`user_stop_typing`, async ({ userId, chatId }) => {
    if (
      mongoose.Types.ObjectId.isValid(userId) &&
      mongoose.Types.ObjectId.isValid(chatId)
    ) {
      const results = await Todo.findByIdAndUpdate(chatId, {
        $pull: { typing_users: userId },
      });
      if (results) {
        socket.broadcast.emit(`user_stop_typing_${chatId}`, userId);
      }
    }
  });
});

io.on('disconnect', (args) => {
  console.log(args);
})

io.on("greeting", (...args) => {
  console.log("greeting");
});



app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.static("public"));

// app.all("*", (req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000");
//   res.header("Access-Control-Allow-Methods", [
//     "GET",
//     "POST",
//     "PUT",
//     "DELETE",
//     "patch",
//   ]);
//   next();
// });

app.get(`/set`, async (req, res) => {
//   const todos = await Todo.find().exec();
//       const todosUpdates = await Promise.all(todos?.map(async (todo, index) => {
//       //    console.log(todo);
//           const todoIns = await Todo.findByIdAndUpdate(todo?._id, { $set: { collabs: todo?.collabs } }).exec()
//           const lastest = await Todo.findById(todo?._id).lean().exec()
//           return lastest;
//      }))
//   const todosUpdates = await Todo.updateMany(
//     {},
//     { $set: { active_users: [], typing_users: [] } }
//   );
    const initailUpdate = await Message?.updateMany({}, { $set: { readers: [] } })

    console.log("begining update",initailUpdate);
    const mesages = await Message.find().exec()
    const messagesUpdates = await Promise.all(mesages?.map(async (message) => {
        const messageInstance = await Message?.findById(message?._id).lean().exec()
        const readIds = messageInstance?.reads;
        const readIdsSets = readIds?.reduce((ids, id) => !ids?.includes(id) ? [...ids, id] : ids, [])
        const readSet = readIdsSets?.map(id => { return { user: id, date: new Date() } })
        console.log(`----------------------------------------\nMessage reads list start`);
        console.log(message?.readers);
        console.log(`Message reads list end`);
      


        const update = await Message.findByIdAndUpdate(message?._id, { $set: { readers: readSet } })
        const freshMessage = await Message.findById(message?._id).exec()
          console.log(`----------------------------------------\nMessage reads list updated start`);
        console.log(freshMessage?.readers);
        console.log(`Message reads list updated end`);
        
        return freshMessage;
    }))

    const messages = await Message.find().exec()
  return res.json({ message: `updates success`, data:messages  });
});

app.use("/auth", require("./routes/authRoutes"));
app.use("/employee", require("./routes/employeeRoutes"));
app.use("/leave", require("./routes/leaveRoutes"));
app.use("/todo", require("./routes/todoRoutes"));
app.use("/message", require("./routes/messageRoutes"));

app.get(
  "/dashboard_stats",
  VerifyJwtCred,
  asyncHandler(async (req, res) => {
    const roles = req?.roles || [];
    // const updates = await Employee.updateMany({ firstName: { $ne: null } }, { status: 'active' })
    // console.log(updates);
    if (adminRoles?.some((role) => roles?.includes(role))) {
      const employeeCount = await Employee.countDocuments();
      const activeEmployeeCount = await Employee.countDocuments({
        active: true,deleted:false
      });
      const leaveEmployeeCount = await Employee.countDocuments({
        current_leave: {$ne: null}
      });
      const deletedEmployeeCount = await Employee.countDocuments({
        deleted: true,
      });

      const leavesCount = await Leave.countDocuments();
      const pendingLeavesCount = await Leave.countDocuments({
        accepted: false,
      });
      const rejectedLeavesCount = await Leave.countDocuments({
        accepted: false,
        rejected: true,
      });
      const activeLeavesCount = await Leave.countDocuments({
        accepted: true,
        isComplete: false,
      });
      const acceptedLeavesCount = await Leave.countDocuments({
        accepted: true,
      });
      const completedLeavesCount = await Leave.countDocuments({
        isComplete: true,
      });

      const todoCount = await Todo.countDocuments();
      const deletedTodoCount = await Todo.countDocuments({ deleted: true });
      const pendingTodoCount = await Todo.countDocuments({ isComplete: false, deleted:false });
      const completedTodoCount = await Todo.countDocuments({
        isComplete: true,
      });

      return res.json({
        employeeCount,
        activeEmployeeCount,
        leaveEmployeeCount,
        deletedEmployeeCount,
        leavesCount,
        pendingLeavesCount,
        rejectedLeavesCount,
        activeLeavesCount,
        acceptedLeavesCount,
        completedLeavesCount,
        todoCount,
        pendingTodoCount,
        completedTodoCount,
        deletedTodoCount,
      });
    }
    const username = req.user;
    if (!username) return res.status(401).json({ message: "unauthorized" });

    const user = await Employee.findOne({ username: username }).exec();
    if (!user) return res.status(401).json({ message: "unidentified account" });
    const leavesCount = await Leave.countDocuments({ owner: user?.id });
    const pendingLeavesCount = await Leave.countDocuments({
      owner: user?.id,
      accepted: false,
    });
    const rejectedLeavesCount = await Leave.countDocuments({
      owner: user?.id,
      accepted: false,
      rejected: true,
    });
    const activeLeavesCount = await Leave.countDocuments({
      owner: user?.id,
      accepted: true,
      isComplete: false,
    });
    const acceptedLeavesCount = await Leave.countDocuments({
      owner: user?.id,
      accepted: true,
    });
    const completedLeavesCount = await Leave.countDocuments({
      owner: user?.id,
      isComplete: true,
    });

    const todoCount = await Todo.countDocuments({
      $or: [{ collabs: user?.id }, { createdBy: user?.id }],
    });
    const deletedTodoCount = await Todo.countDocuments({
      $or: [{ collabs: user?.id }, { createdBy: user?.id }],
      deleted: true,
    });
    const pendingTodoCount = await Todo.countDocuments({
      $or: [{ collabs: user?.id }, { createdBy: user?.id }],
      isComplete: false,
    });
    const completedTodoCount = await Todo.countDocuments({
      $or: [{ collabs: user?.id }, { createdBy: user?.id }],
      isComplete: true,
    });
    return res.json({
      leavesCount,
      pendingLeavesCount,
      rejectedLeavesCount,
      activeLeavesCount,
      acceptedLeavesCount,
      completedLeavesCount,
      todoCount,
      pendingTodoCount,
      completedTodoCount,
      deletedTodoCount,
    });
  })
);

app.get(
  `/updates`,
  asyncHandler(async (req, res) => {
    const employees = await Employee.find({ current_leave: {$ne: null} }).select('-password').lean();
    console.log(employees?.map((ep => ep?.current_leave)));
    if(!employees?.length) return res.status(400).json({message:'no data '})
    const updates = await Promise.all(employees?.map(async (emp) => {
      const currentLeaveData = await Leave.findById(emp?.current_leave).lean().exec()
      // console.log(isBefore(new Date(currentLeaveData?.endDate), new Date()));
      // console.log(currentLeaveData?.endDate?.toDateString());
      if (!currentLeaveData) {
           const newEmployee =  await Employee.updateOne({_id:emp?.id,}, {
           current_leave: null
      }, { new: true, lean: true, timestamps: true, })
        
      }
      else if (isBefore(new Date(currentLeaveData?.endDate), new Date())) {
      const newEmployee =  await Employee.updateOne({_id:emp?.id,}, {
          current_leave: null
      },
        // { new: true, lean: true, timestamps: true, }
      )
      }

      
      return {...emp}
    }))
    return res.json(updates);
  })
);



app.use("/", (req, res) => {
  const accept = req.headers["accept"];
  // console.log(accept);
  if (accept.includes("html")) {
    res.sendFile(path.join(__dirname, "views", "index.html"));
  } else if (accept.includes("json")) {
    res.json(`My Workshop Employee Management System`);
  } else {
    res.type("txt").send("My Workshop Employee Management System");
  }
});

mongoose.connection.once("open", () => {
  console.log("connected to mongoDb");
  server.listen(port, () => {
    console.log("server running on port", port);
  });
});
mongoose.connection.on("error", (err) => {
  console.log(err);
});



//mbassu

// cron.schedule('0 0 * * *', async () => {
//   try {
//     // Get the current date at midnight
//     const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);
//     //   startOfDay.setMonth(5)
//     //   startOfDay.setDate(1)
//     //   console.log(startOfDay);
//       const endOfDay = new Date()
//       endOfDay.setHours(23,59,59,10)

//     // Find all leaves that start on the current date
//       const leavesToStartToday = await Leave.find({
//           beginDate: {
//               $gte: startOfDay,
//               $lte: endOfDay
//           },
//           accepted:true,
//       }).exec();
//     console.log(leavesToStartToday.length);
//     // Update the onLeave status of the corresponding employees to true
//       const employeeIdsOnLeave = leavesToStartToday.map((leave) => leave?.owner);
//     await Employee.updateMany(
//       { _id: { $in: employeeIdsOnLeave } },
//       { onLeave: true }
//     ).exec();

//     //   const leavesToEndToday = await Leave.find({
//     //       endDate: {
//     //           $gte: startOfDay,
//     //           $lte: endOfDay
//     //       },
//     //       accepted:true,
//     //   }).exec();
//     //   const employeeIdsOnLeaveToEndToday = leavesToEndToday.map((leave) => leave?.owner);
//     // await Employee.updateMany(
//     //   { _id: { $in: employeeIdsOnLeaveToEndToday } },
//     //   { onLeave: false, current_leave:null }
//     // ).exec();
//     console.log('Cron job executed successfully.');
//   } catch (error) {
//     console.error('Error in cron job:', error);
//   }
// });
// cron.schedule('0 0 * * *', async () => {
//   try {
//     // Get the current date at midnight
//     const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);
//     //   startOfDay.setMonth(5)
//     //   startOfDay.setDate(1)
//     //   console.log(startOfDay);
//       const endOfDay = new Date()
//       endOfDay.setHours(23,59,59,10)

//     // Find all leaves that start on the current date
//       const leavesToday = await Leave.find({
//           beginDate: {
//               $gte: currentDate,
//               $lte: endDate
//           },
//           accepted:true,
//       }).exec();
//     console.log(leavesToday.length);
//     // Update the onLeave status of the corresponding employees to true
//       const employeeIdsOnLeave = leavesToday.map((leave) => leave?.owner);
//     await Employee.updateMany(
//       { _id: { $in: employeeIdsOnLeave } },
//       { onLeave: true }
//     ).exec();

//     console.log('Cron job executed successfully.');
//   } catch (error) {
//     console.error('Error in cron job:', error);
//   }
// });
