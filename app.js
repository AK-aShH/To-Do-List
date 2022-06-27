const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require("lodash");
const connectDB = require('./src/config/db');
const date = require("./date");

const {Item} = require('./src/models/items');
const {List} = require('./src/models/lists');
const {userSchema} = require('./src/models/users');

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


// Database connection
connectDB();

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate); //plugin for findorcreate 

const User = mongoose.model('User', userSchema);

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://limitless-ridge-35510.herokuapp.com/auth/google/todolist",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) { // gets called when the user is authenticated successfully by google

    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// configuring Facebook strategy
// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: "https://limitless-ridge-35510.herokuapp.com/auth/facebook/todolist",
//     },
//     function(accessToken, refreshToken, profile, cb) { // gets called when the user is authenticated successfully by facebook
    
//         console.log(profile);
//         User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//             return cb(err, user);
//         });
//     })
// );

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google', 
passport.authenticate('google', { scope: ['profile'] })); // initiate authentication on google servers asking for user's profile

// requested by google to authenticate locally
app.get('/auth/google/todolist', passport.authenticate('google', { failureRedirect: '/' }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
});

// app.get('/auth/facebook', 
// passport.authenticate('facebook')); // initiate authentication on facebook servers asking for user's profile

// // requested by facebook to authenticate locally
// app.get('/auth/facebook/todolist', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/home');
// });


app.get("/home", function(req, res){
    let day = date.newDate();
    let id = req.user.id;
    User.findById(id, function(err, user){
        if(err){
            console.log(err);
        } else {
            res.render("list", {listTitle: day, newListItems: user.item});
        }
    });
})

app.get("/:name", function(req, res){
    if(req.isAuthenticated){
        const customListName = _.capitalize(req.params.name);
        console.log(customListName);
    User.findById(req.user.id, function(err, user){
        if(err){
            console.log(err);
        } else {
            List.findOne({name: customListName, _id: {$in: user.lists}}, function(err, foundList){
                if(!foundList){
                    const newList = new List({
                            name: customListName,
                            items: []
                        });
                        user.lists.push(newList);
                        user.save();
                        res.redirect("/" + customListName);
                }
                else {
                    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
                }
            });
        }
    });
    }
    else{
        res.redirect("/");
    }
});


app.post("/", function(req, res){
    let task = req.body.task;
   const item = new Item({
           name: task
       });

   const listTitle = req.body.button;
//    console.log(listTitle);

User.findById(req.user.id,function(err, user){
    if(err){
        console.log(err);
    }else
    if(user){
        List.findOne({name: listTitle, _id: {$in: user.lists}}, function(err, foundList){
            if(!foundList){
                user.item.push(item);
                user.save(function(){
                    res.redirect("/home");
                });
            }
            else {
                foundList.items.push(item);
                foundList.save();
                user.save(function(){
                    res.redirect("/" + listTitle);
                });
            }
        });
    }
    });
});


app.post("/delete", function(req, res){
    console.log(req.body.checkbox);
    const listName = req.body.listName;
    let day = date.newDate();

    User.findById(req.user.id, function(err, user){
        if(err){
            console.log(err);
        }
        else {
            if(listName === day){
                Item.findByIdAndRemove({_id: req.body.checkbox, _id: {$in: user.item}}, function(err){
                    if(err){
                        console.log(err);
                    }
                    else {
                        res.redirect("/home");
                    }
                });
            }
            else {
                List.findOneAndUpdate({name: listName, _id: {$in: user.lists}}, {$pull: {items: {_id: req.body.checkbox}}}, function(err, foundList){
                    if(err){
                        console.log(err);
                    }
                    else {
                        res.redirect("/" + listName);
                    }
                });
            }
        }
    });
})


app.listen(process.env.PORT || 5000, function(){
    console.log("Server started on port 5000");
})

// https://limitless-ridge-35510.herokuapp.com