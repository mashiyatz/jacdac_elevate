import { createUSBBus, DEVICE_ANNOUNCE, JDBus, JDDevice, JDRegister, JDService, REPORT_UPDATE, RotaryEncoderReg, SRV_POTENTIOMETER, SRV_ROTARY_ENCODER } from "jacdac-ts";
import { EVENT, JDEvent, SRV_BUTTON, DEVICE_DISCONNECT, ButtonEvent } from "jacdac-ts";
import { CanvasSetup } from "./modules/canvas-setup";
import { IndexFormat } from "@babylonjs/core";

class App {
    private _bus: JDBus;
    private _rotary: JDService;
    private _slider: JDService;
    private _pushButton: JDService;

    private _isHeatOn: boolean;
    private _temperature: number = 0;

    private text: HTMLParagraphElement;
    private tempText: HTMLParagraphElement;

    private index: number;
    // private indexToID: Map<number, number>;
    private idToIndex: Map<string, number>;
    private idToComponent: Map<string, string>;

    constructor() {
        // const _sceneSetup = new CanvasSetup();
        // const ctx: CanvasRenderingContext2D = _sceneSetup.canvas.getContext('2d');   
        this.idToComponent = new Map();
        this.idToIndex = new Map();
        this.index = 0;
        
        this.addTextbox();
        this.connectJacdac();
    }

    private printOrderOfComponents() {
        let indexToComponent: Map<number, string> = new Map();
        this.idToIndex.forEach((index: number, id: string) => {
            indexToComponent.set(index, this.idToComponent.get(id));
        });

        // indexToComponent.forEach((id: string, index: number) => {
        //     console.log(`${index} is ${id}`);
        // });

        var orderedMap = new Map([...indexToComponent.entries()].sort());
        orderedMap.forEach((value: string, key: number) => {
            console.log(`${key} is ${value}`);
        });
    }

    // add 
    private addTextbox() {
        this.text = document.createElement('p');
        this.tempText = document.createElement('p');
        this.text.textContent = "testing, testing..."
        this.tempText.textContent = "0";
        document.body.appendChild(this.text);
        document.body.appendChild(this.tempText);
    }

    private async connectJacdac(): Promise<void> {
        const bus = createUSBBus();
        this._bus = bus;
        let lastRotaryValue: number = 0;
    
        if (!this._bus.connected) await this._bus.connect();
    
        this._bus.on(DEVICE_ANNOUNCE, (device: JDDevice) => {
            console.log(device.describe() + " has connected!");
            // console.log(device.id);
            // console.log(device.serviceClasses[1]);
            // console.log(SRV_BUTTON);
            // console.log(device.describe());
            switch (device.serviceClasses[1]) {
                case SRV_BUTTON: {
                    this.index += 1;
                    this.idToIndex.set(device.id, this.index);
                    this.idToComponent.set(device.id, "button");

                    this._pushButton = device.service(1);
                    this._pushButton.event(ButtonEvent.Down).on(EVENT, (event: JDEvent) => {
                        this._isHeatOn = !this._isHeatOn;
                        if (this._isHeatOn) {
                            if (this._slider == null || this._rotary == null) {
                                this.text.textContent = "The heat is on...but how do I control the temperature.";
                            } else {
                                this.text.textContent = "Hmm, can I change the temperature?";
                            }
                        } else {
                            this.text.textContent = "Brrrr it's so cold!";
                            this._temperature = 0;
                            this.tempText.textContent = `${this._temperature}`;
                        }
                    });
                    this.printOrderOfComponents();
                    break;
                }
                case SRV_POTENTIOMETER: {
                    this.index += 1;
                    this.idToIndex.set(device.id, this.index);
                    this.idToComponent.set(device.id, "potentiometer");
                    
                    this._slider = device.service(0);
                    this.printOrderOfComponents();
                    break;
                }
                case SRV_ROTARY_ENCODER: {
                    this.index += 1;
                    // this.indexToID[this.index] = device.ID;
                    this.idToIndex.set(device.id, this.index);
                    this.idToComponent.set(device.id, "rotary encoder");

                    this._rotary = device.service(0);
                    this._rotary.register(RotaryEncoderReg.Position).on(REPORT_UPDATE, (reg: JDRegister) => {
                        if (!this._isHeatOn) {lastRotaryValue = 0;}
                        else {
                            let t = reg.intValue;
                            if (t > lastRotaryValue || t == 0) this._temperature++;
                            else if (t < lastRotaryValue) this._temperature--;
                            lastRotaryValue = t;
        
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

            // console.log(this._bus.describe());
        });
    
        this._bus.on(DEVICE_DISCONNECT, device => {
            console.log(device.describe() + " has disconnected...");
            this.idToIndex.delete(device.ID);
        });
    }
}

new App();
