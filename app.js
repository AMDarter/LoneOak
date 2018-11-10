//LONE OAK
require('dotenv').config();
var express                 = require("express"),
    app                     = express(),
    bodyParser              = require("body-parser"),
    mongoose                = require("mongoose"),
    methodOverride          = require("method-override"),
    Event                   = require("./models/event"),
    passport                = require("passport"),
    cookieParser            = require("cookie-parser"),
    User                    = require("./models/user"),
    LocalStrategy           = require("passport-local");

    
    
// REQUIRING ROUTES
var eventRoutes     = require("./routes/events"),
    indexRoutes     = require("./routes/index");
    
mongoose.connect("mongodb://localhost/lone_oak");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.locals.moment = require('moment');

app.use(require("express-session")({
    secret: "Pizza is the best",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware for every route
// currentUser can allow toggle login/signup and logout
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    // res.locals.error = req.flash("error");
    // res.locals.success = req.flash("success");
    next();
});


// =============================
// ROUTES
// =============================

app.get("/", function(req, res){
    res.render("home");
});

app.get("/contact", function(req, res){
    res.render("contact");
});

app.get("/about", function(req, res){
    res.render("about");
});

// admin routes
app.get("/admin", isLoggedIn, isAdmin, function(req, res){
    res.render("admin");
});

app.get("/allUsers", isLoggedIn, isAdmin, function(req, res){
        User.find({}).exec(function(err, allUsers) {   
        if (err){
            res.redirect("/allUsers");
        }else{
            res.render("allUsers", { "users": allUsers });  
        }
    });
});

app.get("/allEvents", isLoggedIn, isAdmin, function(req, res){
        Event.find({}).exec(function(err, allEvents) {   
        if (err){
            res.redirect("/allEvents");
        }else{
            res.render("allEvents", { "events": allEvents });  
        }
    });
});

// DESTROY USER ROUTE
app.delete("/:id", isLoggedIn, isAdmin, function(req, res){
    User.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/allUsers");
        }else{
            res.redirect("/allUsers");
        }
    });
});

app.use("/", indexRoutes);
app.use("/events", eventRoutes);

// redirect all pages if route error
app.get("*", function(req, res) {
    res.redirect('/');
});

// middleware
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

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The Lone Oak Server is live!");
});