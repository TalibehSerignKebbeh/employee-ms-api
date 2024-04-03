const express = require('express')
const router = express.Router()
const { getTodos, createTodo, updateTodo, deletedTodo, getSingleTodo } = require('../controller/todoController')
const VerifyJwtCred = require('../middleware/VerifyJwtCred')

router.use(VerifyJwtCred)
router.route('/')
    .get(getTodos)
    .post(createTodo)
    .patch(updateTodo)
    .delete(deletedTodo)
router.route('/:id')
    .get(getSingleTodo)
    .delete(deletedTodo)
    .put(updateTodo)

module.exports = router