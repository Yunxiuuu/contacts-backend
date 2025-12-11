const mongoose = require('mongoose');

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((m) => m);
  }
  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

module.exports = dbConnect;
