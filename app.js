const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require("lodash");
const connectDB = require('./src/config/db');
const date = require(__dirname +"/date.js");
const app = express();

const {Item} = require('./src/models/items');
const {List} = require('./src/models/lists');
const User = require('./src/models/users');


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

// Database connection
connectDB();

app.get("/", function(req, res){
    let day = date.newDate();
    Item.find(function(err, item){
        // console.log(item.name);
        res.render("list", {listTitle: day, newListItems: item});
    });
})

app.get("/:name", function(req, res){
    const customListName = _.capitalize(req.params.name);
    List.findOne({name: customListName}, function(err, list){
        if(!list){
            const newList = new List(
                {
                    name: customListName,
                    items: []
                }
            );
            newList.save();
            res.redirect("/"+customListName);
        }
        else{
                res.render("list", {listTitle: list.name , newListItems: list.items});
        }
    })
   
})

app.post("/", function(req, res){
    let task = req.body.task;
   const item = new Item(
       {
           name: task
       }
   );
   const listTitle = req.body.button;
//    console.log(listTitle);
   List.findOne({name: listTitle}, function(err, list){
    if(!list){
        item.save();
//    console.log(item);
        res.redirect("/");
    }
    else{
            list.items.push(item);
            // console.log(list);
            list.save();
            res.redirect("/"+list.name);
    }
})
  
})

app.post("/delete", function(req, res){
    console.log(req.body.checkbox);
    const listName = req.body.listName;
    let day = date.newDate();
    if(listName===day){
        Item.findByIdAndRemove({_id: req.body.checkbox},function(err){
            if(err){
                console.log(err);
            }
            else{
                res.redirect("/");
            }
        })
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:req.body.checkbox}}}, function(err, list){
            if(!err){
                res.redirect("/"+listName);
            }
        })
    }
})

app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port 3000");
})

// https://limitless-ridge-35510.herokuapp.com