// src/utils/token.js
const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_ACCESS_KEY,
    { expiresIn: process.env.JWT_EXPIRATION_SHORT }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_REFRESH_KEY,
    { expiresIn: process.env.JWT_EXPIRATION_LONG }
  );
};

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
