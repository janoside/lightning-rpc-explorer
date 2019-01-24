var credentials = require("./credentials.js");
var coins = require("./coins.js");

var currentCoin = "BTC";

module.exports = {
	cookiePassword: credentials.cookiePassword,
	coin: currentCoin,

	siteInfo: {
		title: "Lightning Explorer",
		sourceUrl: "https://github.com/janoside/lightning-rpc-explorer",
		demoSiteUrl: "https://lightning.chaintools.io"
	},

	demoSite: true,

	rpcBlacklist:[
		"stop"
	],

	credentials: credentials,

	site: {
		pubkeyMaxDisplayLength: 22,
		aliasMaxDisplayLength: 25,
		addressMaxDisplayLength: 25
	},

	donationAddresses:{
		coins:["BTC", "LTC"],

		"BTC":{address:"3NPGpNyLLmVKCEcuipBs7G4KpQJoJXjDGe", urlPrefix:"bitcoin:"},
		"LTC":{address:"ME4pXiXuWfEi1ANBDo9irUJVcZBhsTx14i", urlPrefix:"litecoin:"}
	},

	blockExplorerUrl:"https://btc.chaintools.io"
};
