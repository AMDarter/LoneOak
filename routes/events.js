require('dotenv').config();
var express = require("express"),
    router  = express.Router(),
    Event   = require("../models/event"),
    User    = require("../models/user");
    
var request = require("request");

// image upload cloudinary
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUDNAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// INDEX - Show all events
router.get("/", function(req, res){
    // Get all events from DB
    Event.find({}, function(err, allEvents){
       if(err){
           console.log(err);
       } else {
          res.render("events/index",{events: allEvents, page: 'events'});
        //   res.render("events/index",{events:allEvents});
       }
    });
});

// CREATE - Add new event to DB
router.post("/", isLoggedIn, isAdmin, upload.single('image'), function(req, res){
        cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
             if(err) {
                console.log(err);
                return res.redirect('back');
        }
        req.body.image = result.secure_url;
        req.body.imageId = result.public_id;
        var name     = req.body.name;
        var image    = req.body.image;
        var imageId  = req.body.imageId;
        var time     = req.body.time;
        var date     = req.body.date;
        var desc     = req.body.description;
        var newEvent = {name: name, image: image, imageId: imageId, description: desc, time: time, date: date };
        Event.create(newEvent, function(err, newlyCreated){
            if(err){
                console.log(err);
            }else{
                return res.redirect("/events");
            }
        });
    });
});

// NEW - Show form to create new event
router.get("/new", isLoggedIn, isAdmin, function(req, res){
    res.render("events/new");
});

// SHOW - Shows more info about one event
router.get("/:id", function(req, res){
    Event.findById(req.params.id, function(err, foundEvent){
        if(err || !foundEvent){
            res.redirect("back");
        }else{
            res.render("events/show", {event: foundEvent});
        }
    });
});



// EDIT
router.get("/:id/edit", isLoggedIn, isAdmin, function(req, res){
    Event.findById(req.params.id, function(err, foundEvent){
        if(err){
            console.log(err);
        } else {
            res.render("events/edit", {event: foundEvent});
        }
    });
});

// UPDATE
router.put("/:id", upload.single('image'), function(req, res){
    Event.findById(req.params.id, async function(err, event){
        if(err){
            console.log(err);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                await cloudinary.v2.uploader.destroy(event.imageId);
                var result = await cloudinary.v2.uploader.upload(req.file.path);
                event.image = result.secure_url;
                event.imageId = result.public_id;
              } catch(err) {
                  console.log(err);
                  return res.redirect("back");
              }
            }
            event.name = req.body.name;
            event.time = req.body.time;
            event.date = req.body.date;
            event.description = req.body.description;
            event.save();
            res.redirect("/events/" + event._id);
        }
    });
});

// DELETE
router.delete('/:id', function(req, res) {
  Event.findById(req.params.id, async function(err, event) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(event.imageId);
        event.remove();
        // req.flash('success', 'Event deleted successfully!');
        res.redirect('/events');
    } catch(err) {
        if(err) {
        //   req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

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