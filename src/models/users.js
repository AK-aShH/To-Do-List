const mongoose = require('mongoose');

const {itemsSchema} = require('./items');
const {listsSchema} = require('./lists');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    item: [itemsSchema]
});

// const User = mongoose.model('User', userSchema);

module.exports = {userSchema};