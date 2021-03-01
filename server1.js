
var mqtt = require('mqtt');
var Influx = require('influx');

//const influx = new Influx.InfluxDB('http://user:password@host:8086/database')
const influx = new Influx.InfluxDB('http://cye:eyc@90.152.196.243:44500/strays');
var topic = "htl/CYE/Module280/";
var username = 'CYE';
var password = "EYC";
var broker = '192.168.1.21';
var port = 1883;
var tempArr = [];
var tempAvg = 0;
var tempSum = 0;
var pressArr = [];
var pressAvg = 0;
var pressSum = 0;
var humArr = [];
var humAvg = 0;
var humSum = 0;

client = mqtt.connect('mqtt://' + broker, {
  port: port,
  username: username,
  password: password
});


client.on('message', function (topic, message) {
  message = message.toString();
  console.log(message);
  writeToInflux(topic, message)

})

client.on('connect', function () {
  console.log('client connected');
  client.qos = 1;
  //Für Anmeldung des Clients
  client.subscribe("htl/CYE/Module280/temp");
  client.subscribe("htl/CYE/Module280/baro");
  client.subscribe("htl/CYE/Module280/hum");
})





function writeToInflux(topic, message) {
  switch (topic.toString()) {
    case "htl/CYE/Module280/temp":
      if (tempArr.length < 100) {
        console.log("Array < 100")
        tempArr.push(Number(message))
        console.log("Avarage Temp: " + tempAvg + " with " + tempArr.length + " dataentries")
      } else {
        console.log("Array > 100")
        tempArr = tempArr.slice(1, 99)
        tempArr[99] = Number(message)
        console.log("Avarage Temp: " + tempAvg + " with " + tempArr.length + " dataentries")
      }
      break;
    case "htl/CYE/Module280/hum":
      checkData(humArr, humAvg)
      break;
    case "htl/CYE/Module280/baro":
      if (pressArr.length < 100) {
        console.log("Array < 100")
        pressArr.push(Number(message))
        console.log("Avarage Press: " + pressAvg + " with " + pressArr.length + " dataentries")
      } else {
        console.log("Array > 100")
        pressArr = pressArr.slice(1, 99)
        pressArr[99] = Number(message)
        console.log("Avarage Press: " + pressAvg + " with " + pressArr.length + " dataentries")
      }
      break;
  }


  tempSum = 0
  tempArr.forEach(element => {
    tempSum += element
  });
  tempAvg = tempSum / tempArr.length

  influx.writePoints([
    {
      measurement: 'strayData',
      tags: {
        module: "Module280"
      },

      fields: {
        temperature: Number(tempArr[tempArr.length - 1]),
        pressure: Number(pres),
        humiditiy: Number(hum),


      },
    }
  ], {
    database: 'strays',
    precision: 'ns',
  })
    .catch(error => {
      console.error(`Error saving data to InfluxDB! ${error.stack}`)
    });
}
function checkData(arr, arrAvg) {
  if (arr.length < 100) {
    console.log("Array < 100")
    arr.push(Number(message))
    console.log("Avarage Value: " + arrAvg + " with " + arr.length + " dataentries")
  } else {
    console.log("Array > 100")
    arr = arr.slice(1, 99)
    arr[99] = Number(message)
    console.log("Avarage Value: " + arrAvg + " with " + arr.length + " dataentries")
  }
}
function calcAvg(arr) {
  var sum = 0
  arr.forEach(element => {
    sum += element
  });

  return sum / arr.length;
}