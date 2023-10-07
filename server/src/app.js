const express = require("express");
const path = require("path");
const cors = require("cors");

const planetsRouter = require("./router/planets/planets.router");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use(planetsRouter);

module.exports = app;
