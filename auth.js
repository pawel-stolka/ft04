var User = require('./models/User'),
    Message = require('./models/Message'),
    jwt = require('jwt-simple'),
    bcrypt = require('bcrypt-nodejs'),
    express = require('express'),
    router = express.Router(),
    CONS = require('./common/cons'),
    nodeMailer = require('nodemailer')

let secretString = CONS.consts.secretString,
    port = process.env.PORT || CONS.consts.port,
    apiUrl = CONS.consts.apiUrl,
    frontUrl = CONS.consts.frontUrl


//#region AUTH 
router.post('/register', async (req, res) => {
    var userData = req.body;
    // todo: validation


    if (userData.email == '') {
        return res.status(401)
            .send({
                message: 'What do you want to do?'
            })
    }
    var user = new User(userData)
    console.log(user)

    user.temporaryToken = jwt.encode({
        sub: user._id
    }, CONS.consts.secretString)
    // console.log('debug', user)
    var _existing = await User.findOne({
        email: userData.email
    })

    if (_existing) {
        return res.status(401)
            .send({
                message: 'This user already exists.'
            })
    }

    user.save((err, newUser) => {
        if (err) {
            console.log(`ERROR: ${err}`)
            return res.status(401)
                .send({
                    message: 'Error saving the user...'
                })
        }

        createSendToken(res, newUser)

        sender({
            email: user.email,
            name: user.name,
            temporaryToken: user.temporaryToken
        })
    })
    // res.json({
    //     success: true,
    //     message: `register tested! user: ${user}`
    // });
})

router.post('/login', async (req, res) => {
    var loginData = req.body;

    var user = await User.findOne({
        email: loginData.email
    })

    if (!user)
        return res.status(401)
            .send({
                message: 'Email or Password invalid!'
            })

    bcrypt.compare(loginData.pass, user.pass, (err, isMatch) => {
        if (!isMatch) {
            var _notLoggedIn = user.notLoggedIn
            _notLoggedIn.push(new Date)
            user.notLoggedIn = _notLoggedIn

            user.save((err, newLog) => {
                console.log('false - updated notLoggedIn.')
            })

            return res.status(401)
                .send({
                    message: 'Email or Password invalid!'
                })
        }

        if (!user.verified)
            return res.status(401)
                .send({
                    message: 'Please confirm your identity!',
                    verified: user.verified
                })

        // if (isMatch) :)
        var _loggedIn = user.loggedIn
        _loggedIn.push(new Date)
        user.loggedIn = _loggedIn

        user.save((err, newLog) => {
            console.log('success - updated loggedIn.')
        })
        createSendToken(res, user)
    })
})

router.post('/activate/:token', async (req, res) => {
    var activateData = req.body;
    console.log('activateData', activateData)

    var user = await User.findOne({
        temporaryToken: req.params.token
    })

    if (!user) {
        return res.status(401)
            .send({
                message: 'Token invalid!'
            })
    }

    let token = req.params.token

    let checking = jwt.encode(token, CONS.consts.secretString)
    // console.log('checking 4 token: ', checking, token)

    user.temporaryToken = false;
    user.verified = true;
    user.save((err, newLog) => {
        console.log('success - activated.')
    })

    return res.status(200)
        .send({
            token,
            message: 'Account activated.'
        })
})

//#endregion

//#region USERS 
router.get('/users', async (req, res) => {
    try {
        var users = await User.find({}, '-pass -plainPass -__v')
        // console.log('mongoString', mongoString)
        // var users = await User.find({}, '-pass -__v')
        res.send(users)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

router.get('/user/:email', async (req, res) => {
    let email = req.params.email
    try {
        var user = await User.findOne({
            email: email
        }, '-__v') //'-pass -__v')
        // var users = await User.find({}, '-pass -__v')
        res.send(user) //.name)
    } catch (error) {
        console.error(error)
        res.send({
            message: 'No such a user...'
        })
    }
})
//#endregion

//#region PROFILE 
router.get('/profile/:id', async (req, res) => {
    let id = req.params.id
    try {
        var user = await User.findOne({
            _id: id
        }, '-__v') //'-pass -__v')
        var profile = {
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            verified: user.verified,
            permissions: user.permissions,
            vote: user.vote,
            loggedIn: user.loggedIn,
            notLoggedIn: user.notLoggedIn,
        }
        res.send(profile) //.name)
    } catch (error) {
        console.error(error)
        res.send({
            message: 'No such a user...'
        })
    }
})
//#endregion

//#region CHAT MESSAGE
router.post('/message', async (req, res) => {
    var userData = req.body;
    // todo: validation


    // if (userData.email == '') {
    //     return res.status(401)
    //         .send({
    //             message: 'What do you want to do?'
    //         })
    // }
    var message = new Message(userData)
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
    return res.status(200)
        .send({
            message: `message saved!`
        })
})

router.get('/message', async (req, res) => {
    var messages = await Message.find({}, '-__v')

    res.send(messages)
})

//#endregion

function sender(mailData) {
    // console.log(mailData)
    let source = "auth-app@gdziesabasiaipawel.com"

    let transporter = nodeMailer.createTransport({
        host: 'mail5006.smarterasp.net', //
        port: 465,
        secure: true,
        auth: {
            user: 'auth-app@gdziesabasiaipawel.com',
            pass: 'P@ss2Q'
        }
    });

    let receivers = [mailData.email, source],
        // activationLink = `${frontUrl}/#/activate/${mailData.temporaryToken}`
        activationLink = `${frontUrl}/activate/${mailData.temporaryToken}`

    let emailContent = `
            <h2>Hello ${mailData.name}!</h2>
            <br>
            Thank you for registering at Auth 4! :)
            <br>
            <br>
            Please click on the link below to complete your activation: 
            <br>
            <a href='${activationLink}'>Activate</a>
            <p> Pablo from Auth4 </p>
            `
    let email = {
        from: `"Auth Three" ${source}`,
        to: receivers,
        subject: 'Auth Three Activation Link',
        html: emailContent
    };

    transporter.sendMail(email, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log(`Message sent: ${info.response}`)
        res.json({
            success: true,
            message: 'Account created! Please check your e-mail for activation link.'
        });
        // res.send('hi! everything in FamilyTree 3.0 API is working great!')
        // res.render('index');
    });
}

function createSendToken(res, user) {
    // sub = subject => just an id in mongoose terminology
    var payload = {
        sub: user._id
    }
    var token = jwt.encode(payload, CONS.consts.secretString)
    console.log('token created successfully! ', token)

    return res.status(200)
        .send({
            token,
            // my imple for _id
            id: user._id,
            message: 'Account registered! Please check your e-mail for activation link.'
        })
}


var auth = {
    router,
    checkAuthenticated: (req, res, next) => {
        if (!req.header('authorization'))
            return res.status(401)
                .send({
                    message: 'Unauthorized. Missing Auth Header.'
                })
        var token = req.header('authorization').split(' ')[1]

        // the same secret as in encode!!!!!!!!!!!!!!!!!!!!
        var payload = jwt.decode(token, CONS.consts.secretString)

        if (!payload)
            return res.status(401).send({
                message: 'Unauthorized. Auth Header Invalid.'
            })

        req.userId = payload.sub

        next()
    }
}

module.exports = auth