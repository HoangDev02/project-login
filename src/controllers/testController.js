const hellowordController =  {
  getHello : (req, res) => {
    res.status(200).json({ message: "Hello Word!" });
  }
};

module.exports = hellowordController;
