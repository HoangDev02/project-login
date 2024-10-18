const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = authenticate;