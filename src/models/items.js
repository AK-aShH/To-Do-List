const mongoose = require('mongoose');

const itemsSchema = new mongoose.Schema(
    {
        name: String
    }
);

const Item = mongoose.model("Item",itemsSchema);

module.exports = {Item, itemsSchema};
// module.exports.i = itemsSchema;