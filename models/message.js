const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  message: String,
  profilePic: String,
  username: String,
  image: String,
  date: Date,
});

messageSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('Message', messageSchema);
