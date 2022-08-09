// Copyright 2016-2022 Genvid Technologies LLC. All Rights Reserved.
const envs = require("envs");
const Consul = require("consul");
const consul_addr = envs("CONSUL_HTTP_ADDR", "127.0.0.1:8500").split(":");
const port = consul_addr.pop();
const host = consul_addr.join(":");
const consul = Consul({ host, port });
const config = {
  consul,
  disco_url: envs("GENVID_DISCO_URL", "http://localhost:8080"),
  disco_secret: envs("GENVID_DISCO_SECRET", "discosecret"),
  webgateway_url: envs("GENVID_WEBGATEWAY_URL", "http://localhost:8089"),
  webgateway_secret: envs("GENVID_WEBGATEWAY_SECRET", ""),
  webEndpointConfig: {
    endpoint: envs("ENDPOINT", undefined),
    secret: envs("CLIENT_SECRET", undefined),
    ssl: envs("SSL", "false")
  }
};
module.exports = config;

function wrapIPv6Address(address) {
  if (address.includes(":")) {
    return `[${address}]`;
  }
  return address;
}

function watchService(serviceName, setUrl) {
  const watchOptions = {
    service: serviceName,
    passing: true
  };

  const serviceWatch = consul.watch({
    method: consul.health.service,
    options: watchOptions
  });

  serviceWatch.on("change", (services, _res) => {
    console.log(services);
    if (services.length === 0) {
      console.error(`${serviceName} service is not available from consul`);
    } else {
      let service = services[Math.floor(Math.random() * services.length)];
      let serviceUrl = `http://${wrapIPv6Address(service.Service.Address)}:${
        service.Service.Port
      }`;
      setUrl(serviceUrl);
      console.info(`Watch ${serviceName} url: ${serviceUrl}`);
    }
  });

  serviceWatch.on("error", err => {
    console.error(`${serviceName} watch error:`, err);
  });
}

watchService("disco", url => {
  config.disco_url = url;
});
watchService("webgateway", url => {
  config.webgateway_url = url;
});
