import { createUSBBus, DEVICE_ANNOUNCE, JDBus, JDDevice, JDService, SRV_POTENTIOMETER, SRV_ROTARY_ENCODER } from "jacdac-ts";
import { EVENT, JDEvent, SRV_BUTTON, DEVICE_DISCONNECT, ButtonEvent } from "jacdac-ts";

export class JacdacTools {

    constructor() {
        
    }

    public async connectJacdac(): Promise<void> {
        const bus = createUSBBus();
        let pushButton: JDService;
        let slider: JDService;
        let rotary: JDService;
    
        // this.connectJacdac(bus);
    
        bus.on(DEVICE_ANNOUNCE, device => {
            console.log(device.describe() + " has connected!");
            pushButton = bus.services({serviceClass: SRV_BUTTON})[0];
            // slider = bus.services({serviceClass: SRV_POTENTIOMETER})[0];
            // rotary = bus.services({serviceClass: SRV_ROTARY_ENCODER})[0];

            // console.log(bus.services({serviceClass: SRV_BUTTON}));
            // console.log(pushButton.specification);
            pushButton.event(ButtonEvent.Down).on(EVENT, (event: JDEvent) => {console.log("hi this is a button");});
            // assign ID to a sensor? 
        });
    
        bus.on(DEVICE_DISCONNECT, device => {
            console.log(device.describe() + " has disconnected...");
        });
    }
}
