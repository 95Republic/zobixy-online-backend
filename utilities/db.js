const mongoose = require('mongoose');

module.exports.dbConnect = async() => {
    try {
        if (process.env.mode === 'prod') {
            await mongoose.connect(process.env.PROD_DB_URL, {useNewURLParser: true})
            console.log('Production database connected...')
        }else{
            await mongoose.connect(process.env.LOCAL_DB_URL, {useNewURLParser: true})
            console.log('Local database connected...')
        }
    } catch (error) {
        console.log(error.message)
        
    }
}