const fs = require("fs");
console.log(fs.readdirSync("./node_modules")); // This will print node_modules contents during build

const serverless = require("serverless-http");
const express = require("express");
const app = express();
const path = require("path");

// Set up views
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

// Define routes
app.get("/", (req, res) => {
  res.render("index"); // Ensure "views/index.ejs" exists
});

module.exports.handler = serverless(app);
