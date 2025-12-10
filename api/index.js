// Vercel Serverless Function entrypoint.
// Vercel will call files in /api as serverless functions.
// This file forwards requests to the Express app exported from ../index.js
const app = require('../index');

module.exports = (req, res) => {
  // app is an express app (callable handler)
  return app(req, res);
};
