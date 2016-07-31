/*Variable area*/
//var opus = require('node-opus');
var _ = require('underscore');
var request = require('request');
//var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
//var $ = require ('jquery');
var fs = require('fs');
var jsonfile = require('jsonfile');
var crypto = require('crypto');
var moment = require('moment');
var oauthSig = require('oauth-signature');
var Discordbot = require('discord.io');
var bot = new Discordbot({
	email: "chaoulgs@mymail.vcu.edu",
	password: "newman",
	autorun: true
});

var gambleFile = 'gambledata.json';
var gambleFileBackup = 'gambledatabackup.json';
var movieFile = 'moviedata.json';
var movie = 'No movie set';
var joldMuted = false;

var discordIds = [];

//janky array to decode people's ids
discordIds['mudkip'] = '105036242898415616';
discordIds['Realwarzh'] = '104864925838491648';
discordIds['Jold'] = '133761036539920384';
discordIds['Chongman'] = '105877522914250752';
discordIds['GMaul'] = '105513296139943936';
discordIds['Jelly'] = '167888315775844352';
discordIds['BigRedJuggernaut'] = '105040787271643136';
discordIds['105036242898415616'] = 'mudkip';
discordIds['104864925838491648'] = 'warzh';
discordIds['133761036539920384'] = 'jold';
discordIds['105877522914250752'] = 'chongman';
discordIds['105513296139943936'] = 'gmaul';
discordIds['105040787271643136'] = 'bigred';
discordIds['176880543546343426'] = 'arandar';
discordIds['167888315775844352'] = 'jelly'; 
/*Event area*/
bot.on("err", function(error) {
	console.log(error)
});

bot.on("ready", function(rawEvent) {
	console.log("Connected!");
	console.log("Logged in as: ");
	console.log(bot.username + " - (" + bot.id + ")");
	generateToken();
});

bot.on("disconnected", function(rawEvent){	
	setTimeout(function() {
		bot.connect();
		bot.leaveVoiceChannel("105094891633168384");
	}, 10000);	
});

function generateToken() {
	var gambleData;
		var usersInGym = bot.servers['104865451246358528'].channels['105094891633168384'].members;
		var usersInGrave = bot.servers['104865451246358528'].channels['107530645034508288'].members;
		//bring in existing gamble data
		jsonfile.readFile(gambleFile, function(err, obj){
			gambleData = obj;
			//add a token amount to everyone in the gym
			//console.log(discordIds);
			//console.log('users in gym');
			//console.log(usersInGym);
			_.each(usersInGym, function(gymUser){
				//console.log(discordIds[gymUser.user_id] + ' - ' + gymUser.user_id);
				//console.log(gymUser);
				_.each(gambleData, function(userData){
					if(gymUser.user_id == userData.discordId){
						userData.tokens = parseInt(userData.tokens) + 10;
					}		
				});
			});
	
			_.each(usersInGrave, function(graveUser){
				_.each(gambleData, function(userData){
					if(graveUser.user_id == userData.discordId){
						userData.tokens = parseInt(userData.tokens) + 4;
					}		
				});
			});
	
			//console.log(gambleData);
			//save over old gamble data
			if(gambleData !== undefined){
				jsonfile.writeFile(gambleFile, gambleData, function(err){
					console.log(err);
				});
			} else {
				console.log('Token data is borked - preventing save. Tell mudkip to restart the bot!');
			}			
		});
	
		//queue up the next token generation event
		setTimeout(generateToken, 60000);
}

function tradeTokens(sender, receiver, amount, channelID) {
	var gambleData;
	console.log('Sender: ' + sender);
	console.log('receiver: ' + receiver);
	console.log('amount: ' + amount);
	jsonfile.readFile(gambleFile, function(err, obj){
		gambleData = obj;
		console.log(sender);
		console.log('original gamble data: ');
		console.log(gambleData);
		var senderData = _.where(gambleData, {discordId : sender});
		var receiverData = _.where(gambleData, {username : receiver});
		console.log('balance after upcoming transaction: ');
		//console.log(senderData[0].tokens + ' - ' + amount);
		console.log(parseInt(senderData[0].tokens) - parseInt(amount));
		if(parseInt(amount) < 0)
		{
			sendMessages(channelID,['Token amount must be positive.']);		 
		}	
		else if(parseInt(senderData[0].tokens) - parseInt(amount) >= 0)
		{
			//check all users, modify only the sender and the receiver
			_.each(gambleData, function(userData){
				//get the sender and take away his tokens
				if(userData.discordId == sender){
					userData.tokens = parseInt(userData.tokens) - parseInt(amount);
				}
				//get the receiver and give him the tokens
				else if(userData.username == receiver ){
					userData.tokens = parseInt(userData.tokens) + parseInt(amount);
				}
			});
			console.log('modified gamble data');
			console.log(gambleData);

			if(gambleData !== undefined){
				jsonfile.writeFile(gambleFile, gambleData, function(err){
					console.log(err);
				});
			} else {
				sendMessages(channelID, ['Token data is borked - preventing save. Tell mudkip to restart the bot!']);
				return;
			}

			sendMessages(channelID,[discordIds[sender] + ' gave ' + receiver + ' ' + amount + ' tokens.']);
		}
		else
		{
			sendMessages(channelID,["You don't have enough tokens to perform that trade."]);
		}
	});	
}

unmuteJold = function() {
	bot.unmute({
    	channel: "104865451246358528",
    	target: "133761036539920384"
    	//lastDays: 1 //ONLY used in banning. A number that can be either 1 or 7. It's also optional.
	});
}

muteJold = function () {
	bot.mute({
    	channel: "104865451246358528",
    	target: "133761036539920384"
    	//lastDays: 1 //ONLY used in banning. A number that can be either 1 or 7. It's also optional.
	});
}

bot.on("message", function(user, userID, channelID, message, rawEvent) {
	console.log(user + " - " + userID);
	console.log("in " + channelID);
	console.log(message);
	console.log("----------");
	var now = moment();
	var oneMinuteFromNow = moment().add(1, 'minutes');
	var joldTime;
	
	if (message ==="ping") {
		console.log(channelID);
		sendMessages(channelID, ["Pong"]); //Sending a message with our helper function
	}
	else if(message ==="!mutejold") {
		muteJold();
		sendMessages(channelID, ["MUTING JOLD'S CANDY ASS"]);	
		/*
		if(joldMuted){
			sendMessages(channelID, ["Jold is already muted, he will be unmuted at: " + joldTime ]);
		}
		else {			
			joldTime = oneMinuteFromNow._d;
			joldMuted = true;
			sendMessages(channelID, ["Muting Jold for one minute, he will be unmuted at: " + joldTime ]);
		}
		*/
	}
	else if(message ==="!unmutejold") {
		console.log(userID);
		if(userID !== '133761036539920384')
		{
			unmuteJold();
		}
		//sendMessages(channelID, ["KICKING JOLD'S CANDY ASS"]);		
	}
	else if(message ==="fuck warzh")
	{
		sendMessages(channelID, ["yeah fuck warzh"]);
	}
	else if(message ==="!commands")	{
		
		sendMessages(channelID,["http://notepad.pw/gzbotcommands"]);
	}
	else if (message ==="!ANDY")
	{
		sendMessages(channelID,["**A.N.D.Y** *Artificial Neutron Displacement Yield*: The hit new 2-D thriller from Gmaul studios!"]);
	}
	else if (message === "!secretshop")
	{
		sendMessages(channelID, ['( ° ͜ʖ͡°)╭∩╮ Hey ' + user + ', here\'s a "secret shop" for you. ( ° ͜ʖ͡°)╭∩╮ ']);
	}
	else if(message ==="/roll") {
		var randomNumber = Math.floor(Math.random()*100);
		sendMessages(channelID, [user + " rolled " + randomNumber + " out of 100."]);
	}
	else if(message.indexOf("/roll ") === 0)
	{
		var rollOutOf = parseInt(message.replace('/roll ',''));

		var randomNumber = Math.floor(Math.random() * rollOutOf) + 1;
		sendMessages(channelID, [user + " rolled " + randomNumber + " out of " + rollOutOf + "."]);
	}
	else if(message ==="!backlog")
	{
		sendMessages(channelID, ["http://notepad.pw/gzbotbacklog"]);
	}
	else if(message ==="!gmaulstream")
	{
		sendMessages(channelID,["http://www.hitbox.tv/gmaul"]);
	}
	else if(message ==="!gzspeak")
	{
		bot.joinVoiceChannel("105094891633168384", function() {
			
		});
	}
	else if(message ==="!gzquiet")
	{	
		bot.leaveVoiceChannel("105094891633168384");
	}
	else if (message ==="!bullshit")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/bullshit.mp3');
		});
	}
	else if (message ==="!saystuff")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/saystuff.mp3');
		});
	}
	else if (message ==="!noway")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/noway.mp3');
		});
	}
	else if (message ==="!quit"){
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/quit.mp3');
		});
	}
	else if (message ==="!double"){
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/double.mp3');
		});
	}
	else if (message ==="!hotta"){
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/hotta.mp3');
		});
	}
	else if (message ==="!goldentongue"){
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/goldentongue.mp3');
		});
	}
	else if (message ==="!woodaddy"){
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/woodaddy.mp3');
		});
	}
	else if (message ==="!legend")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/bigredlegend.mp3');
		});
	}
	else if (message ==="!job")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/job.mp3');
		});
	}
	else if (message ==="!kingjold")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/jold.mp3');
		});
	}
	else if (message ==="!bigredsdick")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/bigredsdick.mp3');
		});
	}
	else if (message ==="!bigredstory")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/bigredstory.mp3');
		});
	}
	else if (message ==="!start")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/start.mp3');
		});
	}
	else if (message ==="!bigredmeme")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/bigredmeme.mp3');
		});
	}
	else if (message ==="!strategy")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/joldstrat.mp3');
		});
	}
	else if (message ==="!rage")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/rageboys.mp3');
		});
	}
	else if (message ==="!pk")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/pk.mp3');
		});
	}
	else if (message ==="!chongmom")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/chongmom.mp3');
		});
	}
	else if (message ==="!thegreat")
	{
		bot.getAudioContext({channel: "105094891633168384", stereo: true}, function(stream) {
    			stream.playAudioFile('resources/audio/thegreat.mp3');
		});
	}
	else if(message ==="!rekt")
	{
		sendMessages(channelID,["R E K T","E","K","T"]);
	}
	else if(message ==="!stinked")
	{
		sendMessages(channelID,["S T I N K E D \nT \nI \nN \nK \nE \nD \n :poop:"]);
	}
	else if(message.indexOf("!setmovie") === 0)
	{
		movie = message.replace('!setmovie ','');
		sendMessages(channelID,["Movie has been set to: " + movie]);
	}
	else if(message.indexOf("!givetokens") === 0)
	{
		var tradeParameters = message.replace('!givetokens ','').split(' ');
		console.log(tradeTokens(userID, tradeParameters[0], tradeParameters[1], channelID));
		//sendMessages(channelID,["Movie has been set to: " + movie]);
	}
	else if(message === "!movie")
	{
		fs.exists(movieFile, function(exists) {
			if (exists) {
		  		fs.stat(movieFile, function(error, stats) {
		    		fs.open(movieFile, "r", function(error, fd) {
			    		var buffer = new Buffer(stats.size);			
		      			fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
		        			var movieDataText = buffer.toString("utf8", 0, buffer.length);
		        			fs.close(fd);
		        			//console.log(gambleDataText);
		        			//gambleData = JSON.parse(gambleDataText);
		        			var movieData = JSON.parse(movieDataText);		        			
		        			sendMessages(channelID,["This week's movie is " + movieData.movie + ". Movie night is Sunday at " + movieData.movietime]);
		      			});
		    		});
		  		});
			}
		});	
		
	}
	else if(message ==="(puke)")
	{
		sendFiles(channelID, ["resources/images/pukeface.png"]);
	}
	else if (message ==="!jold")
	{
		sendFiles(channelID, ["resources/images/joldboys.png"]);
	}
	else if (message ==="!bigred")
	{
		sendFiles(channelID, ["resources/images/fakebigred.png"]);
	}
	else if (message ==="!arandargf")
	{
		sendFiles(channelID, ["resources/images/arandargf.jpg"]);
	}
	else if (message ==="!gmaul")
	{
		sendFiles(channelID, ["resources/images/gmaul.png"]);
	}
	//gets chong's latest tweet
	else if (message ==="!chong")
	{		
		var Twitter = require('twitter');

		var client = new Twitter({
			consumer_key: 'wRFNbemuAimxp2fcOAvuxWfvq',
			consumer_secret: 'picwde3NHhlLmTqvI2IdbM004OmHR8vkeBZ2ZthWmDLjhSQnyz',
			access_token_key: '4247514815-cPGtkp8hnXlCUIhhwMdQ2fY7tEjCdIIDIz0sFls',
			access_token_secret: 'aT3rXq2PnYrRJ1Aytzl2gkVvuEaQWn7C6KFvgXFj6IKKT'
		});

		var params = {screen_name: 'EpicurusEgg'};

		client.get('statuses/user_timeline',params, function (error, tweets, response){
			if(error) {
				console.log(error);
			}
			else {
				var tweetDate = moment(tweets[0].created_at).format('MM-DD-YYYY h:mm:ss a');
				console.log(tweets);
				sendMessages(channelID,["***Your daily wisdom from David Chong:*** \r " + tweetDate + "\r" + tweets[0].text]);
			}
		});		

	}
	else if(message.indexOf("!foodinfo") === 0)
	{
		var foodId = message.replace('!foodinfo ','');
		var fatNonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		var fatSharedSecret = 'c7bb801d2faf407a9bd55e59eac8aa39';
		var fatKey = '890dfc862ce6482cb2f7173dd65636b0';
		var epochDays = Math.floor(moment().unix()/86400);
		var epochSeconds = moment().unix();
		var fatSecretBaseApiUrl = 'http://platform.fatsecret.com/rest/server.api';

		var monthsFatRequestParams =	'food_id=' + foodId +
										'&format=json' +
										'&method=food.get' +
										'&oauth_consumer_key='+ fatKey + 
										'&oauth_nonce=' + fatNonce +
										'&oauth_signature_method=HMAC-SHA1' + 
										'&oauth_timestamp=' + epochSeconds + 
										'&oauth_version=1.0';

		//pass in the concatenated base api url and oauth parameters
		var signatureBaseString = 'GET&' +
			encodeURIComponent(fatSecretBaseApiUrl) + '&' +
			encodeURIComponent(monthsFatRequestParams);

		console.log('sig base string: ' + signatureBaseString);

		fatSharedSecret = fatSharedSecret + '&';

		var hashedBaseString = crypto.createHmac('sha1', fatSharedSecret).update(signatureBaseString).digest('base64');
		hashedBaseString = encodeURIComponent(hashedBaseString);

		monthsFatRequestParams +=	'&oauth_signature=' + hashedBaseString;		

		var monthsFatRequestUrl = fatSecretBaseApiUrl + '?' + monthsFatRequestParams;

		request(monthsFatRequestUrl, function(error, response, body){
			if(!error && response.statusCode == 200) {
				var bodyAsJson = JSON.parse(body);
				console.log(bodyAsJson);
				if(bodyAsJson.error){
					sendMessages(channelID, [ bodyAsJson.error.message ]);
				}
				else{
					sendMessages(channelID, ["A " + bodyAsJson.food.servings.serving[0].measurement_description + " of " + bodyAsJson.food.food_name + " has " + bodyAsJson.food.servings.serving[0].calories + " calories "]);
				}
				
			} else {
				//sendMessages(channelID, ['some shit fucked up fam - tell the spaghetti master']);
				console.log(response.statusCode);
			}
		});
	}

	/*
	//verifier code - 
	else if(message.indexOf("!getrequesttoken") === 0)
	{
		//var foodId = message.replace('!foodinfo ','');
		var fatNonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		var fatSharedSecret = 'c7bb801d2faf407a9bd55e59eac8aa39';
		var fatKey = '890dfc862ce6482cb2f7173dd65636b0';
		var epochDays = Math.floor(moment().unix()/86400);
		var epochSeconds = moment().unix();
		var fatSecretBaseApiUrl = 'http://www.fatsecret.com/oauth/request_token';

		var monthsFatRequestParams =	'date=' + epochDays +
										'&format=json' +
										'&oauth_callback=oob' +
										'&oauth_consumer_key='+ fatKey + 
										'&oauth_nonce=' + fatNonce +
										'&oauth_signature_method=HMAC-SHA1' + 
										'&oauth_timestamp=' + epochSeconds + 
										'&oauth_version=1.0';

		//pass in the concatenated base api url and oauth parameters
		var signatureBaseString = 'GET&' +
			encodeURIComponent(fatSecretBaseApiUrl) + '&' +
			encodeURIComponent(monthsFatRequestParams);

		console.log('sig base string: ' + signatureBaseString);

		fatSharedSecret = fatSharedSecret + '&';

		var hashedBaseString = crypto.createHmac('sha1', fatSharedSecret).update(signatureBaseString).digest('base64');
		hashedBaseString = encodeURIComponent(hashedBaseString);

		monthsFatRequestParams +=	'&oauth_signature=' + hashedBaseString;		

		var monthsFatRequestUrl = fatSecretBaseApiUrl + '?' + monthsFatRequestParams;

		request(monthsFatRequestUrl, function(error, response, body){
			if(!error && response.statusCode == 200) {
				var bodyAsJson = JSON.parse(body);
				console.log('body as json');
				console.log(bodyAsJson);				
			} else {
				console.log('error message:');
				console.log(response);
			}
		});
	}
	*/
	
	//verifier code - 6360161
	/*
	else if(message.indexOf("!getaccesstoken") === 0)
	{
		//var foodId = message.replace('!foodinfo ','');
		var fatNonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		var fatSharedSecret = 'c7bb801d2faf407a9bd55e59eac8aa39';
		var fatKey = '890dfc862ce6482cb2f7173dd65636b0';
		var epochDays = Math.floor(moment().unix()/86400);
		var epochSeconds = moment().unix();
		var fatSecretBaseApiUrl = 'http://www.fatsecret.com/oauth/access_token';
		var mudkipRequestToken = '44cf162255ea40b2a6ab0f5fcf5fe543';
		var mudkipTokenSecret = 'ec9362c3c86c4f92a8ee1428d989f39a';
		//permanent access token for mudkip = c4de770cbdbc49fe95bf6206f323db17
		//permanent access token secret for mudkip = abdaa98ebd9b4e4bbc4d50c1f12860f6

		var monthsFatRequestParams =	'format=json' +
										'&oauth_consumer_key='+ fatKey + 
										'&oauth_nonce=' + fatNonce +
										'&oauth_signature_method=HMAC-SHA1' + 
										'&oauth_timestamp=' + epochSeconds +
										'&oauth_token=' + mudkipRequestToken +
										'&oauth_verifier=7737366' +
										'&oauth_version=1.0';

		//pass in the concatenated base api url and oauth parameters
		var signatureBaseString = 'GET&' +
			encodeURIComponent(fatSecretBaseApiUrl) + '&' +
			encodeURIComponent(monthsFatRequestParams);

		console.log('sig base string: ' + signatureBaseString);

		fatSharedSecret = fatSharedSecret + '&' + mudkipTokenSecret;

		var hashedBaseString = crypto.createHmac('sha1', fatSharedSecret).update(signatureBaseString).digest('base64');
		hashedBaseString = encodeURIComponent(hashedBaseString);

		monthsFatRequestParams += '&oauth_signature=' + hashedBaseString;		

		var monthsFatRequestUrl = fatSecretBaseApiUrl + '?' + monthsFatRequestParams;

		request(monthsFatRequestUrl, function(error, response, body){
			if(!error && response.statusCode == 200) {
				var bodyAsJson = JSON.parse(body);
				console.log('body as json');
				console.log(bodyAsJson);				
			} else {
				console.log('error message:');
				console.log(response.body);
			}
		});
	}
	*/

	/*
	else if(message.indexOf("!todaysfat") === 0)
	{
		//var foodId = message.replace('!foodinfo ','');
		var fatNonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		var fatSharedSecret = 'c7bb801d2faf407a9bd55e59eac8aa39';
		var fatKey = '890dfc862ce6482cb2f7173dd65636b0';
		var epochDays = Math.floor(moment().unix()/86400) - 1;
		var epochSeconds = moment().unix();
		var fatSecretBaseApiUrl = 'http://platform.fatsecret.com/rest/server.api';
		var mudkipAccessToken = 'c4de770cbdbc49fe95bf6206f323db17';
		var mudkipTokenSecret = 'abdaa98ebd9b4e4bbc4d50c1f12860f6';

		var monthsFatRequestParams =	'date=' + epochDays +
										'&format=json' +
										'&method=food_entries.get' +
										'&oauth_consumer_key='+ fatKey + 
										'&oauth_nonce=' + fatNonce +
										'&oauth_signature_method=HMAC-SHA1' + 
										'&oauth_timestamp=' + epochSeconds +
										'&oauth_token=' + mudkipAccessToken +
										'&oauth_version=1.0';

		//pass in the concatenated base api url and oauth parameters
		var signatureBaseString = 'GET&' +
			encodeURIComponent(fatSecretBaseApiUrl) + '&' +
			encodeURIComponent(monthsFatRequestParams);

		console.log('sig base string: ' + signatureBaseString);

		fatSharedSecret = fatSharedSecret + '&' + mudkipTokenSecret;

		var hashedBaseString = crypto.createHmac('sha1', fatSharedSecret).update(signatureBaseString).digest('base64');
		hashedBaseString = encodeURIComponent(hashedBaseString);

		monthsFatRequestParams += '&oauth_signature=' + hashedBaseString;		

		var monthsFatRequestUrl = fatSecretBaseApiUrl + '?' + monthsFatRequestParams;

		request(monthsFatRequestUrl, function(error, response, body){
			if(!error && response.statusCode == 200) {
				var bodyAsJson = JSON.parse(body);
				console.log('body as json');
				console.log(bodyAsJson);
						
			} else {
				console.log('error message:');
				console.log(response.body);
			}
		});
	}
	*/

	else if(message.indexOf("!todaysfat") === 0)
	{
		var fatNonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		var fatSharedSecret = 'c7bb801d2faf407a9bd55e59eac8aa39';
		var fatKey = '890dfc862ce6482cb2f7173dd65636b0';
		var epochDays = Math.floor(moment().unix()/86400) - 1;
		var epochSeconds = moment().unix();
		var fatSecretBaseApiUrl = 'http://platform.fatsecret.com/rest/server.api';
		var mudkipAccessToken = 'c4de770cbdbc49fe95bf6206f323db17';
		var mudkipTokenSecret = 'abdaa98ebd9b4e4bbc4d50c1f12860f6';

		var monthsFatRequestParams =	'date=' + epochDays +
										'&format=json' +
										'&method=food_entries.get_month' +
										'&oauth_consumer_key='+ fatKey + 
										'&oauth_nonce=' + fatNonce +
										'&oauth_signature_method=HMAC-SHA1' + 
										'&oauth_timestamp=' + epochSeconds +
										'&oauth_token=' + mudkipAccessToken +
										'&oauth_version=1.0';

		//pass in the concatenated base api url and oauth parameters
		var signatureBaseString = 'GET&' +
			encodeURIComponent(fatSecretBaseApiUrl) + '&' +
			encodeURIComponent(monthsFatRequestParams);

		console.log('sig base string: ' + signatureBaseString);

		fatSharedSecret = fatSharedSecret + '&' + mudkipTokenSecret;

		var hashedBaseString = crypto.createHmac('sha1', fatSharedSecret).update(signatureBaseString).digest('base64');
		hashedBaseString = encodeURIComponent(hashedBaseString);

		monthsFatRequestParams += '&oauth_signature=' + hashedBaseString;		

		var monthsFatRequestUrl = fatSecretBaseApiUrl + '?' + monthsFatRequestParams;

		request(monthsFatRequestUrl, function(error, response, body){
			if(!error && response.statusCode == 200) {
				var bodyAsJson = JSON.parse(body);
				//console.log('body as json');
				//console.log(bodyAsJson);
				var daysArray = bodyAsJson.month.day;
				_.each(daysArray, function(day){
					if(day.date_int == epochDays){
						console.log();
						console.log(day);
						sendMessages(channelID, ["***Here are Mudkip\'s consumption statistics for today:***","Calories: " + day.calories + " Carbs: " + day.carbohydrate + " Fat: " + day.fat + " Protein: " + day.protein]);
					}
				});
						
			} else {
				console.log('error message:');
				console.log(response.body);
			}
		});
	}

	else if(message.indexOf("!yesterdaysfat") === 0)
	{
		//var foodId = message.replace('!foodinfo ','');
		var fatNonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		var fatSharedSecret = 'c7bb801d2faf407a9bd55e59eac8aa39';
		var fatKey = '890dfc862ce6482cb2f7173dd65636b0';
		var epochDays = Math.floor(moment().unix()/86400) - 2;
		var epochSeconds = moment().unix();
		var fatSecretBaseApiUrl = 'http://platform.fatsecret.com/rest/server.api';
		var mudkipAccessToken = 'c4de770cbdbc49fe95bf6206f323db17';
		var mudkipTokenSecret = 'abdaa98ebd9b4e4bbc4d50c1f12860f6';

		var monthsFatRequestParams =	'date=' + epochDays +
										'&format=json' +
										'&method=food_entries.get_month' +
										'&oauth_consumer_key='+ fatKey + 
										'&oauth_nonce=' + fatNonce +
										'&oauth_signature_method=HMAC-SHA1' + 
										'&oauth_timestamp=' + epochSeconds +
										'&oauth_token=' + mudkipAccessToken +
										'&oauth_version=1.0';

		//pass in the concatenated base api url and oauth parameters
		var signatureBaseString = 'GET&' +
			encodeURIComponent(fatSecretBaseApiUrl) + '&' +
			encodeURIComponent(monthsFatRequestParams);

		console.log('sig base string: ' + signatureBaseString);

		fatSharedSecret = fatSharedSecret + '&' + mudkipTokenSecret;

		var hashedBaseString = crypto.createHmac('sha1', fatSharedSecret).update(signatureBaseString).digest('base64');
		hashedBaseString = encodeURIComponent(hashedBaseString);

		monthsFatRequestParams += '&oauth_signature=' + hashedBaseString;		

		var monthsFatRequestUrl = fatSecretBaseApiUrl + '?' + monthsFatRequestParams;

		request(monthsFatRequestUrl, function(error, response, body){
			if(!error && response.statusCode == 200) {
				var bodyAsJson = JSON.parse(body);
				//console.log('body as json');
				//console.log(bodyAsJson);
				var daysArray = bodyAsJson.month.day;
				_.each(daysArray, function(day){
					if(day.date_int == epochDays){
						console.log();
						console.log(day);
						sendMessages(channelID, ["***Here are Mudkip\'s consumption statistics for yesterday:***","Calories: " + day.calories + " Carbs: " + day.carbohydrate + " Fat: " + day.fat + " Protein: " + day.protein]);
					}
				});
						
			} else {
				console.log('error message:');
				console.log(response.body);
			}
		});
	}

	//gets one of chongs latest 200 tweets
	else if (message ==="!randomchong")
	{
		var Twitter = require('twitter');

		var client = new Twitter({
			consumer_key: 'wRFNbemuAimxp2fcOAvuxWfvq',
			consumer_secret: 'picwde3NHhlLmTqvI2IdbM004OmHR8vkeBZ2ZthWmDLjhSQnyz',
			access_token_key: '4247514815-cPGtkp8hnXlCUIhhwMdQ2fY7tEjCdIIDIz0sFls',
			access_token_secret: 'aT3rXq2PnYrRJ1Aytzl2gkVvuEaQWn7C6KFvgXFj6IKKT'
		});

		var params = {screen_name: 'EpicurusEgg', count: 200};

		client.get('statuses/user_timeline',params, function (error, tweets, response){
			if(error) {
				console.log(error);
			}
			else {
				var randomIndex = Math.floor(Math.random()*200)+1;
				console.log(randomIndex);
				var randomTweetDate = moment(tweets[randomIndex].created_at).format('MM-DD-YYYY h:mm:ss a');
				sendMessages(channelID,["***A random one of David Chong's tweets:*** \r" + randomTweetDate + "\r" + tweets[randomIndex].text]);
			}
		});		
	}

	else if (message ==="!chongscore")
	{
		request('https://na.api.pvp.net/api/lol/na/v1.3/game/by-summoner/457516/recent?api_key=ca26a181-6fc6-409f-8ec9-ca2d31527fc8', function(error, response, body){
			if(!error && response.statusCode == 200) {
				var bodyAsJson = JSON.parse(body);
				var deathEmote;
				if(bodyAsJson.games[0].stats.numDeaths == 0) {
					deathEmote = ":100:"
				} else if (bodyAsJson.games[0].stats.numDeaths <= 3) {
					deathEmote = ":sweat_smile:"
				} else if (bodyAsJson.games[0].stats.numDeaths <= 6) {
					deathEmote = ":sweat:"
				} else if (bodyAsJson.games[0].stats.numDeaths <= 9) {
					deathEmote = ":cold_sweat:"
				} else if (bodyAsJson.games[0].stats.numDeaths <= 12) {
					deathEmote = ":joy:"
				} else if (bodyAsJson.games[0].stats.numDeaths <= 15) {
					deathEmote = ":joy: :ok_hand: wew lad"
				} else if (bodyAsJson.games[0].stats.numDeaths > 15) {
					deathEmote = "you died so many times we're still figuring out what to put here"
				}

				sendMessages(channelID, ["*** -- Stats of David Chong's latest league match -- ***\r" + 
										 "Kills: " + bodyAsJson.games[0].stats.championsKilled + " " +
										 "Deaths: " + bodyAsJson.games[0].stats.numDeaths + " " + deathEmote ]);
			} else {
				sendMessages(channelID, ['some shit fucked up fam - tell the spaghetti master']);
			}
		});

		//var xhr = new XMLHttpRequest();
		//var hello = xhr.open('GET', 'https://na.api.pvp.net/api/lol/na/v1.3/game/by-summoner/457516/recent?api_key=ca26a181-6fc6-409f-8ec9-ca2d31527fc8', false);

		/*
		$.ajax({
			type: 'GET',
			url: 'https://na.api.pvp.net/api/lol/na/v1.3/game/by-summoner/457516/recent?api_key=ca26a181-6fc6-409f-8ec9-ca2d31527fc8',
			dataType: 'json',
			success: function(data){
				console.log(data.games[0].stats);
			},
			error: function (e) {
				console.log('league api request borked')
			}
		});
		*/
	}

	else if (message === "!joke")
	{
		sendFiles(channelID, ["resources/images/neckurself.png"]);
	}
	else if (message === "neck yourself") {
		sendFiles(channelID, ["resources/images/neckurself.png"]);
	}
	else if (message === "neck urself") {
		sendFiles(channelID, ["resources/images/neckurself.png"]); //Sending a file with our helper function
	}
	//begin GAMBLING FUNCTIONALITY
	else if (message ==="!tokens"){
		fs.exists(gambleFile, function(exists) {
			if (exists) {
		  		fs.stat(gambleFile, function(error, stats) {
		    		fs.open(gambleFile, "r", function(error, fd) {
			    		var buffer = new Buffer(stats.size);			
		      			fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
		        			var gambleDataText = buffer.toString("utf8", 0, buffer.length);
		        			console.log(gambleDataText);
		        			fs.close(fd);
		        			var gambleData = JSON.parse(gambleDataText);        			

		        			_.each(gambleData, function(gambler){
		        				if(user === gambler.username){
		        					console.log(gambler.username);
		        					if(gambler.username === 'Chongman')
		        					{
		        						sendMessages(channelID, [gambler.username + " has " + gambler.tokens + " tokens.  ```A̪̜̜̭̟̻ͅ n̹̤̮̠͠d̙ 3e2m51 ͍͈̥͖͚́t̯͉͇̘͔̳o̹̝̲̣ x̙̠i͖͎͞c͔͔̦ ̦t͔ͅò͈͖̘̪ k͔̼e͍͈̫͚͕͢ ǹ̲ s.̙͉̟̜̣̺̩  ```"]);
		        					}
		        					else
		        					{
		        						sendMessages(channelID, [gambler.username + " has " + gambler.tokens + " tokens."]);
		        					}		        					
		        				}
		        			});
		      			});
		    		});
		  		});
			}
		});
	}
	//issue a challenge

	//accept/decline challenge

	//wager amount?

	//keep track of points?

	//end GAMBLING FUNCTIONALITY
});

bot.on("presence", function(user, userID, status, rawEvent) {
	//console.log(user + " is now: " + status);
});

bot.on("debug", function(rawEvent) {
	/*console.log(rawEvent)*/ //Logs every event
});

bot.on("disconnected", function() {
	console.log("Bot disconnected");
	//bot.connect(); //Auto reconnect
});

/*Function declaration area*/
function sendMessages(ID, messageArr, interval) {
	var len = messageArr.length;
	var callback;
	var resArr = [];
	typeof(arguments[2]) === 'function' ? callback = arguments[2] : callback = arguments[3];
	if (typeof(interval) !== 'number') interval = 250;
	
	function _sendMessages() {
		setTimeout(function() {
			if (messageArr.length > 0) {
				bot.sendMessage({
					to: ID,
					message: messageArr[0]
				}, function(res) {
					resArr.push(res);
				});
				messageArr.splice(0, 1);
				_sendMessages();
			}
		}, interval);
	}
	_sendMessages();
	
	var checkInt = setInterval(function() {
		if (resArr.length === len) {
			if (typeof(callback) === 'function') {
				callback(resArr);
			}
			clearInterval(checkInt);
		}
	}, 0);
}

function sendFiles(channelID, fileArr, interval) {
	var callback, resArr = [], len = fileArr.length;
	typeof(arguments[2]) === 'function' ? callback = arguments[2] : callback = arguments[3];
	if (typeof(interval) !== 'number') interval = 1000;
	
	function _sendFiles() {
		setTimeout(function() {
			if (fileArr[0]) {
				bot.uploadFile({
					to: channelID,
					file: require('fs').createReadStream(fileArr.shift())
				}, function(res) {
					resArr.push(res);
					if (resArr.length === len) if (typeof(callback) === 'function') callback(resArr);
				});
				_sendFiles();
			}
		}, interval);
	}
	_sendFiles();
}
