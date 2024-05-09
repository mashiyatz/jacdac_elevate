import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Color4, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, Rectangle, TextBlock } from "@babylonjs/gui";
// import { JacdacTools } from "./modules/jacdac-tools";
import { CanvasSetup } from "./modules/canvas-setup";
import { createUSBBus, DEVICE_ANNOUNCE, JDBus, JDRegister, JDService, REPORT_UPDATE, RotaryEncoderReg, SRV_POTENTIOMETER, SRV_ROTARY_ENCODER } from "jacdac-ts";
import { EVENT, JDEvent, SRV_BUTTON, DEVICE_DISCONNECT, ButtonEvent } from "jacdac-ts";

class App {

    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;

    private _bus: JDBus;
    private _rotary: JDService;
    private _slider: JDService;
    private _pushButton: JDService;

    private _isHeatOn: boolean;
    private _temperature: number = 0;
    private _direction: number;

    private _textbox: TextBlock;
    private _tempText: TextBlock;


    private createNewTextbox(msg: string, distFromTop: number): TextBlock {
        const t = new TextBlock("textbox");
        t.text = msg;
        t.fontFamily = "Viga";
        t.width = 1;
        t.height = "200px";
        t.color = "white";
        t.top = `${distFromTop}px`;
        t.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        return t;
    }

    private async setupGUI() {
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 0.8;
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const button = Button.CreateSimpleButton("navButton", "BUTTON");
        button.fontFamily = "Viga";
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.top = "-14px";
        button.thickness = 0;
        button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(button);

        let buttonCount = 0;
        this._textbox = this.createNewTextbox("This is a new textbox.", 24);
        this._tempText = this.createNewTextbox(`${this._temperature}`, 48);
        imageRect.addControl(this._textbox);
        imageRect.addControl(this._tempText);

        button.onPointerClickObservable.add(() => {
            buttonCount +=1 ;
            let msg: string = `You have clicked the button ${buttonCount} times!`;
            this._textbox.text = msg;
        });

    }

    private async _start() {
        this._engine.displayLoadingUI();

        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0.4, 0.4, 0.4, 1);

        this.setupGUI();

        var camera: ArcRotateCamera = new ArcRotateCamera(
            "Camera", 
            Math.PI / 2, 
            Math.PI / 2, 
            2, 
            Vector3.Zero(), 
            scene
        );

        var light1: HemisphericLight = new HemisphericLight(
            "light1",
            new Vector3(1, 1, 0),
            scene
        );

        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", {diameter: 1}, scene);

        await scene.whenReadyAsync();
        
        this._scene.dispose();
        this._scene = scene;
        this._engine.hideLoadingUI();
        this._scene.attachControl();
    }

    private async connectJacdac(): Promise<void> {
        const bus = createUSBBus();
        this._bus = bus;
        let lastRotaryValue: number = 0;
    
        if (!this._bus.connected) await this._bus.connect();
    
        this._bus.on(DEVICE_ANNOUNCE, device => {
            console.log(device.describe() + " has connected!");

            // check devices
            this._pushButton = this._bus.services({serviceClass: SRV_BUTTON})[0];
            this._slider = this._bus.services({serviceClass: SRV_POTENTIOMETER})[0];
            this._rotary = this._bus.services({serviceClass: SRV_ROTARY_ENCODER})[0];
            console.log(this._pushButton.specification);
            // console.log(this._rotary.specification);

            // add event
            this._pushButton.event(ButtonEvent.Down).on(EVENT, (event: JDEvent) => {
                this._isHeatOn = !this._isHeatOn;
                if (this._isHeatOn) {
                    if (this._slider == null || this._rotary == null) {
                        this._textbox.text = "The heat is on...but how do I control the temperature.";
                    } else {
                        this._textbox.text = "Hmm, can I change the temperature?";
                    }
                } else {
                    this._textbox.text = "Brrrr it's so cold!";
                    this._temperature = 0;
                    this._tempText.text = `${this._temperature}`;
                }
            });

            this._rotary.register(RotaryEncoderReg.Position).on(REPORT_UPDATE, (reg: JDRegister) => {
                if (!this._isHeatOn) {lastRotaryValue = 0;}
                else {
                    let t = reg.intValue;
                    if (t > lastRotaryValue || t == 0) this._temperature++;
                    else if (t < lastRotaryValue) this._temperature--;
                    lastRotaryValue = t;

                    this._tempText.text = `${this._temperature}`;
                    if (this._temperature > 28) {
                        this._textbox.text = "Isn't it kind of hot?";
                    } else if (this._temperature < 14) {
                        this._textbox.text = "I'm not sure this is working...";
                    } else {
                        this._textbox.text = "Ahh...this feels just right :)";
                    }
                }
            })
        });
    
        this._bus.on(DEVICE_DISCONNECT, device => {
            console.log(device.describe() + " has disconnected...");
        });
    }

    constructor() {
        // Awake;
        const _sceneSetup = new CanvasSetup();
        this._canvas = _sceneSetup.canvas;
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);
        this.connectJacdac();
        this._main();
    }

    private async _main(): Promise<void> {
        // Start
        await this._start();

        // Update
        this._engine.runRenderLoop(() => {this._scene.render(); });

        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
    }
new App();