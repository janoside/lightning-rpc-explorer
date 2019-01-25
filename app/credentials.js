module.exports = {
	cookiePassword: "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",

	// modify "rpc" to target your lnd node
	rpc: {
		host:"lightning.chaintools.io",
		port:10009,
		adminMacaroonFilepath: "./credentials/admin.macaroon",
		tlsCertFilepath: "./credentials/tls.cert"
	},

	adminUsername:"admin",
	adminPasswordSha256:"8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // default: "admin"
};
