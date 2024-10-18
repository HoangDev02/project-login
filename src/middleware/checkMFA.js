const checkMFA = (req, res, next) => {
  const user = req.user;
  console.log(user);
  
  if (!user || !user.isMFAAuthenticated) {
    return res.status(401).json({ message: "MFA authentication required." });
  }

  next();
};

module.exports = checkMFA;