/*
 * iTrip – salida serie compatible con el plugin de Windy (windy-plugin-itrip)
 *
 * Reenvía las frases NMEA del GPS por USB y añade, 5 veces por segundo:
 *   $HCHDG,<rumbo>,,,,*hh          rumbo del BNO055 (0-360, norte = 0)
 *   $IIXDR,A,<pitch>,D,PTCH,A,<roll>,D,ROLL*hh
 *
 * El plugin también acepta líneas CSV "lat,lon,rumbo,sog,pitch,roll" o JSON
 * {"lat":..,"lon":..,"heading":..}, por si prefieres otro formato.
 *
 * Hardware de referencia: Arduino + BNO055 (I2C) + GPS en Serial1 (9600 baud).
 * Librerías: Adafruit BNO055, Adafruit Unified Sensor.
 */
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BNO055.h>

Adafruit_BNO055 bno = Adafruit_BNO055(55, 0x28);

#define GPS_SERIAL Serial1
const unsigned long IMU_PERIOD_MS = 200;
unsigned long lastImu = 0;

void sendNmea(const String &body) {
  byte cs = 0;
  for (unsigned int i = 0; i < body.length(); i++) cs ^= body[i];
  Serial.print('$');
  Serial.print(body);
  Serial.print('*');
  if (cs < 0x10) Serial.print('0');
  Serial.println(cs, HEX);
}

void setup() {
  Serial.begin(9600);       // USB -> navegador (Web Serial)
  GPS_SERIAL.begin(9600);   // GPS
  if (!bno.begin()) {
    Serial.println("# BNO055 no detectado");
  }
  bno.setExtCrystalUse(true);
}

void loop() {
  // 1) Reenviar el GPS tal cual (RMC/GGA)
  while (GPS_SERIAL.available()) {
    Serial.write(GPS_SERIAL.read());
  }

  // 2) Orientación del BNO055
  if (millis() - lastImu >= IMU_PERIOD_MS) {
    lastImu = millis();
    sensors_event_t e;
    bno.getEvent(&e);
    // Ajusta ejes/signos según cómo esté montada la caja en el barco
    float heading = e.orientation.x;  // 0..360
    float roll = e.orientation.y;
    float pitch = e.orientation.z;

    sendNmea("HCHDG," + String(heading, 1) + ",,,,");
    sendNmea("IIXDR,A," + String(pitch, 1) + ",D,PTCH,A," + String(roll, 1) + ",D,ROLL");
  }
}
