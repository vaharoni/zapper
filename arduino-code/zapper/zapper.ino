char incomingBytes[3];   // for incoming serial data
int led = A0;
int buttonPin = A2; 
int buttonState = 0;

int strength = 150;
int duration = 1000;
int pulse_length = 20;

void setup() {
  Serial.begin(9600);     // opens serial port, sets data rate to 9600 bps
  pinMode(led, OUTPUT);
  analogWrite(led, 0);
  pinMode(buttonPin, INPUT);
}

void loop() {
  // send data only when you receive data:
  buttonState = digitalRead(buttonPin);
  if (Serial.available() > 0 || buttonState == HIGH) {    
    if (Serial.available() > 0) {
      // read the incoming byte:
      Serial.readBytes(incomingBytes, 4);
      int strength = (byte)incomingBytes[0] + (byte)incomingBytes[1] * 256;
      int duration = (byte)incomingBytes[2] + (byte)incomingBytes[3] * 256;
  
      Serial.println(strength);
      Serial.println(duration);
    }        
    for (int i = 0; i < round(duration / pulse_length); i++) {
      analogWrite(led, strength);
      delay(pulse_length / 2);
      analogWrite(led, strength / 2);
      delay(pulse_length / 2);
    }

  }  
}




