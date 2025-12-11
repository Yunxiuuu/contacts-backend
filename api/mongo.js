const mongoose = require("mongoose");

if (!global._mongooseConnected) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  global._mongooseConnected = true;
}

module.exports = mongoose;
