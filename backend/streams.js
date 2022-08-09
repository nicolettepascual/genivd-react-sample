// Copyright 2016-2022 Genvid Technologies LLC. All Rights Reserved.
var express = require('express');
const axios = require('axios');
var config = require('./config.js');
var url = require('url');

const router = express.Router();
module.exports = {router};


router.get("/streams", async (_req, res) => {

    let options = {
        method: "GET",
        baseURL: config.disco_url,
        url: "/disco/stream/info",
        headers: {
            secret: config.disco_secret
        }
    };

    try {
        let retrievedInfo = await axios(options);
        res.status(200).send(retrievedInfo.data);
    }
    catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Here is the data of your response : ", error.response.data);
            console.error("Here is the header of your response : ", error.response.headers);
            res.status(error.response.status).send(error);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.error("No response was received, here is the full request : ", error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error, something happened in setting up the request : ", error.message);
    }
    console.error("Here is your configuration : ", error.config);
    }
});

router.post("/channels/join", async (req, res) => {
    let body = req.body;
    if (!body) {
        throw new Error("Bad request");
    }

    let joinOptions = {
        method: "POST",
        baseURL: config.disco_url,
        url: "/disco/stream/join",
        headers: {
            secret: config.disco_secret
        }
    };

    try {
        let retrievedJoin = await axios(joinOptions);
        let data = retrievedJoin.data;

        let websocketUrl = url.parse(data.uri);
        let ntpUrl = url.parse(data.info.ntpuri);
        // force protocol to use secure protocols
         if (config.webEndpointConfig.ssl !== 'false' && config.webEndpointConfig.endpoint !== undefined && config.webEndpointConfig.endpoint.length > 1) {
            websocketUrl.protocol = "wss";
            ntpUrl.protocol = "https";
            // we need to retrieve from our configuration our dns name that is used
            // by our cluster load balancer and we do not need the port because we go through a lb and
            // it's listening on 80 and 443
            websocketUrl.host = config.webEndpointConfig.endpoint ? `${config.webEndpointConfig.endpoint}:443` : `${websocketUrl.host}`;
            ntpUrl.host = config.webEndpointConfig.endpoint ? `${config.webEndpointConfig.endpoint}:443` : `${ntpUrl.host}`;

            // and we replace in our response our load balancer dns endpoint
            data.uri = url.format(websocketUrl);
            data.info.ntpuri = url.format(ntpUrl);

        }
        res.status(200).send(data);
    }
    catch (error) {if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Here is the data of your response : ", error.response.data);
        console.error("Here is the header of your response : ", error.response.headers);
        res.status(error.response.status).send(error);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.error("No response was received, here is the full request : ", error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error, something happened in setting up the request : ", error.message);
    }
    console.error("Here is your configuration : ", error.config);
    }
});
