var express = require('express');
var router = express.Router();
var util = require('util');
var moment = require('moment');
var utils = require('./../app/utils');
var env = require("./../app/env");
var bitcoinCore = require("bitcoin-core");
var rpcApi = require("./../app/rpcApi");

router.get("/", function(req, res) {
	if (req.session.host == null || req.session.host.trim() == "") {
		if (req.cookies['rpc-host']) {
			res.locals.host = req.cookies['rpc-host'];
		}

		if (req.cookies['rpc-port']) {
			res.locals.port = req.cookies['rpc-port'];
		}

		if (req.cookies['rpc-username']) {
			res.locals.username = req.cookies['rpc-username'];
		}

		res.render("connect");
		res.end();

		return;
	}

	lightning.getInfo({}, function(err, response) {
		res.locals.getInfo = response;

		lightning.listPeers({}, function(err2, response2) {
			res.locals.listPeers = response2;

			lightning.describeGraph({}, function(err3, response3) {
				res.locals.describeGraph = response3;

				res.render("index");
				res.end();
			});
		});
	});
});

router.get("/node/:nodePubKey", function(req, res) {
	var nodePubKey = req.params.nodePubKey;

	lightning.getNodeInfo({pub_key:nodePubKey}, function(err, response) {
		if (err) {
			console.log("Error qu3gfewewb0: " + err);
		}

		res.locals.nodeInfo = response;

		res.render("node");
		res.end();
	});
});

router.get("/channel/:channelId", function(req, res) {
	var channelId = req.params.channelId;

	lightning.getChanInfo(channelId, function(err, response) {
		if (err) {
			console.log("Error 923uhf2fgeu: " + err);
		}

		res.locals.channelInfo = response;

		res.render("channel");
		res.end();
	});
});

router.get("/node-details", function(req, res) {
	lightning.getInfo({}, function(err, response) {
		res.locals.getInfo = response;

		lightning.listPeers({}, function(err2, response2) {
			res.locals.listPeers = response2;

			lightning.describeGraph({}, function(err3, response3) {
				res.locals.describeGraph = response3;

				res.render("node-details");
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

	lightning.describeGraph({}, function(err, response) {
		res.locals.describeGraph = response;

		var sortProperty = sort.substring(0, sort.indexOf("-"));
		var sortDirection = sort.substring(sort.indexOf("-") + 1);

		res.locals.nodes = response.nodes;
		res.locals.nodesByPubKey = {};

		res.locals.nodes.forEach(function(node) {
			node.channel_count = 0;
			node.sum_channel_capacity = 0;

			res.locals.nodesByPubKey[node.pub_key] = node;
		});

		response.edges.forEach(function(channel) {
			res.locals.nodesByPubKey[channel.node1_pub].channel_count++;
			res.locals.nodesByPubKey[channel.node2_pub].channel_count++;

			res.locals.nodesByPubKey[channel.node1_pub].sum_channel_capacity += channel.capacity;
			res.locals.nodesByPubKey[channel.node2_pub].sum_channel_capacity += channel.capacity;

			if (channel.node1_pub == "03fde1d50cbe9f577170bf746fa0c2451ab22ad4bb2a535eca73424a4b07e02d58") {
				console.log("n1");
			}

			if (channel.node2_pub == "03fde1d50cbe9f577170bf746fa0c2451ab22ad4bb2a535eca73424a4b07e02d58") {
				console.log("n2");
			}
		});

		res.locals.nodes.sort(function(a, b) {
			if (sortProperty == "last_update") {
				return a.last_update - b.last_update;

			} else if (sortProperty == "num_channels") {
				return a.num_channels - b.num_channels;

			} else if (sortProperty == "channel_capacity") {
				return a.channel_capacity - b.channel_capacity;

			} else {
				return a.last_update - b.last_update;
			}
		});

		console.log("nc: " + res.locals.nodes.length + ", offset: " + offset);

		res.locals.nodes = res.locals.nodes.slice(offset, offset + limit);

		res.render("nodes");
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

router.get("/rpc-terminal", function(req, res) {
	if (!env.debug) {
		res.send("Debug mode is off.");

		return;
	}

	res.render("terminal");
});

router.post("/rpc-terminal", function(req, res) {
	if (!env.debug) {
		res.send("Debug mode is off.");

		return;
	}

	var params = req.body.cmd.split(" ");
	var cmd = params.shift();
	var parsedParams = [];

	params.forEach(function(param, i) {
		if (!isNaN(param)) {
			parsedParams.push(parseInt(param));

		} else {
			parsedParams.push(param);
		}
	});

	if (env.rpcBlacklist.includes(cmd)) {
		res.write("Sorry, that RPC command is blacklisted. If this is your server, you may allow this command by removing it from the 'rpcBlacklist' setting in env.js.", function() {
			res.end();
		});

		return;
	}

	client.command([{method:cmd, parameters:parsedParams}], function(err, result, resHeaders) {
		console.log("Result[1]: " + JSON.stringify(result, null, 4));
		console.log("Error[2]: " + JSON.stringify(err, null, 4));
		console.log("Headers[3]: " + JSON.stringify(resHeaders, null, 4));

		if (err) {
			console.log(JSON.stringify(err, null, 4));

			res.write(JSON.stringify(err, null, 4), function() {
				res.end();
			});

		} else if (result) {
			res.write(JSON.stringify(result, null, 4), function() {
				res.end();
			});

		} else {
			res.write(JSON.stringify({"Error":"No response from node"}, null, 4), function() {
				res.end();
			});
		}
	});
});

router.get("/rpc-browser", function(req, res) {
	if (!env.debug) {
		res.send("Debug mode is off.");

		return;
	}

	rpcApi.getHelp().then(function(result) {
		res.locals.gethelp = result;

		if (req.query.method) {
			res.locals.method = req.query.method;

			rpcApi.getRpcMethodHelp(req.query.method.trim()).then(function(result2) {
				res.locals.methodhelp = result2;

				if (req.query.execute) {
					var argDetails = result2.args;
					var argValues = [];

					if (req.query.args) {
						for (var i = 0; i < req.query.args.length; i++) {
							var argProperties = argDetails[i].properties;

							for (var j = 0; j < argProperties.length; j++) {
								if (argProperties[j] == "numeric") {
									if (req.query.args[i] == null || req.query.args[i] == "") {
										argValues.push(null);

									} else {
										argValues.push(parseInt(req.query.args[i]));
									}

									break;

								} else if (argProperties[j] == "boolean") {
									if (req.query.args[i]) {
										argValues.push(req.query.args[i] == "true");
									}

									break;

								} else if (argProperties[j] == "string") {
									if (req.query.args[i]) {
										argValues.push(req.query.args[i]);
									}

									break;
								}
							}
						}
					}

					res.locals.argValues = argValues;

					if (env.rpcBlacklist.includes(req.query.method)) {
						res.locals.methodResult = "Sorry, that RPC command is blacklisted. If this is your server, you may allow this command by removing it from the 'rpcBlacklist' setting in env.js.";

						res.render("browser");

						return;
					}

					console.log("Executing RPC '" + req.query.method + "' with params: [" + argValues + "]");

					client.command([{method:req.query.method, parameters:argValues}], function(err3, result3, resHeaders3) {
						console.log("RPC Response: err=" + err3 + ", result=" + result3 + ", headers=" + resHeaders3);

						if (err3) {
							if (result3) {
								res.locals.methodResult = {error:("" + err3), result:result3};
								
							} else {
								res.locals.methodResult = {error:("" + err3)};
							}
						} else if (result3) {
							res.locals.methodResult = result3;

						} else {
							res.locals.methodResult = {"Error":"No response from node."};
						}

						res.render("browser");
					});
				} else {
					res.render("browser");
				}
			}).catch(function(err) {
				res.locals.userMessage = "Error loading help content for method " + req.query.method + ": " + err;

				res.render("browser");
			});

		} else {
			res.render("browser");
		}

	}).catch(function(err) {
		res.locals.userMessage = "Error loading help content: " + err;

		res.render("browser");
	});
});

module.exports = router;
