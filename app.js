#!/usr/bin/env node

'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require("express-session");
var env = require("./app/env.js");
var simpleGit = require('simple-git');
var utils = require("./app/utils.js");
var moment = require("moment");
var Decimal = require('decimal.js');
var bitcoinCore = require("bitcoin-core");
var grpc = require("grpc");
var fs = require("fs");
var pug = require("pug");
var momentDurationFormat = require("moment-duration-format");
var coins = require("./app/coins.js");
var request = require("request");
var qrcode = require("qrcode");
var rpcApi = require("./app/rpcApi.js");


var baseActionsRouter = require('./routes/baseActionsRouter');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// ref: https://blog.stigok.com/post/disable-pug-debug-output-with-expressjs-web-app
app.engine('pug', (path, options, fn) => {
  options.debug = false;
  return pug.__express.call(null, path, options, fn);
});

app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
	secret: env.cookiePassword,
	resave: false,
	saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));


function refreshExchangeRate() {
	if (coins[env.coin].exchangeRateData) {
		request(coins[env.coin].exchangeRateData.jsonUrl, function(error, response, body) {
			if (!error && response && response.statusCode && response.statusCode == 200) {
				var responseBody = JSON.parse(body);

				var exchangeRate = coins[env.coin].exchangeRateData.responseBodySelectorFunction(responseBody);
				if (exchangeRate > 0) {
					global.exchangeRate = exchangeRate;
					global.exchangeRateUpdateTime = new Date();

					console.log("Using exchange rate: " + global.exchangeRate + " USD/" + coins[env.coin].name + " starting at " + global.exchangeRateUpdateTime);

				} else {
					console.log("Unable to get exchange rate data");
				}
			} else {
				console.log("Error:");
				console.log(error);
				console.log("Response:");
				console.log(response);
			}
		});
	}
}



app.runOnStartup = function() {
	global.env = env;
	global.coinConfig = coins[env.coin];
	global.coinConfigs = coins;

	if (env.donationAddresses) {
		var getDonationAddressQrCode = function(coinId) {
			qrcode.toDataURL(env.donationAddresses[coinId].address, function(err, url) {
				global.donationAddressQrCodeUrls[coinId] = url;
			});
		};

		global.donationAddressQrCodeUrls = {};

		env.donationAddresses.coins.forEach(function(item) {
			getDonationAddressQrCode(item);
		});
	}

	if (global.sourcecodeVersion == null) {
		simpleGit(".").log(["-n 1"], function(err, log) {
			global.sourcecodeVersion = log.all[0].hash.substring(0, 10);
			global.sourcecodeDate = log.all[0].date.substring(0, "0000-00-00".length);
		});
	}


	if (global.exchangeRate == null) {
		refreshExchangeRate();
	}

	// refresh exchange rate periodically
	setInterval(refreshExchangeRate, 1800000);

	// connect and pull down the current network description
	connectViaRpc().then(function() {
		rpcApi.refreshFullNetworkDescription();

		// refresh network description periodically
		setInterval(rpcApi.refreshFullNetworkDescription, 60000);
	});
};

function connectViaRpc() {
	return new Promise(function(resolve, reject) {
		// Ref: https://github.com/lightningnetwork/lnd/blob/master/docs/grpc/javascript.md

		// Due to updated ECDSA generated tls.cert we need to let gprc know that
		// we need to use that cipher suite otherwise there will be a handhsake
		// error when we communicate with the lnd rpc server.
		process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';

		// Lnd admin macaroon is at ~/.lnd/admin.macaroon on Linux and
		// ~/Library/Application Support/Lnd/admin.macaroon on Mac
		var m = fs.readFileSync(env.rpc.adminMacaroonFilepath);
		var macaroon = m.toString('hex');

		// build meta data credentials
		var metadata = new grpc.Metadata()
		metadata.add('macaroon', macaroon)
		var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
			callback(null, metadata);
		});

		//  Lnd cert is at ~/.lnd/tls.cert on Linux and
		//  ~/Library/Application Support/Lnd/tls.cert on Mac
		var lndCert = fs.readFileSync(env.rpc.tlcCertFilepath);
		var sslCreds = grpc.credentials.createSsl(lndCert);

		// combine the cert credentials and the macaroon auth credentials
		// such that every call is properly encrypted and authenticated
		var credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

		var lnrpcDescriptor = grpc.load(env.rpc.lndRpcProtoFileFilepath); // "rpc.proto"
		var lnrpc = lnrpcDescriptor.lnrpc;

		// uncomment to print available function of RPC protocol
		//console.log(lnrpc);
		
		var lightning = new lnrpc.Lightning(env.rpc.host + ":" + env.rpc.port, credentials);

		lightning.GetInfo({}, function(err, response) {
			if (err) {
				console.log("Error connecting to LND @ " + env.rpc.host + ":" + env.rpc.port + " via RPC: " + err);
			}

			console.log("Connected to LND @ " + env.rpc.host + ":" + env.rpc.port + " via RPC.\n\nGetInfo=" + JSON.stringify(response, null, 4));

			global.lightning = lightning;

			resolve();
		});
	});
}



app.use(function(req, res, next) {
	// make session available in templates
	res.locals.session = req.session;
	
	if (env.rpc) {
		req.session.host = env.rpc.host;
		req.session.port = env.rpc.port;
		req.session.username = env.rpc.username;

		global.client = new bitcoinCore({
			host: env.rpc.host,
			port: env.rpc.port,
			username: env.rpc.username,
			password: env.rpc.password,
			timeout: 5000
		});
	}

	res.locals.env = global.env;
	res.locals.coinConfig = global.coinConfig;
	
	res.locals.host = req.session.host;
	res.locals.port = req.session.port;


	// currency format type
	if (!req.session.currencyFormatType) {
		var cookieValue = req.cookies['user-setting-currencyFormatType'];

		if (cookieValue) {
			req.session.currencyFormatType = cookieValue;

		} else {
			req.session.currencyFormatType = "";
		}
	}

	res.locals.currencyFormatType = req.session.currencyFormatType;


	if (!["/", "/connect"].includes(req.originalUrl)) {
		if (utils.redirectToConnectPageIfNeeded(req, res)) {
			return;
		}
	}
	
	if (req.session.userMessage) {
		res.locals.userMessage = req.session.userMessage;
		
		if (req.session.userMessageType) {
			res.locals.userMessageType = req.session.userMessageType;
			
		} else {
			res.locals.userMessageType = "warning";
		}

		req.session.userMessage = null;
		req.session.userMessageType = null;
	}

	if (req.session.query) {
		res.locals.query = req.session.query;

		req.session.query = null;
	}

	// make some var available to all request
	// ex: req.cheeseStr = "cheese";

	next();
});

app.use('/', baseActionsRouter);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

app.locals.moment = moment;
app.locals.Decimal = Decimal;
app.locals.utils = utils;



module.exports = app;
