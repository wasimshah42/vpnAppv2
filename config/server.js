let hosts = {
    develop: "develop",
    localhost: "localhost",
    production: "production"
};
let config = {
    port: 5005,
    host: null,
    hosts: hosts,
    // logging: true
};
// config.host = hosts.develop;
config.host = hosts.localhost;
if(config.host === hosts.production){config.port = 5000;}
module.exports = config;
