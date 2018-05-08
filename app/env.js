module.exports = {
	cookiePassword: "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
	showForkBanner: false,
	debug: true,
	coin: "BTC",

	rpcBlacklist:[
		"stop"
	],

	// modify "rpc" to target your lnd node
	rpc: {
		host:"127.0.0.1",
		port:10009,
		adminMacaroonFilepath: "~/.lnd/admin.macaroon",
		tlcCertFilepath: "~/.lnd/tls.cert",
		lndRpcProtoFileFilepath: "./rpc.proto"
	}
};
