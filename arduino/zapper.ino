char incomingBytes[3];   // for incoming serial data
int led = 9;

void setup() {
  Serial.begin(9600);     // opens serial port, sets data rate to 9600 bps
  pinMode(led, OUTPUT);
  analogWrite(led, 0);
}

void loop() {
  // send data only when you receive data:
  if (Serial.available() > 0) {
    // read the incoming byte:
    Serial.readBytes(incomingBytes, 4);
    int strength = (byte)incomingBytes[0] + (byte)incomingBytes[1] * 256;
    int duration = (byte)incomingBytes[2] + (byte)incomingBytes[3] * 256;

    Serial.println(strength);
    Serial.println(duration);

    int pulse_length = 20;
    int delay_length = (1000 - strength * pulse_length) / strength;
        
    for (int i = 0; i < round(strength * 1.0 * duration / 1000); i++) {
      analogWrite(led, 255);
      delay(pulse_length);
      analogWrite(led, 0);
      delay(delay_length);
    }

//    analogWrite(led, strength);
//    delay(duration);
//    analogWrite(led, 0);
  }
}




