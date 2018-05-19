var fullNetworkDescription = null;

function getFullNetworkDescription() {
	return new Promise(function(resolve, reject) {
		if (fullNetworkDescription == null) {
			refreshFullNetworkDescription().then(function() {
				resolve(fullNetworkDescription);
			});

		} else {
			resolve(fullNetworkDescription);
		}
	});
}

function refreshFullNetworkDescription() {
	var startTime = new Date();

	console.log("Refreshing network description...");
	
	return new Promise(function(resolve_1, reject_1) {
		lightning.describeGraph({}, function(err, describeGraphResponse) {
			if (err) {
				console.log("Error 2397gr2039rf6g2: " + err);
			}

			var nodeInfoByPubkey = {};

			var promises = [];
			describeGraphResponse.nodes.forEach(function(node) {
				promises.push(new Promise(function(resolve_2, reject_2) {
					lightning.getNodeInfo({pub_key:node.pub_key}, function(err2, nodeInfoResponse) {
						if (err2) {
							console.log("Error 312r9ygef9y: " + err2);
						}

						nodeInfoByPubkey[node.pub_key] = nodeInfoResponse;

						resolve_2();
					});
				}));
			});

			Promise.all(promises).then(function() {
				fullNetworkDescription = compileFullNetworkDescription(describeGraphResponse, nodeInfoByPubkey);

				console.log("Finished refreshing network description; elapsed time: " + (new Date().getTime() - startTime.getTime()));

				resolve_1();
			});
		});
	});
}

function compileFullNetworkDescription(describeGraphResponse, nodeInfoByPubkey) {
	var fnd = {};
	fnd.lastUpdate = new Date();

	fnd.nodes = {};
	fnd.nodes.sortedByLastUpdate = [];
	fnd.nodes.sortedByChannelCount = [];
	fnd.nodes.sortedByTotalCapacity = [];

	describeGraphResponse.nodes.sort(function(a, b) {
		return b.last_update - a.last_update;
	});

	describeGraphResponse.nodes.forEach(function(node) {
		fnd.nodes.sortedByLastUpdate.push(nodeInfoByPubkey[node.pub_key]);
	});

	fnd.nodes.sortedByChannelCount = fnd.nodes.sortedByLastUpdate.slice(0); // shallow copy
	fnd.nodes.sortedByChannelCount.sort(function(a, b) {
		var channelDiff = b.num_channels - a.num_channels;

		if (channelDiff == 0) {
			return b.last_update - a.last_update;

		} else {
			return channelDiff;
		}
	});

	fnd.nodes.sortedByTotalCapacity = fnd.nodes.sortedByLastUpdate.slice(0); // shallow copy
	fnd.nodes.sortedByTotalCapacity.sort(function(a, b) {
		var capacityDiff = b.total_capacity - a.total_capacity;

		if (capacityDiff == 0) {
			return b.last_update - a.last_update;

		} else {
			return capacityDiff;
		}
	});


	

	fnd.channels = {};
	fnd.channels.sortedByLastUpdate = describeGraphResponse.edges;
	fnd.channels.sortedByCapacity = describeGraphResponse.edges.slice(0);

	fnd.channels.sortedByLastUpdate.sort(function(a, b) {
		return b.last_update - a.last_update;
	});

	fnd.channels.sortedByCapacity.sort(function(a, b) {
		var capacityDiff = b.capacity - a.capacity;

		if (capacityDiff == 0) {
			return b.last_update - a.last_update;

		} else {
			return capacityDiff;
		}
	});

	

	return fnd;
}

module.exports = {
	getFullNetworkDescription: getFullNetworkDescription,
	refreshFullNetworkDescription: refreshFullNetworkDescription
};
