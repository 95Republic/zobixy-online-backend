require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { dbConnect } = require('./utilities/db')

const socket = require('socket.io')
const http = require('http')
const server = http.createServer(app)

const allowedOrigins = process.env.mode === 'prod' 
? [process.env.client_customer_production_url, process.env.client_admin_prod_url] 
: ['http://localhost:3000','http://localhost:3001'];

console.log("ALLOWED ORIGINS: ",allowedOrigins)
console.log("MODE: ",process.env.mode)

app.use(cors({
origin: function (origin, callback){
    console.log('Request Origin:', origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('ERROR: Not allowed by CORS'))
        }
    },
    credentials: true
}));

const io = socket(server, {
cors: {
        origin: function (origin,callback){
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null,true); 
            } else {
                callback(new Error('ERROR: Not allowed by CORS'))
            }
        },
        credentials: true
    }
});




//socket method start
var allCustomer = []
var allSeller = []
let admin = {}

const addUser = (customerId,socketId,userInfo) => {

    const checkUser = allCustomer.some(u => u.customerId === customerId)
    if(!checkUser){
        allCustomer.push({
            customerId,
            socketId,
            userInfo
        })
    }

}



const addSeller = (sellerId,socketId,userInfo) => {

    const checkSeller = allSeller.some(u => u.sellerId === sellerId)
    if(!checkSeller){
        allSeller.push({
            sellerId,
            socketId,
            userInfo
        })
    }

}

//End socket methods



const findCustomer = (customerId) => {

    return allCustomer.find(c => c.customerId === customerId)

}

//End socket methods

const findSeller = (sellerId) => {

    return allSeller.find(c => c.sellerId === sellerId)

}

//End socket methods


const remove = (socketId) => {

    allCustomer = allCustomer.filter(c => c.socketId !== socketId)
    allSeller = allSeller.filter(c => c.socketId !== socketId)

}

//End socket methods



io.on('connection', (soc) => {
    console.log('socket server running...')

    soc.on('add_user',(customerId,userInfo) => {
        addUser(customerId,soc.id,userInfo)
        io.emit('activeSeller', allSeller)
    })

    soc.on('add_seller',(sellerId, userInfo) => {
        addSeller(sellerId,soc.id,userInfo)
        io.emit('activeSeller', allSeller)
    })

    soc.on('send_seller_message',(msg) => {
        const customer = findCustomer(msg.receiverId)
        if(customer !== undefined){
            soc.to(customer.socketId).emit('seller_message',msg)
        }
    })

    soc.on('send_customer_message',(msg) => {
        const seller = findSeller(msg.receiverId)
        if(seller !== undefined){
            soc.to(seller.socketId).emit('customer_message',msg)
        }
    })

    soc.on('send_message_admin_to_seller',(msg) => {
        const seller = findSeller(msg.receiverId)
        if(seller !== undefined){
            soc.to(seller.socketId).emit('received_admin_message',msg)
        }
    })

    soc.on('send_message_seller_to_admin',(msg) => {
        if(admin.socketId){
            soc.to(admin.socketId).emit('received_seller_message',msg)
        }
    })

    soc.on('add_admin',(adminInfo) => {
        delete adminInfo.email
        delete adminInfo.password
        admin = adminInfo
        admin.socketId = soc.id
        io.emit('activeSeller', allSeller)
        
    })

    soc.on('disconnect',() => {
        console.log('user disconnected')
        remove(soc.id)
        io.emit('activeSeller', allSeller)
    })

})


app.use(bodyParser.json())
app.use(cookieParser())

// home routes
app.use('/api/home', require('./routes/home/homeroutes'))
app.use('/api/customer', require('./routes/home/customerAuthRoutes'))
app.use('/api', require('./routes/home/cartRoutes'))

// order routes
app.use('/api', require('./routes/order/orderRoutes'))

//auth routes
app.use('/api', require('./routes/authRoutes'))


// dashboard routes
app.use('/api', require('./routes/dashboard/categoryRoutes'))
app.use('/api', require('./routes/dashboard/productRoutes'))
app.use('/api', require('./routes/dashboard/sellerRoutes'))
app.use('/api', require('./routes/dashboard/dashboardRoutes'))

//chat routes
app.use('/api', require('./routes/chatRoutes'))

//payment routes
app.use('/api', require('./routes/paymentRoutes'))


app.get('/',(req,res) => res.send('My backend'))
const port = process.env.PORT
dbConnect()
server.listen(port, () => console.log(`Server is running on port ${port}`))