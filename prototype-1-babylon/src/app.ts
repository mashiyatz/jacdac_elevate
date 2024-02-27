import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Color4, FreeCamera } from "@babylonjs/core";
import { createUSBBus, DEVICE_ANNOUNCE, JDBus } from "jacdac-ts";
import { EVENT, JDEvent, SRV_BUTTON, DEVICE_DISCONNECT, ButtonEvent } from "jacdac-ts";
import { AdvancedDynamicTexture, Button, Control, Rectangle } from "@babylonjs/gui";

enum State { START, GAME };

class App {

    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    // private _button: HTMLButtonElement;

    private _state: number = 0;
    private _gamescene: Scene;

    private _bus: JDBus;
    private _rotary;
    private _pushButton;

    private _createCanvas(): HTMLCanvasElement {
        document.documentElement.style["overflow"] = "hidden"; 
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";

        document.body.appendChild(this._canvas);
        return this._canvas;
    }

    private async _connectJacdac() {
        const bus = createUSBBus();
        this._bus = bus;

        if (!this._bus.connected) this._bus.connect();

        this._bus.on(DEVICE_ANNOUNCE, device => {
            console.log(device.describe() + " has connected!");
            this._pushButton = this._bus.services({serviceClass: SRV_BUTTON})[0];
            // console.log(this._pushButton.specification);
            this._pushButton.event(ButtonEvent.Down).on(EVENT, (event: JDEvent) => {console.log("hi this is a button");});
        });

        this._bus.on(DEVICE_DISCONNECT, device => {
            console.log(device.describe() + " has disconnected...");
            // if (device.describe() == "button") this._pushButton.device = null;
        });
    }

    private async _goToStart() {
        this._engine.displayLoadingUI();

        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        // GUI
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        // background image
        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 0.8;
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const startButton = Button.CreateSimpleButton("start", "PLAY");
        startButton.fontFamily = "Viga";
        startButton.width = 0.2;
        startButton.height = "40px";
        startButton.color = "white";
        startButton.top = "-14px";
        startButton.thickness = 0;
        startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(startButton);

        startButton.onPointerDownObservable.add(() => {
            this._goToGame();
            scene.detachControl();
        });

        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;

        await this._setUpGame();
    }

    private async _setUpGame() {
        let scene = new Scene(this._engine);
        this._gamescene = scene;
    }

    private async _goToGame() {
        // setup scene
        this._scene.detachControl();
        let scene = this._gamescene;
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera: ArcRotateCamera = new ArcRotateCamera(
            "Camera", 
            Math.PI / 2, 
            Math.PI / 2, 
            2, 
            Vector3.Zero(),
            scene
        );
        camera.setTarget(Vector3.Zero());

        // gui
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        scene.detachControl();

        // create a simple button
        const backToStartButton = Button.CreateSimpleButton("goBack", "BACK");
        backToStartButton.width = 0.2;
        backToStartButton.height = "40px";
        backToStartButton.color = "white";
        backToStartButton.top = "-14px";
        backToStartButton.thickness = 0;
        backToStartButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        playerUI.addControl(backToStartButton);

        backToStartButton.onPointerClickObservable.add(() => {
            this._goToStart();
            scene.detachControl();
        });

        //temporary scene objects
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        //get rid of start scene, switch to gamescene and change states
        this._scene.dispose();
        this._state = State.GAME;
        this._scene = scene;
        this._engine.hideLoadingUI();
        //the game is ready, attach control back
        this._scene.attachControl();
    }

    constructor() {
    
        this._canvas = this._createCanvas();
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        var camera: ArcRotateCamera = new ArcRotateCamera(
            "Camera", 
            Math.PI / 2, 
            Math.PI / 2, 
            2, 
            Vector3.Zero(), 
            this._scene
        );

        var light1: HemisphericLight = new HemisphericLight(
            "light1",
            new Vector3(1, 1, 0),
            this._scene
        );

        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", {diameter: 1}, this._scene);


        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        this._connectJacdac();
        this._engine.runRenderLoop(() => {this._scene.render(); });
        
        this._main();
    }

    private async _main(): Promise<void> {
        await this._goToStart();

        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START: 
                    this._scene.render();
                    break;
                case State.GAME: 
                    this._scene.render();
                    break;
                default: break;
        }
    });

    window.addEventListener('resize', () => {
        this._engine.resize();
    });
    }
}
new App();