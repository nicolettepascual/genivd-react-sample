var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var basicAuth = require('./auth');
var cors = require('cors');

var app = express();

// GENVID - Start CORS
// Only to use in a development environment, not in a production environment. This removes the security purpose of CORS
app.use(cors({ credentials: true, origin: true }));
// GENVID - Stop CORS

app.use(favicon(path.join(__dirname, '..', 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', require('./apiBase.js'));

app.get('/admin', basicAuth.authenticate, (req, res) => { res.sendFile('/admin.html', { root: './public' }) })

// Health status
app.get("/health", function(req, res) {
  res.status(200).send('ok');
})

// Only use this error handler middleware in "/api" based routes
app.use("/api", function (err, req, res, next) {

  // use the error's status or default to 500
  res.status(err.status || 500);

  if (err instanceof Error) {
    res.send({ error: err.message });
  } else {
    res.send({ error: err });
  }
});


module.exports = app;
