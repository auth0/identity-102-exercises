require("dotenv").config();
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const request = require("request-promise");
const session = require("express-session");
const { auth, requiresAuth } = require("express-openid-connect");

const appUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;

const app = express();

app.set("view engine", "ejs");

app.use(morgan("combined"));

app.use(
  session({
    secret: process.env.APP_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(
  auth({
    baseURL: appUrl,
    required: false,
    auth0Logout: true,
  })
);

app.get("/", (req, res) => {
  res.render("home", { user: req.openid && req.openid.user });
});

app.get("/user", requiresAuth(), (req, res) => {
  res.render("user", { user: req.openid && req.openid.user });
});

app.get("/expenses", requiresAuth(), async (req, res, next) => {
  try {
    const expenses = await request(process.env.API_URL, {
      json: true,
    });

    res.render("expenses", {
      user: req.openid && req.openid.user,
      expenses,
    });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err);
});

http.createServer(app).listen(process.env.PORT, () => {
  console.log(`listening on ${appUrl}`);
});
