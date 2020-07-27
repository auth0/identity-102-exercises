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
    routes: false,
    appSession: false,
    authorizationParams: {
      response_type: "code id_token",
      response_mode: "form_post",
      audience: process.env.API_AUDIENCE,
      scope: "openid profile email read:reports offline_access",
    },
    handleCallback: async function (req, res, next) {
      req.session.openidTokens = req.openidTokens;
      req.session.userIdentity = req.openidTokens.claims();
      next();
    },
    getUser: async function (req) {
      return req.session.userIdentity;
    },
  })
);

app.get("/login", (req, res) => res.openid.login({ returnTo: "/" }));

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.openid.logout();
});

app.get("/", (req, res) => {
  res.render("home", { user: req.openid && req.openid.user });
});

app.get("/user", requiresAuth(), (req, res) => {
  res.render("user", { user: req.openid && req.openid.user });
});

app.get("/expenses", requiresAuth(), async (req, res, next) => {
  try {
    let tokenSet = req.openid.makeTokenSet(req.session.openidTokens);

    if (tokenSet.expired()) {
      tokenSet = await req.openid.client.refresh(tokenSet);
      tokenSet.refresh_token = req.session.openidTokens.refresh_token;
      req.session.openidTokens = tokenSet;
    }

    const expenses = await request(process.env.API_URL, {
      headers: { authorization: "Bearer " + tokenSet.access_token },
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

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err);
});

http.createServer(app).listen(process.env.PORT, () => {
  console.log(`listening on ${appUrl}`);
});
