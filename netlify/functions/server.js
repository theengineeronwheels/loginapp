const serverless = require("serverless-http");
const express = require("express");

const app = express();

// Serve static files
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

module.exports.handler = serverless(app);