// Vercel Serverless Function entrypoint.
// Vercel will call this file for requests to /api/*.
// It simply forwards the request to the Express app exported from ../index.js
const app = require('../index');

// Express app is a function (req,res) handler, but to be explicit:
module.exports = (req, res) => {
  return app(req, res);
};
