// LAB 01 - Web Sign-In

// IMPORTS

const session = require('cookie-session');
const { auth } = require('express-openid-connect');
const express = require('express');
const morgan = require('morgan');
const app = express();
const ENVIRONMENT = require('dotenv').config().parsed;

// CONFIG

app.set(
  'view engine',
  'ejs'
);

app.use(
  morgan('combined'),
  express.urlencoded(
    {
      extended: false
    }
  ),
  session(
    {
      name: ENVIRONMENT.NAME,
      secret: ENVIRONMENT.COOKIE_SECRET
    }
  ),
  auth(
    {
      auth0Logout: true
    }
  )
);

// ROUTES

app.get('/', (req, res) => {
  res.render('home', {user: req.openid && req.openid.user}
  );
});

app.get('/expenses', (req, res) => {
  res.render('expenses', { expenses: [
      {
        date: new Date(),
        description: 'Coffee for a Coding Dojo session.',
        value: 42
      }]
  });
});

// RUN

app.listen(
  ENVIRONMENT.PORT,
  () => console.log(`${ENVIRONMENT.APP_NAME} running on port ${ENVIRONMENT.PORT}`)
);
