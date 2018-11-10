var mongoose = require("mongoose");

// Schema Setup
var eventSchema = new mongoose.Schema({
    name: String,
    image: String,
    imageId: String,
    description: String,
    date: String,
    time: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Event", eventSchema);