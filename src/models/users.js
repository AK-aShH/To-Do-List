const mongoose = require('mongoose');

const {itemsSchema} = require('./src/models/items');
const {listsSchema} = require('./src/models/lists');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    lists: [listsSchema],
    items: [itemsSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = User;