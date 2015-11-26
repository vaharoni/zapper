_u = require('underscore');
var http = require('http');
var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.redirect('/index.html');
});

app.get('/test', function(req,res) {
	res.send('hello world');
});

var zapperClients = [];
var lastRequest = null;
var lastRequestTime;

app.get('/server', function(req,res) {
	res.send(_u(zapperClients).map(function(x) { return clientObjToStr(x) }));
});

app.get('/lastrequest', function(req,res) {
	if (lastRequest != null) {
		res.send({timestamp: lastRequestTime, headers: lastRequest.headers});
	} else {
		res.send(null);
	}
		
});

// var s = http.createServer(function(req, res) {
app.post('/server', function(req, res) {
	req.setEncoding('utf8');
	lastRequest = req;
	lastRequestTime = Date();
	
	req.on('data', function(data) {
		var dataHash = parseData(data);
		var clientType = dataHash["client"];

		if(clientType == "processing") {
			console.log("registered processing client ", dataHash["clientId"]);
			
			var clientId = dataHash["clientId"];
			if (clientId == undefined) {
				console.log("ERROR: ClientID wasn't sent properly");
			} else {
				var clientObj = {active: true, response: res, clientId: clientId};
				if (zapperClients[clientId] == undefined) {
					clientObj["stamp"] = 1;
				} else {
					clientObj["stamp"] = zapperClients[clientId]["stamp"] + 1;
				}
				zapperClients[clientId] = clientObj;

				setTimeout(function() {
					// Make sure an older client doesn't timeout a newer client
					if (clientObj["stamp"] == zapperClients[clientId]["stamp"]) {
						sendData(clientId, "timeout");
					}
				}, 25000);

				req.on('close', function() {
					if (clientObj["stamp"] == zapperClients[clientId]["stamp"]) {
						unregisterClient(clientId);
					}
				});	
				
				for (i=0; i<zapperClients.length; i++) {
					var z = zapperClients[i];
					if (z!=undefined) console.log("clientId=", i, "active=",z["active"], "stamp=",z["stamp"]);
				}
			}
		} else if(clientType == "web") {
			// var strength = mapRange(dataHash['strength'], 1, 5, 50, 255);
			// var duration = mapRange(dataHash['duration'], 1, 3, 100, 500);

			// Moving range mapping to the client
			var strength = dataHash['strength'];
			var duration = dataHash['duration'];
			console.log("ZAP! data= ", dataHash, "strength=", strength, " duration=", duration);			

			if (strength > 0 && duration > 0) {							
				// Send to the first zapper client
				for (i = 0; i < zapperClients.length; i++) {
					if(zapperClients[i] != undefined && zapperClients[i]["active"]) {
						sendData(i, strength, duration);
						break;
					}
				}				
			}
			
			// Send status to the web client
			res.setHeader('Access-Control-Allow-Origin', "*");
			res.end(isConnected());
		} else {
			console.log("ERROR: Unrecognized client ", clientType);
		}		
	})
});

// OBSOLETE - Moved decision to the client
function mapRange(value, minValue, maxValue, minRange, maxRange) {
	if (value == undefined || value * 1.0 > maxValue || value * 1.0 < minValue) return null;
	return Math.round(((1.0 * value - minValue) / (maxValue - minValue)) * (maxRange - minRange) + minRange);
}

function parseData(data) {
	var dataHash = {};
	_u(data.split("&")).each(function(pair) {
		var k_v = pair.split("=");
		dataHash[k_v[0]] = k_v[1].replace(/\+/g, " ");
	});	
	return dataHash;
}

function unregisterClient(clientId) {
	console.log("unregistered processing client");
	zapperClients[clientId]["active"] = false;
}

function sendData(zapperIndex, strength, duration) {
	console.log("sending ", strength, duration, "to ", zapperIndex)
	zapperClients[zapperIndex]["response"].end(zapperIndex + "$" + strength + "$" + duration);
	unregisterClient(zapperIndex);					
}

function isConnected() {
	for (i = 0; i < zapperClients.length; i++) {
		if(zapperClients[i] != undefined && zapperClients[i]["active"]) {
			return "true";
		}	
	}
	return "false";
}

function clientObjToStr(obj) {
	if (obj == undefined || obj == null) return null;
	
	return {stamp: obj["stamp"], clientId: obj["clientId"], active: obj["active"]};
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});