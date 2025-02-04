const serverless = require("serverless-http");
const express = require("express");
const path = require("path");

const app = express();

// Set up EJS
app.set("views", path.join(__dirname, "../../views"));
app.set("view engine", "ejs");

// Serve static assets
app.use(express.static(path.join(__dirname, "../../public")));

// Define routes
app.get("/", (req, res) => {
  res.render("index"); // Make sure "views/index.ejs" exists
});

module.exports.handler = serverless(app);