var express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    User = require('./models/User'),
    Message = require('./models/Message'),
    auth = require('./auth'),
    CONS = require('./common/cons')

var app = express(),
    port = process.env.PORT || CONS.consts.port,
    wsPort = CONS.consts.wsPort,
    mongoString = CONS.consts.mongoString





mongoose.Promise = Promise

app.use(cors())
// app.use(bodyParser.urlencoded({
//     extended: true
// }));
app.use(bodyParser.json())
app.use(morgan('dev'))


//#region ------------------- REQUESTS ------------------
app.get('/', (req, res) => {
    res.send('hi! Auth4 is working great!')
})

app.get('/dbInfo', async (req, res) => {
    let _name = mongoString.split('/'),
        dbName = _name[_name.length - 1]
    res.send({
        db: dbName
    })
})

app.get('/users', async (req, res) => {
    try {
        var users = await User.find({}, '-pass -plainPass -__v')
        res.send(users)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})
//#endregion


// ------------------------------> /AUTH <------------------------------------------------------------

app.use('/auth', auth.router)

// -------------------- MONGOOSE & SERVER --------------
mongoose.connect(mongoString, (err) => {
    let _name = mongoString.split('/'),
        dbName = _name[_name.length - 1]
    if (!err)
        console.log(` ===> connected to: ${dbName} <===`)
})


//#region ------------------- WEBSOCKET ------------------
let http = require('http').Server(app);
let io = require('socket.io')(http);    

io.on('connection', (socket) => {

    // Log whenever a user connects
    console.log('user connected')
    
    // Log whenever a client disconnects from our websocket server
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    // When we receive a 'message' event from our client, print out
    // the contents of that message and then echo it back to our client using `io.emit()`
    socket.on('message', (message) => {
        console.log("Message Received: ", message.user, message.text);
        saveToDb({
            userId: 1,
            name: message.user,
            message: message.text
        })
        io.emit('message', {
            type:'new-message', 
            message: message,
        });    
    });
});
// Initialize our websocket server on port 5000
http.listen(wsPort, () => {
    console.log(` ===> websocket is listening at port =====> ${wsPort}`)
});

function saveToDb(msg) {
    var message = new Message(msg)
    console.log(message)

    message.save((err) => {
        if (err) {
            console.log(`ERROR: ${err}`)
            return res.status(401)
                .send({
                    message: 'Error saving the message...'
                })
        }
    })
    // return res.status(200)
    //     .send({
    //         message: `message saved!`
    //     })
}
//#endregion

// var server = 
app.listen(port, () => {
    console.log(` ======> server is listening at port =====> ${port}`)
});


