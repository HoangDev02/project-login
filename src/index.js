const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const dotenv = require("dotenv").config();
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// how to cors in express
app.use(
  cors({
    origin: "http://localhost:5500",
    credentials: true,
  })
);
const connect = require("../src/connect/connect");
const authRouter = require("../src/router/authRouter");

const port = process.env.PORT || 8888;

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(methodOverride("_method"));
app.use(morgan("combined"));

app.use("/api/v1/auth", authRouter);

app.listen(port, () => {
  connect();
  console.log(`Example app listening on port ${port}`);
});
