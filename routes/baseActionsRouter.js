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

	lightning.describeGraph({}, function(err, response) {
		if (err) {
			console.log("Error u3r03gwfewf: " + err);
		}

		res.locals.describeGraph = response;

		res.locals.nodeChannels = [];
		res.locals.describeGraph.edges.forEach(function(channel) {
			if (channel.node1_pub == nodePubKey || channel.node2_pub == nodePubKey) {
				res.locals.nodeChannels.push(channel);
			}
		});

		res.locals.nodeChannels.sort(function(a, b) {
			return b.last_update - a.last_update;
		});

		lightning.getNodeInfo({pub_key:nodePubKey}, function(err2, response2) {
			if (err2) {
				console.log("Error qu3gfewewb0: " + err2);
			}

			res.locals.nodeInfo = response2;

			res.render("node");
			res.end();
		});
	});
});

router.get("/channel/:channelId", function(req, res) {
	var channelId = req.params.channelId;

	lightning.getChanInfo(channelId, function(err, response) {
		if (err) {
			console.log("Error 923uhf2fgeu: " + err);
		}

		res.locals.channel = response;

		lightning.getNodeInfo({pub_key:response.node1_pub}, function(err2, response2) {
			if (err2) {
				console.log("Error uq3efbweyfge: " + err2);
			}

			if (response2) {
				res.locals.node1 = response2;
			}

			lightning.getNodeInfo({pub_key:response.node2_pub}, function(err3, response3) {
				if (err3) {
					console.log("Error ousdhf0ewg: " + err3);
				}

				if (response3) {
					res.locals.node2 = response3;
				}

				res.render("channel");
				res.end();
			});
		});
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

	lightning.describeGraph({}, function(err, response) {
		res.locals.describeGraph = response;

		var sortProperty = sort.substring(0, sort.indexOf("-"));
		var sortDirection = sort.substring(sort.indexOf("-") + 1);

		res.locals.channels = response.edges;

		res.locals.channels.sort(function(a, b) {
			if (sortProperty == "last_update") {
				return b.last_update - a.last_update;

			} else if (sortProperty == "capacity") {
				var diff = b.capacity - a.capacity;

				if (diff == 0) {
					return b.last_update - a.last_update;

				} else {
					return diff;
				}
			} else {
				return b.last_update - a.last_update;
			}
		});

		res.locals.channels = res.locals.channels.slice(offset, offset + limit);

		res.render("channels");
		res.end();
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
