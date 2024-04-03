const express = require('express')
const {AddMessage,GetMessages,GetTodoMessages} = require('../controller/messageController')
const router = express.Router()


router.route('/').get(GetMessages)

router.route('/:id').get(GetTodoMessages)



module.exports = router;