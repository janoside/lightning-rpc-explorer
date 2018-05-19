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
		res.locals.getInfo = response;

		lightning.listPeers({}, function(err2, response2) {
			res.locals.listPeers = response2;

			lightning.describeGraph({}, function(err3, response3) {
				res.locals.describeGraph = response3;

				res.render("node-status");
				res.end();
			});
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

router.post("/search", function(req, res) {
	if (!req.body.query) {
		req.session.userMessage = "Enter a public key, alias, address, or channel id.";

		res.redirect("/");

		return;
	}

	var query = req.body.query.toLowerCase().trim();

	req.session.query = req.body.query;

	lightning.getNodeInfo({pub_key:query}, function(err, response) {
		if (err) {
			console.log("Error 0u23f0u2ebf: " + err);
		}

		if (response) {
			res.redirect("/node/" + query);

			return;
		}

		lightning.getChanInfo(query, function(err2, response2) {
			if (err2) {
				console.log("Error 0quwfu0e0b: " + err2);
			}

			if (response2) {
				res.redirect("/channel/" + query);

				return;
			}

			req.session.userMessage = "No results found for query: " + query;

			res.redirect("/");
		});
	});
});

router.get("/about", function(req, res) {
	res.render("about");
});

module.exports = router;
