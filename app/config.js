var coins = require("./coins.js");

var currentCoin = "BTC";

var credentials = require("./defaultCredentials.js");
var overwriteCredentials = require("./credentials.js");

for (var key in overwriteCredentials) {
	credentials[key] = overwriteCredentials[key];
}

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
		addressMaxDisplayLength: 25,
		txidMaxDisplayLength: 22,
	},

	donationAddresses:{
		coins:["BTC", "LTC"],

		"BTC":{address:"3NPGpNyLLmVKCEcuipBs7G4KpQJoJXjDGe", urlPrefix:"bitcoin:"},
		"LTC":{address:"ME4pXiXuWfEi1ANBDo9irUJVcZBhsTx14i", urlPrefix:"litecoin:"}
	},

	blockExplorerUrl:"https://btc.chaintools.io",

	headerDropdownLinks: {
		title:"Related Sites",
		links:[
			{name: "Bitcoin Explorer", url:"https://btc.chaintools.io", imgUrl:"/img/logo/btc.svg"},
			{name: "Litecoin Explorer", url:"https://ltc.chaintools.io", imgUrl:"/img/logo/ltc.svg"},
			{name: "Lightning Explorer", url:"https://lightning.chaintools.io", imgUrl:"/img/logo/lightning.svg"},
		]
	}
};
