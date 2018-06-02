var express = require('express');
var router = express.Router();
var util = require('util');
var moment = require('moment');
var utils = require('./../app/utils');
var env = require("./../app/env");
var bitcoinCore = require("bitcoin-core");
var rpcApi = require("./../app/rpcApi.js");

router.get("/", function(req, res) {
	rpcApi.getFullNetworkDescription().then(function(fnd) {
		res.locals.fullNetworkDescription = fnd;

		res.render("index");
	});
});

router.get("/node/:nodePubKey", function(req, res) {
	var nodePubKey = req.params.nodePubKey;

	rpcApi.getFullNetworkDescription().then(function(fnd) {
		res.locals.fullNetworkDescription = fnd;
		res.locals.nodeInfo = fnd.nodeInfoByPubkey[nodePubKey];

		res.locals.nodeChannels = [];
		fnd.channels.sortedByLastUpdate.forEach(function(channel) {
			if (channel.node1_pub == nodePubKey || channel.node2_pub == nodePubKey) {
				res.locals.nodeChannels.push(channel);
			}
		});

		res.render("node");
	});
});

router.get("/channel/:channelId", function(req, res) {
	var channelId = req.params.channelId;

	rpcApi.getFullNetworkDescription().then(function(fnd) {
		res.locals.fullNetworkDescription = fnd;

		res.locals.channel = fnd.channelsById[channelId];

		res.locals.node1 = fnd.nodeInfoByPubkey[res.locals.channel.node1_pub];
		res.locals.node2 = fnd.nodeInfoByPubkey[res.locals.channel.node2_pub];

		res.render("channel");
	});
});

router.get("/node-status", function(req, res) {
	lightning.getInfo({}, function(err, response) {
		if (err) {
			console.log("Error 3u1rh2yugfew0fwe: " + err);
		}

		res.locals.getInfo = response;

		lightning.listPeers({}, function(err2, response2) {
			if (err2) {
				console.log("Error 301uh0gq0edgedfge: " + err2);
			}

			res.locals.listPeers = response2;

			res.render("node-status");
			res.end();
		});
	});
});

router.get("/changeSetting", function(req, res) {
	if (req.query.name) {
		req.session[req.query.name] = req.query.value;

		res.cookie('user-setting-' + req.query.name, req.query.value);
	}

	res.redirect(req.headers.referer);
});

router.get("/nodes", function(req, res) {
	var limit = 20;
	var offset = 0;
	var sort = "last_update-desc";

	if (req.query.limit) {
		limit = parseInt(req.query.limit);
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	if (req.query.sort) {
		sort = req.query.sort;
	}

	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.sort = sort;
	res.locals.paginationBaseUrl = "/nodes";

	var sortProperty = sort.substring(0, sort.indexOf("-"));
	var sortDirection = sort.substring(sort.indexOf("-") + 1);

	rpcApi.getFullNetworkDescription().then(function(fnd) {
		res.locals.fullNetworkDescription = fnd;

		if (sortProperty == "last_update") {
			res.locals.nodeInfos = fnd.nodes.sortedByLastUpdate;

		} else if (sortProperty == "num_channels") {
			res.locals.nodeInfos = fnd.nodes.sortedByChannelCount;

		} else if (sortProperty == "channel_capacity") {
			res.locals.nodeInfos = fnd.nodes.sortedByTotalCapacity;

		} else {
			res.locals.nodeInfos = fnd.nodes.sortedByLastUpdate;
		}

		res.locals.nodeInfos = res.locals.nodeInfos.slice(offset, offset + limit);

		res.render("nodes");
	});
});

router.get("/channels", function(req, res) {
	var limit = 20;
	var offset = 0;
	var sort = "last_update-desc";

	if (req.query.limit) {
		limit = parseInt(req.query.limit);
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	if (req.query.sort) {
		sort = req.query.sort;
	}

	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.sort = sort;
	res.locals.paginationBaseUrl = "/channels";

	var sortProperty = sort.substring(0, sort.indexOf("-"));
	var sortDirection = sort.substring(sort.indexOf("-") + 1);

	rpcApi.getFullNetworkDescription().then(function(fnd) {
		res.locals.fullNetworkDescription = fnd;

		if (sortProperty == "last_update") {
			res.locals.channels = fnd.channels.sortedByLastUpdate;

		} else if (sortProperty == "capacity") {
			res.locals.channels = fnd.channels.sortedByCapacity;

		} else {
			res.locals.channels = fnd.channels.sortedByLastUpdate;
		}

		res.locals.channels = res.locals.channels.slice(offset, offset + limit);

		res.render("channels");
	});
});

router.get("/search", function(req, res) {
	if (!req.query.query) {
		req.session.userMessage = "Enter a public key, alias, address, or channel id.";

		res.redirect("/");

		return;
	}

	var query = req.query.query.toLowerCase().trim();

	res.locals.query = query;

	rpcApi.getFullNetworkDescription().then(function(fnd) {
		res.locals.fullNetworkDescription = fnd;

		if (fnd.nodeInfoByPubkey[query]) {
			res.redirect("/node/" + query);

			return;
		}

		if (fnd.channelsById[query]) {
			res.redirect("/channel/" + query);

			return;
		}

		res.locals.searchResults = {};
		res.locals.searchResults.nodes = [];

		fnd.nodes.sortedByLastUpdate.forEach(function(nodeInfo) {
			if (nodeInfo.node.alias.toLowerCase().indexOf(query) > -1) {
				res.locals.searchResults.nodes.push(nodeInfo);

			} else {
				nodeInfo.node.addresses.forEach(function(address) {
					if (address.addr.indexOf(query) > -1) {
						res.locals.searchResults.nodes.push(nodeInfo);
					}
				});
			}
		});

		res.render("search");
	});
});

router.get("/about", function(req, res) {
	res.render("about");
});

router.get("/connectToPeer", function(req, res) {
	if (!req.query.pubKey) {
		req.session.userMessage = "Unable to connect to peer: missing pubKey";

		res.redirect(req.headers.referer);
	}

	if (!req.query.address) {
		req.session.userMessage = "Unable to connect to peer: missing address";

		res.redirect(req.headers.referer);
	}

	rpcApi.connectToPeer(req.query.pubKey, req.query.address).then(function(response) {
		res.redirect(req.headers.referer);
	});
});

module.exports = router;
