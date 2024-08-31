const express = require("express");
const app = express();
const { error } = require("./middlewares/error.js");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// import routes
const fileDataRoute = require("./routes/fileDataRoute");

// use routes
app.use("/api/v1", fileDataRoute);

app.get("/", (req, res) =>
  res.send(`<h1>Its working. Click to visit Link.</h1>`)
);

app.all("*", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;
app.use(error);
