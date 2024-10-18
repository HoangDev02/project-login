const mongooes = require("mongoose");

const UserModel = new mongooes.Schema({
  username: {
    type: String,
    require: true,
    unique: true,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
    default: "abc.12345",
  },
  isMFAAuthenticated : {
    type: Boolean,
    default: false,
  },
  deviceInfo: {
    type: String
  },
  twoFactorSecret: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});
module.exports = mongooes.model("user", UserModel);
