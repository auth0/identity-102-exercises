require('dotenv').config();
const express = require('express');
const http = require('http');
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');

const appUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;

const app = express();

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
  res.send([
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
  ]);
});

http.createServer(app).listen(process.env.PORT, () => {
  console.log(`listening on ${appUrl}`);
});
