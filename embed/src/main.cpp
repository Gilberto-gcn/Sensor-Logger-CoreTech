#include "DHT.h"
#include <WiFi.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <WebSocketsServer.h>
#include <LiquidCrystal_I2C.h>

#define PIN_TERMISTOR 36 
float getResistencia(int pin, float voltageUc, float adcResolutionUc, float resistenciaEmSerie);
float readTemperaturaNTC(float resistenciaTermistor, float resistenciaResistorSerie, float voltageUc, float beta);
float calcularCoeficienteBetaTermistor();

/*----- Definição do pino e tipo do sensor DHT -----*/
#define DHT_PIN 15
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

/*----- Definindo endereço do LCD -----*/
LiquidCrystal_I2C lcd(0x27,16,2);

/*----- ssid/nome, password/senha da rede WiFi -----*/
const char* ssid = "giba-esp32";
const char* password = "esp32teste";

WebSocketsServer webSocket = WebSocketsServer(80); //Porta para hospedagem do servidor ws

/*----- Função do comportamento em retorno do servidor -----*/
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length)
{
  switch(type)
  {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;

    case WStype_CONNECTED:{
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connection from ", num);
      Serial.println(ip.toString());
    }
      break;

    case WStype_TEXT:
      Serial.printf("[%u] Text: %s\n", num, payload);
      webSocket.sendTXT(num, payload);
      break;
    
    case WStype_BIN:
    case WStype_ERROR:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT_FIN:
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("-----------------------------------");

  /*----- Estabelecendo conexão WiFi com os dados providos -----*/
  Serial.println("Connecting");
  delay(1000);
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  delay(1000);
  Serial.println("Connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  /*----- Depois da conexão WiFi e o comportamento do servidor determinado o servidor websocket é iniciado -----*/
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
  Serial.println("-----WebSocket Server started!-----");

  
  pinMode(PIN_TERMISTOR, INPUT);
  dht.begin(); //Inicializando o sensor DHT11

  lcd.init(); //Inicializando a tela LCD
  lcd.backlight();
}

void loop() {
  webSocket.loop();

  JsonDocument sensors_Document;
  String sensors_Json;

  /*----- coletando dados dos sensores -----*/
  float humidity = dht.readHumidity();
  float temperature_Celsius = dht.readTemperature();
  int termistorValue = analogRead(PIN_TERMISTOR);

  /*----- Convertendo tensão do termisto em temperatura -----*/
  float beta = calcularCoeficienteBetaTermistor();
  float voltageUC = 3.3;
  float adc_Resolution = 4095;
  float known_resistence = 10000.14;
  float resistencia_Termistor = getResistencia(PIN_TERMISTOR, voltageUC, adc_Resolution, known_resistence);
  float temperatura_Termistor = readTemperaturaNTC(resistencia_Termistor, known_resistence, voltageUC, beta);

  //Serial.printf("Tensão do termistor %d\ttemperatura convertida: %f\n", termistorValue, temperatura_Termistor);
  /*----- Imprimindo valores obtidos no LCD -----*/
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.printf("DHT: %.2f%c %.1f", temperature_Celsius, char(223), humidity);
  lcd.setCursor(0,1);
  lcd.printf("Termistor = %d", termistorValue);

  /*----- Verificando leitura do sensor DHT11 e serializando os dados no json -----*/
  if(isnan(humidity) || isnan(temperature_Celsius))
  {
    sensors_Document["humidity"] = 0;
    sensors_Document["temperature"] = 0;
  } else {
    sensors_Document["humidity"] = humidity;
    sensors_Document["temperature"] = temperature_Celsius;
  }
  sensors_Document["termistor"] = termistorValue;
  sensors_Document["termistor_temperature"] = temperatura_Termistor;
  sensors_Document["resistence"] = resistencia_Termistor;

  serializeJson(sensors_Document, sensors_Json);

  webSocket.broadcastTXT(sensors_Json); //Transmitidon json com os dados via websocket
  Serial.printf("%.2f;%.2f\n", temperature_Celsius, humidity);
  delay(500);

}

float getResistencia(int pin, float voltageUc, float adcResolutionUc, float resistenciaEmSerie)
{
  float resistenciaDesconhecida = 0;

  resistenciaDesconhecida = resistenciaEmSerie * (voltageUc/((analogRead(pin) * voltageUc)/adcResolutionUc)-1);
  return resistenciaDesconhecida;
}

float readTemperaturaNTC(float resistenciaTermistor, float resistenciaResistorSerie, float voltageUc, float beta)
{
  const double to = 298.15; //Temperatura em Kelvin 25C
  const double ro = 10000.0; //Resistencia do termistor a 25C

  double vout=0; //tensao lida da porta analogica
  double rt=0; //resistencia lida da porta analogica
  double t=0; //temperatura me kelvin
  double tc=0; //temperatura em celsius

  vout = resistenciaResistorSerie/(resistenciaResistorSerie+resistenciaTermistor)*voltageUc; //Calculo ta tensao lida d aporta do termistor
  rt = resistenciaResistorSerie*vout/(voltageUc-vout);
  t=1/(1/to+log(rt/ro)/beta);
  tc=t-273.15;
  
  return tc;
}

float calcularCoeficienteBetaTermistor() {
  float beta;
  const float T1 = 273.15;  // valor de temperatura 0º C convertido em Kelvin.
  const float T2 = 373.15;  // valor de temperatura 100º C convertido em Kelvin.
  const float RT1 = 27.219; // valor da resistência (em ohm) na temperatura T1.
  const float RT2 = 0.974;  // valor da resistência (em ohm) na temperatura T2.
  beta = (log(RT1 / RT2)) / ((1 / T1) - (1 / T2));  // cálculo de beta.
  return beta;
}