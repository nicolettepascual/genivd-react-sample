// Copyright 2016-2022 Genvid Technologies LLC. All Rights Reserved.
var express = require('express');
var streams = require('./streams.js');
var commands = require('./commands.js');
var basicAuth = require('./auth.js');

let router = express.Router();

router.use("/public", streams.router);
router.use("/admin", basicAuth.authenticate, commands.router);
router.use("/twitch", basicAuth.twitchAuth, commands.router);

module.exports = router;
