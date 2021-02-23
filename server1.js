
var mqtt = require('mqtt');
var Influx = require('influx');

//const influx = new Influx.InfluxDB('http://user:password@host:8086/database')
const influx = new Influx.InfluxDB('http://CYE:#P@voM@rcel@90.152.196.243:44500/strays');
var topic = "htl/CYE/Module280/";
var username = 'CYE';
var password = "EYC";
var broker = 'localhost';
var port = 1883;
var temp = new Array(100);
var pres = 0;
var hum = 0;

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
      if (temp.length <= 100) {
        temp.push(Number(message));
      } else {
        temp = Array.slice(1, 100)
        temp[100] = Number(message)
      }
      break;
    case "htl/CYE/Module280/hum":
      hum = Number(message)
      break;
    case "htl/CYE/Module280/baro":
      pres = Number(message)
      break;

  }
  influx.writePoints([
    {
      measurement: 'strayData',
      tags: {
        module: "Module280"
      },

      fields: {
        temperature: Number(temp),
        pressure: Number(pres),
        humiditiy: Number(hum)

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
