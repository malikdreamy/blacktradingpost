const router = require('express').Router();
const homeRoute = require('./api/homepage');


router.use('/', homeRoute)




module.exports = router