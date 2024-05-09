// imports from jacdac-ts
import { EVENT, JDEvent, SRV_BUTTON, DEVICE_DISCONNECT, ButtonEvent, createUSBBus, DEVICE_ANNOUNCE, JDBus, JDDevice, JDRegister, JDService, REPORT_UPDATE, RotaryEncoderReg, SRV_POTENTIOMETER, SRV_ROTARY_ENCODER } from "jacdac-ts";
// separate file for setting up a simple canvas
import { CanvasSetup } from "./modules/canvas-setup";

class App {
    //// Run an instance of the App class to set up the sample game. 
    //// note about .ts -- have to explicitly define the type of each variable.

    // Access to Jacdac elements
    private _bus: JDBus; 
    private _rotary: JDService; 
    private _slider: JDService;
    private _pushButton: JDService;

    // Variables for "air conditioner" simulation
    private _isHeatOn: boolean;
    private _temperature: number = 0;
    private text: HTMLParagraphElement;
    private tempText: HTMLParagraphElement;

    // Variables to tracking Jacdac components
    private index: number; // order of circuit component
    private idToIndex: Map<string, number>; // dictionary from component id to order in circuit
    private idToComponent: Map<string, string>; // dictionary from component id to component type (as string)

    // Runs on instantiation of class
    constructor() { 
        this.idToComponent = new Map();
        this.idToIndex = new Map();
        this.index = 0;
        this.addTextbox();
        this.connectJacdac();
    }

    // Based on stored information about each component, print their order 
    private printOrderOfComponents() {
        let indexToComponent: Map<number, string> = new Map(); // create a new dictionary for mapping directly index to component type
        this.idToIndex.forEach((index: number, id: string) => {
            indexToComponent.set(index, this.idToComponent.get(id)); 
        }); // set the index to its corresponding component type

        // indexToComponent.forEach((id: string, index: number) => {
        //     console.log(`${index} is ${id}`);
        // });

        var orderedMap = new Map([...indexToComponent.entries()].sort()); // reorder the newly-made map by index, and print in that order
        orderedMap.forEach((value: string, key: number) => {
            console.log(`${key} is ${value}`);
        });
    }

    // add a textbox for user interaction or debugging
    private addTextbox() {
        this.text = document.createElement('p');
        this.tempText = document.createElement('p');
        this.text.textContent = "testing, testing..."
        this.tempText.textContent = "0";
        document.body.appendChild(this.text);
        document.body.appendChild(this.tempText);
    }


    // Establish connection to the jacdac, and track components added/removed
    private async connectJacdac(): Promise<void> { 
        const bus = createUSBBus(); // create access to the Jacdac bus
        this._bus = bus; // assign new instance of bus access to class variable
        let lastRotaryValue: number = 0; // initialize variable for tracking rotary encoder value

        if (!this._bus.connected) await this._bus.connect(); // pause here until the bus connects
    
        // Create a listener for actions to take when a new Jacdac component is connected
        this._bus.on(DEVICE_ANNOUNCE, (device: JDDevice) => { // create a dummy variable for whatever device is connected
            console.log(device.describe() + " has connected!");

            //// Debug code for checking information about device --
            // console.log(device.id);
            // console.log(device.serviceClasses[1]);
            // console.log(SRV_BUTTON);
            // console.log(device.describe());

            // Identify the type of device connected
            switch (device.serviceClasses[1]) { 
                // TO DO: figure out how to track components with multiple functions (e.g., rotary encoder
                // is both a button and encoder. Taking serviceClasses[1] and not [0] because [0] appears
                // to not be associated with the actual functionality of the component? 

                case SRV_BUTTON: {
                    this.index += 1; // add to tracked number of devices
                    this.idToIndex.set(device.id, this.index); // set device id to current index
                    this.idToComponent.set(device.id, "button"); // set device id to current component type 
                    // TO DO: Where can we get component function-defining information from the device infodump?

                    this._pushButton = device.service(1); 
                    // For rotary encoder, service(1) appears to correspond to its button, and (0) to the actual encoder.
                    // Have to test further to see how to properly isolate the two.  
                    
                    // Add listener to button press turning "heat" on or off
                    this._pushButton.event(ButtonEvent.Down).on(EVENT, (event: JDEvent) => {
                        this._isHeatOn = !this._isHeatOn; // if heat is on, turn it off, and vice-versa
                        if (this._isHeatOn) {
                            if (this._slider == null || this._rotary == null) {
                                // prompt if a rotary is not connected yet
                                this.text.textContent = "The heat is on...but how do I control the temperature.";
                            } else {
                                this.text.textContent = "Hmm, can I change the temperature?";
                            }
                        } else {
                            this.text.textContent = "Brrrr it's so cold!";
                            this._temperature = 0; // if the heat is turned off, reset the temperature
                            this.tempText.textContent = `${this._temperature}`; 
                        }
                    });
                    this.printOrderOfComponents(); // for debugging, print the new order of components
                    break;
                }
                case SRV_POTENTIOMETER: {
                    // TO DO: Need to test further --
                    // this doesn't seem to work with the slide potentiometer included with the Jacdac kit. 
                    this.index += 1;
                    this.idToIndex.set(device.id, this.index);
                    this.idToComponent.set(device.id, "potentiometer");
                    
                    this._slider = device.service(0);
                    this.printOrderOfComponents();
                    break;
                }
                case SRV_ROTARY_ENCODER: {
                    this.index += 1;
                    this.idToIndex.set(device.id, this.index);
                    this.idToComponent.set(device.id, "rotary encoder");
                    // Same setup as for button. 

                    this._rotary = device.service(0); // Service 0 corresponds to the rotary encoder's rotary encoder. 
                    this._rotary.register(RotaryEncoderReg.Position).on(REPORT_UPDATE, (reg: JDRegister) => {
                        if (!this._isHeatOn) {lastRotaryValue = 0;} // reset the rotary encoder when "heat" is turned off
                        else {
                            let t = reg.intValue; // get the current value of the rotary encoder through its register
                            // if the current value is greater than the last encoder value, increase the temperature,
                            // or else decrease it, and reset the last encoder value
                            
                            // TO DO: After rotating the encoder 360 degree, its value resets to 0 -- have to account for 
                            // both cases of going from its max value to 0, or from 1 to 0. 
                            if (t > lastRotaryValue || t == 0) this._temperature++; 
                            
                            else if (t < lastRotaryValue) this._temperature--;
                            lastRotaryValue = t;
        
                            // change the text according to the saved temperature value
                            this.tempText.textContent = `${this._temperature}`;
                            if (this._temperature > 28) {
                                this.text.textContent = "Isn't it kind of hot?";
                            } else if (this._temperature < 14) {
                                this.text.textContent = "I'm not sure this is working...";
                            } else {
                                this.text.textContent = "Ahh...this feels just right :)";
                            }
                        }
                    })
                    this.printOrderOfComponents();
                    break;
                }
                default: {
                    break;
                }
            }
        });
    
        this._bus.on(DEVICE_DISCONNECT, device => {
            // print a message upon disconnecting the device, and delete it from the dictionary of connected devices
            console.log(device.describe() + " has disconnected...");
            this.idToIndex.delete(device.ID);
        });
    }
}

new App(); // start the instance of the app
