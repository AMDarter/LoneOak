require('dotenv').config();
var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");


var admin_code = process.env.ADMIN_CODE

// ROOT ROUTE
router.get("/", function(req, res){
    res.render("landing");
});

// REGISTER FORM
router.get("/register", isLoggedIn, function(req, res){
   res.render("register", {page: 'register'}); 
});

// SIGN UP LOGIC
router.post("/register", isLoggedIn, function(req, res){
    var newUser = new User({username: req.body.username});
    if(req.body.adminCode === admin_code){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            // req.flash("error", err.message);
            return res.redirect("register");
        }
        passport.authenticate("local")(req, res, function(){
            // req.flash("success", "Welcome " + user.username);
            res.redirect("/admin");
        });
    });
});

// LOGIN FORM
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

// LOGIN LOGIC
router.post("/login", passport.authenticate("local", 
    {successRedirect: "/admin", 
        failureRedirect: "/login"
    }), function(req, res){
});

// LOGOUT ROUTE
router.get("/logout", function(req, res){
    req.logout();
    // req.flash("success", "You Logged Out!")
    res.redirect("/");
});

// Can only sign up if isloggedin and isAdmin
// A current admin must sign up another admin
// MIDDLEWARE
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

// middleware
function isAdmin(req, res, next){
  User.findById(req.user, function (err, user) {
    if(err){
           console.log(err);
       }
    else if (user.isAdmin === true) {
        next();
    }else{
        res.redirect("/login");
    }
  });
}

module.exports = router;