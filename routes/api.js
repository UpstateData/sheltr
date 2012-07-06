var express = require('express');

module.exports = function(app) {
  var db = app.db;
  app.get('/api/near', function(req, res, next) {
    db.near(req.query.lat, req.query.lon, function(err, data) {
      if (err) return next();
      res.send(data);
    });
  });
  app.get('/api/loc/:idOrSlug', function(req, res, next) {
    db.loc(req.params.idOrSlug, function(err, data) {
      if (err) return next();
      res.send(data);
    });
  });
  app.get('/api/settings', function(req, res, next) {
    db.settings(function(err, data) {
      if (err) return next();
      res.send(data);
    });
  });
  app.post('/api/settings', express.bodyParser(), function(req, res, next) {
    db.settings(req.body, function(err, data) {
      if (err) return next();
      res.send(data);
    });
  });
  app.post('/api/', express.bodyParser(), function(req, res, next) {
    db.post(req.body, function(err, data) {
      if (err) console.error(err);
      res.send(data);
    });
  });
};
