const express = require("express");
const router = express.Router();
const hellowordController = require("../controllers/testController");
router.get("/", hellowordController.getHello);
module.exports = router;
