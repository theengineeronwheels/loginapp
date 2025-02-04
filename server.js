const serverless = require("serverless-http");
const app = require("./server"); // Adjust the path based on where your Express app is

module.exports.handler = serverless(app);