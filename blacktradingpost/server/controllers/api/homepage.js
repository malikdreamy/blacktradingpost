const router = require('express').Router();
require('dotenv').config();



router.get('/', async(req,res)=>{
    try {
        res.render('index')
        
    } catch (error) {
        console.log(error);
        res.send('<h1>Error</h1>')
    }
})



module.exports = router;