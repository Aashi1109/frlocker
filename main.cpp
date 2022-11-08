#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>

const char* SSID = "Hi-Fi";
const char* PASSWORD = "Shift9187";

const char* HOST = "192.168.1.100";
const String LINK = "/api/lock_state";
const int HTTP_PORT = 8081;
const String LOCKER_ID = "LCR1899AP";
int header_print_count = 1;
int output_pin = 13;
int data_after_seconds = 0;
int lock_open_time = 5;

void connect_wifi() {
  WiFi.mode(WIFI_OFF);        //Prevents reconnection issue (taking too long to connect)
  delay(1000);
  WiFi.mode(WIFI_STA);        //Only Station No AP, This line hides the viewing of ESP as wifi hotspot

  WiFi.begin(SSID, PASSWORD);     //Connect to your WiFi router
  Serial.println("============== WIFI Connection ===============");

  Serial.print("-> Connecting to ");
  Serial.println(SSID);
  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  //If connection successful show IP address in serial monitor
  Serial.println("");
  Serial.print("-> Connected to ");
  Serial.println(SSID);
  Serial.print("-> IP address: ");
  Serial.println(WiFi.localIP());  //IP address assigned to your ESP
}


String get_data(String host, String link, int port) {
  Serial.println("============== HTTPS CONNECTION ==============");
  Serial.print("-> Host address: ");
  Serial.print("->");
  Serial.println(host);
  Serial.println("-> HTTPS Connecting");

  String error{ "{\"error\" : \"Connection Error\"}" };

  // 1 method --error
  // Use WiFiClient class to create TCP connections
  WiFiClient client;
  if (!client.connect(host, port)) {
    Serial.println("-> connection failed");
    return error;
  }

  Serial.print("-> requesting URL: ");
  Serial.println(host + link);

  Serial.println("-> Requesting GET: ");
  // client.print(String("GET ") + link + " HTTP/1.1\r\n" +
  //   "Host: " + host + "\r\n" +
  //   "Connection: close\r\n\r\n");

  client.print(String("GET ") + link + " HTTP/1.1\r\n" +
    "Connection: close\r\n\r\n");
  unsigned long timeout = millis();
  while (client.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println(">>> Client Timeout !");
      client.stop();
      return error;
    }
  }

  String response{ "" };
  while (client.available()) {
    response = client.readStringUntil('\r');
  }

  Serial.print("-> Reply received is : ");
  Serial.println(response); //Print response

  // Serial.println();
  Serial.println("-> closing httpsconnection");
  return response;
}


int check_lock(DynamicJsonDocument data) {
  String state = data["lock_state"];
  if (state.equals("open"))
  {
    Serial.println("-> Locker state change");

    String received_locker_id = data["lock_id"];
    // Serial.println(received_locker_id);
    if (received_locker_id.equals(LOCKER_ID)) {
      Serial.println("-> Locker ID matched");
      return 1;
    }
    else {
      Serial.println("-> Received ID don't match");
    }
  }
  return 0;
}


void blink_led(int pin, int delay_s) {
  digitalWrite(pin, LOW);
  delay(delay_s * 1000);
  digitalWrite(pin, HIGH);
  // delay(delay_s * 1000);
}


void setup() {
  // delay(1000);
  Serial.begin(9600);
  pinMode(output_pin, OUTPUT);
  digitalWrite(output_pin, HIGH);
  connect_wifi();
}
void loop() {
  const String json_data = get_data(HOST, LINK, HTTP_PORT);
  // Serial.print("Data obtined is ");
  // Serial.println(json_data);

  // 2nd method
  StaticJsonDocument<96> doc;

  DeserializationError error = deserializeJson(doc, json_data);

  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }

  // const char* lock_state = doc["lock_state"]; // "open"
  // const char* lock_id = doc["lock_id"]; // "LCR1899AP"
  // Serial.println(lock_id);
  // Serial.println(lock_state);


  if (check_lock(doc))
  {
    Serial.print("Lock is open for : ");
    Serial.print(lock_open_time);
    Serial.println("s");
    blink_led(output_pin, lock_open_time);
    // digitalWrite(13, LOW);
    // delay(5 * 1000);
    // digitalWrite(13, HIGH);
    // delay(5 * 1000);
  }
  else {
    Serial.println("-> Lock is close.");
  }
  delay(data_after_seconds * 1000);
}