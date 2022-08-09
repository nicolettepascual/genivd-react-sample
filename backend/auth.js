// Copyright 2016-2022 Genvid Technologies LLC. All Rights Reserved.
var basicAuth = require('basic-auth');
var config = require('./config');
var jwt = require('jsonwebtoken');

let admins = {
    "admin": { password: "admin" },
    "user1": { password: "user1" },
    "user2": { password: "user2" },
};

module.exports.authenticate = function (req, res, next) {
    let user = basicAuth(req);
    if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
        res.set("WWW-Authenticate", "Basic realm='example'");
        return res.status(401).send();
    }
    return next();
};

// GENVID - Start TwitchAuth
/**
 * Validate Twitch Authentication
 * @param req 
 * @param res 
 * @param next 
 */
module.exports.twitchAuth = function (req, res, next) {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token.search('Bearer ') === 0) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
        console.log('token', token);
    }

    if (token) {
        jwt.verify(token, Buffer.from(config.webEndpointConfig.secret, 'base64'), (err, decoded) => {
            if (err) {
                return res.status(401).send();
            } else {
                if (decoded.role === 'broadcaster') {
                    return next();
                } else {
                    return res.status(401).send();
                }
            }
        });
    } else {
        return res.status(401).send();
    }
}
// GENVID - Stop TwitchAuth