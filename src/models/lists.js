const mongoose = require('mongoose');

const { itemsSchema }= require('./items');

const listsSchema = new mongoose.Schema(
    {
        name: String,
        items: [itemsSchema]
    }
);

const List = mongoose.model("List",listsSchema);

module.exports.List = List;
module.exports.listsSchema = listsSchema;