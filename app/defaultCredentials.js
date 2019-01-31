module.exports = {
	cookiePassword: "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",

	// modify "rpc" to target your lnd node
	rpc: {
		host:"127.0.0.1",
		port:10009,
		adminMacaroonFilepath: "~/.lnd/admin.macaroon",
		tlsCertFilepath: "~/.lnd/tls.cert"
	},

	influxdb:{
		active:false,
		host:"127.0.0.1",
		port:8086,
		database:"influxdb",
		username:"admin",
		password:"admin"
	},

	adminUsername:"admin",
	adminPasswordSha256:"8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // default: "admin"
};
