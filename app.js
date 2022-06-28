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
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://limitless-ridge-35510.herokuapp.com/auth/facebook/todolist",
    },
    function(accessToken, refreshToken, profile, cb) { // gets called when the user is authenticated successfully by facebook
    
        console.log(profile);
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    })
);

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

app.get('/auth/facebook', 
passport.authenticate('facebook')); // initiate authentication on facebook servers asking for user's profile

// requested by facebook to authenticate locally
app.get('/auth/facebook/todolist', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
});


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

app.get("/home/:name", function(req, res){
    if(req.isAuthenticated){
        const customListName = _.capitalize(req.params.name);
        console.log(customListName);
            List.findOne({name: customListName, user: req.user.id}, function(err, foundList){
                if(!foundList){
                    const newList = new List({
                            name: customListName,
                            items: [],
                            user: req.user.id
                        });
                        newList.save();
                        res.redirect("/home/" + customListName);
                }
                else {
                    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
                }
            });
    }
    else{
        res.redirect("/");
    }
});

app.get("/mylists", function(req, res){
    if(req.isAuthenticated){
        List.find({user: req.user.id}, function(err, foundLists){
            if(err){
                console.log(err);
            }
            else {
                res.render("mylists", {lists: foundLists});
            }
        });
    }
    else{
        res.redirect("/");
    }
});

app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) {
            console.log(err); 
        }else{
            res.redirect('/');
        }
      });
});


app.post("/", function(req, res){
    let task = req.body.task;
   const item = new Item({
           name: task
       });

   const listTitle = req.body.button;
//    console.log(listTitle);

    if(listTitle === date.newDate()){
        User.findById(req.user.id, function(err, foundUser){
            foundUser.item.push(item);
            foundUser.save();
            res.redirect("/home");
        });
    }
    else{
        List.findOne({name: listTitle, user: req.user.id}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/home/" + listTitle);
        });
    }
});


app.post("/delete", function(req, res){
    console.log(req.body.checkbox);
    const listName = req.body.listName;
    let day = date.newDate();

    if(listName === day){
        User.findByIdAndUpdate(req.user.id, {$pull: {item: {_id: req.body.checkbox}}}, function(err, foundUser){
            if(!err){
                res.redirect("/home");
            }
        });
    }
    else{
        List.findOneAndUpdate({name: listName, user: req.user.id}, {$pull: {items: {_id: req.body.checkbox}}}, function(err, foundList){
            if(!err){
                res.redirect("/home/" + listName);
            }
        });
    }
})

app.post("/deleteList", function(req, res){
    List.findOneAndDelete({_id: req.body.checkbox, user: req.user.id}, function(err, foundList){
        if(!err){
            res.redirect("/mylists");
        }
    }
    );
})

app.post("/newList", function(req, res){
    const listName = req.body.listName;
    const newList = new List({
        name: listName,
        items: [],
        user: req.user.id
    });
    newList.save(function(err){
        if(!err){
            res.redirect("/home/" + listName);
        }
    });
})


app.listen(process.env.PORT || 5000, function(){
    console.log("Server started on port 5000");
})

// https://limitless-ridge-35510.herokuapp.com