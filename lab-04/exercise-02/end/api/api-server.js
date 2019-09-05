require('dotenv').config();
const cors = require('cors');
const express = require('express');
const http = require('http');
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');

const appUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;

const app = express();

const expenses = [
  {
    date: new Date(),
    description: 'Pizza for a Coding Dojo session.',
    value: 102,
  },
  {
    date: new Date(),
    description: 'Coffee for a Coding Dojo session.',
    value: 42,
  }
];

app.use(cors());

app.get('/total', (req, res) => {
  const total = expenses.reduce((accum, expense) => (accum + expense.value), 0);
  res.send({total, count: expenses.length});
});

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    jwksUri: `${process.env.ISSUER_BASE_URL}/.well-known/jwks.json`
  }),
  issuer: process.env.ISSUER_BASE_URL + '/',
  audience: process.env.ALLOWED_AUDIENCES,
  algorithms: [ 'RS256' ]
});

const checkJwtScopes = jwtAuthz([ 'read:reports' ]);

app.get('/', checkJwt, checkJwtScopes, (req, res) => {
  console.log(new Date(req.user.iat * 1000));
  res.send(expenses);
});

http.createServer(app).listen(process.env.PORT, () => {
  console.log(`listening on ${appUrl}`);
});
