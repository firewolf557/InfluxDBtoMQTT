This script is used to get Data from a MQTT-Broker then filter it and then send it to a InfluxDB;
The MQTT-Broker, the deivce running this script and the influxDB should be in the same network or public accesible;
If you are using this script for your purposes you should modify it to your needs;
We hope it helps you!

To run the script on Linux-based OS:
node influxdb_connector.js

To run the script on Linux-based OS permanently:
node influxdb_connector.js &

To run the script on Linux-based OS permanently and store log in a file:
nohup node influxdb_connector.js &
