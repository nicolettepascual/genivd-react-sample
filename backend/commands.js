// Copyright 2016-2022 Genvid Technologies LLC. All Rights Reserved.
var express = require("express");
const axios = require('axios');
var config = require("./config.js");

const router = express.Router();
module.exports = { router };

router.get("/test", async (_req, res) => {
  res.status(200).send("OK");
});

router.post("/commands/game", async (req, res) => {
  let body = req.body;

  let commandRequest = {
    method: "POST",
    data: body,
    baseURL: config.webgateway_url,
    url: "/commands/game",
    headers: {
      secret: config.webgateway_secret
    }
  };

  try {
    let retrievedCommand = await axios(commandRequest);
    res.status(200).send(retrievedCommand.data);
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
