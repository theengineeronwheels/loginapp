 const serverless = require("serverless-http");
 const express = require("express");
 const path = require("path");

 const app = express();

 // Set EJS as view engine
 app.set("views", path.join(__dirname, "../../views")); // Adjust path as needed
 app.set("view engine", "ejs");

 // Serve static files
 app.use(express.static(path.join(__dirname, "../../public")));

 // Define a route
 app.get("/", (req, res) => {
   res.render("index"); // Renders views/index.ejs
 });

 module.exports.handler = serverless(app);