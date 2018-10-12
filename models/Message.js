var mongoose = require('mongoose')

var messageSchema = new mongoose.Schema({
    userId: String,
    name: String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

messageSchema.pre('save', function(next) {
    console.log('saving message')
    next()
})

module.exports = mongoose.model('Message', messageSchema)