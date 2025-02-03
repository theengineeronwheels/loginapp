// netlify/functions/server.js
const serverless = require("serverless-http");
const app = require("../../server"); // Adjust the path to where your Express app is defined

// Export the Express app wrapped as a serverless function
module.exports.handler = serverless(app);