//sh.njdata.js
var request = require('request');
var csv = require('csv');
var fs = require('fs');

// cloudmine env variables
var CM_APP = 'b74254d53d5b44f094cea522c204ffca';
var CM_KEY = process.env.CLOUDMINE;

// base32 according to http://www.crockford.com/wrmg/base32.html
var alphabet = '0123456789abcdefghjkmnpqrstvwxyz';

function randomChar() {
  var randomNum = Math.floor(Math.random() * 32);
  return alphabet.charAt(randomNum);
}

function generateId() {
  var id = '';
  for (var i=0; i<4; i++) {
    id += randomChar();
  }
  return id;
}

function newId() {
  var id = generateId();
  if (idBucket[id]) {
    // don't overwrite existing IDs
    newId();
  } else {
    idBucket[id] = '';
    return id;
  }
}

function pushToCloudMine(data) {
  request.put({
    uri: 'https://api.cloudmine.me/v1/app/' + CM_APP + '/text',
    headers: {'X-CloudMine-ApiKey': CM_KEY},
    json: data
  }, function (err, cmres, body) {
    if (!err && cmres.statusCode === 200) {
      console.log('posted!');
    } else {
      console.log(body);
    }
  });
}

var idBucket = {};

csv()
.fromPath(__dirname+'/../data/nj.csv', {columns:true})
.on('data', function(data, index){
  var output = {};
  var id = newId();
  output[id] = {};

  //get the phone number
  if (data.Contact) {
    if (data.Contact.search(':: ') === -1) {
      output[id].phone = data.Contact;
    } else {
      var contact = data.Contact.split(':: ');
      output[id].phone = contact[1];
    }
  }

  output[id].name = data.Program;
  output[id].county = data.County;
  output[id].state = 'NJ';
  output[id].type = 'location';
  output[id].isSheltr = 'Y';
  output[id].totalBeds = data['Units/Beds'];
  output[id].occupiedBeds = data.Occupied;
  output[id].openBeds = data.Open;
  output[id].otherLimits = data.Population;
  output[id].notes = data.Agency;
  output[id].location = {
      "__type__": "geopoint",
      "longitude": 0,
      "latitude": 0
  };

  pushToCloudMine(output);
})
.on('end',function(){
})
.on('error',function(error){
    console.log(error.message);
});