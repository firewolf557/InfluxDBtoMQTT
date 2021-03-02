/*** 
 * Author0 (main script):Ronald Taferner
 * Author1 (extender and editor of this script): endurojunky
 * 
 * */
let mqtt = require('mqtt');
let Influx = require('influx');

//const influx = new Influx.InfluxDB('http://user:password@host:8086/database')
const influx = new Influx.InfluxDB('http://INFLUX_USERNAME:INFLUX_PASSWORD@INFLUX_URL:INFLUX_PORT/INFLUX_DATABASE');

let username = 'MQTT_USERNAME', password = "MQTT_PASSWORD", broker = 'MQTTBroker_URL', port = 1883, tempArr = [], tempAvg = 0, pressArr = [], pressAvg = 0, humArr = [], humAvg = 0, send = false, countData = 0, countHour = 0;
/**
 * Define client as the MQTT-Broker u want to Connect to
 */
client = mqtt.connect('mqtt://' + broker, {
  port: port,
  username: username,
  password: password
});

/**
 * If a message of the subscribed topics is coming in safe it, print it and execute writeToInflux
 */
client.on('message', function (topic, message) {
  message = message.toString();
  console.log(message);
  writeToInflux(topic, message);

})
/**
 * When connected to the MQTT- Broker, log a message and subscribe to needed Topics
 */
client.on('connect', function () {
  console.log('client connected');
  client.qos = 1;
  //Für Anmeldung des Clients
  client.subscribe("TOPIC/TOPIC1");
  client.subscribe("TOPIC/TOPIC2");
  client.subscribe("TOPIC/TOPIC3");
})
/**
 * 
 * @param {topic from where u recieved data from MQTT-Broker} topic 
 * @param {message u recived from topic} message
 * in this function the code for the specific topic is executed
 * u define the fields which u want to write to your influxDB in "influx.writePoints under fields" 
 */
function writeToInflux(topic, message) {
  switch (topic.toString()) {
    case "TOPIC/TOPIC1":
      saveData(tempArr, tempAvg, message);
      tempAvg = calcAvg(tempArr);
      break;
    case "TOPIC/TOPIC2":
      saveData(humArr, humAvg, message);
      humAvg = calcAvg(humArr);
      break;
    case "TOPIC/TOPIC3":
      saveData(pressArr, pressAvg, message);
      pressAvg = calcAvg(pressArr);
      break;
  }
  //Every hour the average values of temperature, humidity and pressure are sent to InfluxDB
  countHour += 1;
  //Every Hour 2400 Data Entries are made so the values are sent every 2400 entries (data received every 2s)
  //if you are receiving data in other time intervals you calculate your entries for one hour with e(1h)=(3600/time-interval)*number of topics (it would be 800 with only one topic)
  if (countHour == 2700) {
    writeAverage(tempAvg, pressAvg, humAvg, tempArr, pressArr, humArr)
    countHour = 0;
  }

  if ((tempAvg - 5 > tempArr[tempArr.length - 1] || tempAvg + 5 < tempArr[tempArr.length - 1]) || (humAvg - 15 > humArr[humArr.length - 1] || humAvg + 15 < humArr[humArr.length - 1]) || (pressAvg - 10 > pressArr[pressArr.length - 1] || pressAvg + 10 < pressArr[pressArr.length - 1])) {
    send = false
    if (!send) {
      writeAverage(tempAvg, pressAvg, humAvg, tempArr, pressArr, humArr)
    }
    send = true;
  }

  if (send) {
    countData += 1
    if (countData == 2700) {
      send = false
      countData = 0
    }
    console.log("Temperature: " + tempArr[tempArr.length - 1] + "; Humidity: " + humArr[humArr.length - 1] + "; Pressure: " + pressArr[pressArr.length - 1])
    writeCurrentValue(tempArr, pressArr, humArr)
  }
}


/**
 * 
 * @param {array where your data u want to save is stored} arr 
 * @param {calculated average of arr} arrAvg 
 * @param {message from MQTT-Broker u want to save in arr} message 
 * this function stores data recived from the MQTT- Broker in a "floating Array" 
 */
function saveData(arr, arrAvg, message) {
  if (arr.length < 900) {
    console.log("Array < 900");
    arr.push(Number(message));
    console.log("Avarage Value: " + arrAvg + " with " + arr.length + " dataentries");
  } else {
    console.log("Array = 900");
    arr = arr.slice(1, 899);
    arr[899] = Number(message);
    console.log("Avarage Value: " + arrAvg + " with " + arr.length + " dataentries");
  }
}
/**
 * 
 * @param {Array from which u want to calculate average from} arr 
 * this function calculates the average of a given array and returns it
 */
function calcAvg(arr) {
  var sum = 0;
  arr.forEach(element => {
    sum += element;
  });
  return sum / arr.length;
}

function writeAverage(tempAvg, pressAvg, humAvg, tempArr, pressArr, humArr) {
  influx.writePoints([
    {
      measurement: 'measurement',
      tags: {
        module: "Module_NAME"
      },

      fields: {
        averageTemperature: Number(tempAvg),
        averagePressure: Number(pressAvg),
        averageHumiditiy: Number(humAvg),
        temperature: Number(tempArr[tempArr.length - 1]),
        pressure: Number(pressArr[pressArr.length - 1]),
        humiditiy: Number(humArr[humArr.length - 1]),
      },
    }
  ], {
    database: 'DATABASE',
    precision: 'ns',
  })
    .catch(error => {
      console.error(`Error saving data to InfluxDB! ${error.stack}`)
    });
}

function writeCurrentValue(tempArr, pressArr, humArr) {
  influx.writePoints([
    {
      measurement: 'measurement',
      tags: {
        module: "Module_NAME"
      },

      fields: {
        temperature: Number(tempArr[tempArr.length - 1]),
        pressure: Number(pressArr[pressArr.length - 1]),
        humiditiy: Number(humArr[humArr.length - 1]),
      },
    }
  ], {
    database: 'DATABASE',
    precision: 'ns',
  })
    .catch(error => {
      console.error(`Error saving data to InfluxDB! ${error.stack}`)
    });
}