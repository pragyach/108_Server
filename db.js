var admin = require("firebase-admin");
var db;

exports.init = function() {
	admin.initializeApp({
		credential: admin.credential.cert("hackathon-65c39-firebase-adminsdk-lqpov-f2ee4bdab4.json"),
		databaseURL: "https://hackathon-65c39.firebaseio.com"
	});
	db = admin.database();
	console.log("DB Initialized");
};

exports.getDrivers = function(userCity, callback) {
	var drivers;
	var driverData = db.ref('driver');
	driverData.once('value', function(cities) {
		drivers = [];
		if (userCity != null) {
			if(cities.child(userCity).exists()) {
				cities.child(userCity).forEach(function(driver) {
					driver = driver.val();
					if(driver.status == 'active') {	
						drivers.push(driver);
					}
				});
				callback(drivers);
				return;
			}
		}
		cities.forEach(function(city) {
			city.forEach(function(driver) {
				driver = driver.val();
				if(driver.status == 'active') {	
					drivers.push(driver);
				}
			})
		});
		callback(drivers);
	});
}

exports.registerOTP = function (mobile, callback) {
	var otp = Math.floor(1000 + Math.random() * 9000);
	db.ref('otp/' + mobile).set(otp);
	sendSMS(mobile, 'Your OTP for SignUp is '+otp, callback);
};

exports.checkOTP = function (mobile, otp, callback) {
	otpRef = db.ref('otp/' + mobile);
	otpRef.once("value", function(originalOTP) {
		callback(otp == originalOTP.val());
	});
}

exports.registerNewRequest = function (lat, lng, mobile, location) {
	var localISOTime = (new Date(Date.now() + 19800000)).toISOString().slice(0,-5) + '+05:30';
	// console.log(localISOTime);
	newRequest = db.ref('requests').push();
	newRequest.set({
		date: localISOTime,
		latitude: lat,
		location: location,
		longitude: lng,
		mobile: mobile,
		status: 'pending'
	});
	return newRequest.key;
};

exports.sendRequestToDriver = function (driverMobile,lat, lng, name, userMobile, requestId) {
	var msg = "Laterox ["+lat+"]["+lng+"]["+name+"]["+userMobile+"]["+requestId+"]";
	sendSMS(driverMobile, msg, function(chunk) {
		console.log("sms sent to: " + driverMobile + " chunk: " + chunk);
	});
};

exports.getUserName = function (userMobile, callback) {
	var userData = db.ref('users/'+userMobile);
	userData.once('value', function(user) {
		callback(user.val());
	});
};

function sendSMS(to, msg, callback) {
	var https = require('https');
	var options = {
		host: 'control.msg91.com',
		port: 443,
		path: '/api/sendhttp.php?authkey=114503AseU8mOd1XN574c9c0c&mobiles=91'+to
		+'&message='+encodeURIComponent(msg)
		+'&sender=Latero&route=4&country=91',
		method: 'GET'
	};

	https.get(options, function(res) {
		
		res.on('data', (chunk) => {
			callback(chunk);
		});
	}).on('error', function(e) {
		console.error(e);
	});
}