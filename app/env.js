module.exports = {
	cookiePassword: "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
	siteInfo: {
		title: "Lightning Explorer",
		sourceUrl: "https://github.com/janoside/lightning-rpc-explorer",
		demoSiteUrl: "https://lightning.chaintools.io"
	},

	demoSite: true,
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
	},

	donationAddresses:{
		coins:["BTC", "LTC"],

		"BTC":{address:"3NPGpNyLLmVKCEcuipBs7G4KpQJoJXjDGe", urlPrefix:"bitcoin:"},
		"LTC":{address:"ME4pXiXuWfEi1ANBDo9irUJVcZBhsTx14i", urlPrefix:"litecoin:"}
	},

	blockExplorerUrl:"https://btc.chaintools.io"
};
