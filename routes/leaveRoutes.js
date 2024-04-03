const express = require('express')
const router = express.Router();
const VerifyJwtCred  = require('../middleware/VerifyJwtCred');

const { getLeaves, Apply, acceptOrReject,
    completeChange, deletePermanently
} = require('../controller/leaveController')
router.use(VerifyJwtCred)
router.route('/')
    .get( getLeaves)
    .post(Apply)
    .patch(acceptOrReject)
router.route('/:id')
    .put(completeChange)
    .post(acceptOrReject)
    .delete(deletePermanently)
// router.route('/').get(getLeaves)
// router.route('/apply').post(Apply)
// router.route('/:id').patch(acceptOrReject)


module.exports = router