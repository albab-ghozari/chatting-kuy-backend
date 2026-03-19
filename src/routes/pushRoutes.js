const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')
const { subscribe, unsubscribe } = require('../controllers/pushController')

router.use(verifyToken)
router.post('/subscribe', subscribe)
router.post('/unsubscribe', unsubscribe)

module.exports = router