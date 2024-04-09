let server = require("./server");
let config = {
    port: 3306,
    secret: 'secretString',
    dialect: "mysql",
    showErrors: true,
    charset: "utf8mb4",
    logging: false, //console.log,
    pool: {
        min: 0,
        max: 10,
        idle: 30 * 1000,
        evict: 2 * 1000,
        acquire: 60 * 1000,
        handleDisconnects: true
    },
    dialectOptions: {charset: "utf8mb4"}
};
if(server.host === server.hosts.localhost){
    config.name = "vpndb";
    config.user = "root";
    config.pass = "1234";
    config.host = "127.0.0.1";
}
else if(server.host === server.hosts.develop){
    config.name = "guiderte_db";
    config.user = "guiderte_user";
    config.pass = "ngREhY~*SnX2";
    config.host = "localhost";
}
else if(server.host === server.hosts.production){
    config.name = "";
    config.user = "";
    config.pass = "";
    config.host = "";
}
console.log("database host", config.host);
module.exports = config;
