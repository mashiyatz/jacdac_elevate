import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Color4, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, Rectangle } from "@babylonjs/gui";
import { JacdacTools } from "./modules/jacdac-tools";
import { CanvasSetup } from "./modules/canvas-setup";

class App {

    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;

    private async setupGUI() {
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 0.8;
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const button = Button.CreateSimpleButton("navButton", "TOUCH ME");
        button.fontFamily = "Viga";
        button.width = 0.2;
        button.height = "40px";
        button.color = "white";
        button.top = "-14px";
        button.thickness = 0;
        button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(button);

        button.onPointerClickObservable.add(() => {
            console.log("hey");
        });
    }

    private async _start() {
        this._engine.displayLoadingUI();

        this._scene.detachControl();
        this._scene.clearColor = new Color4(0.4, 0.4, 0.4, 1);

        this.setupGUI();

        await this._scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.attachControl();
    }

    constructor() {
        // Awake;
        const _sceneSetup = new CanvasSetup();

        this._canvas = _sceneSetup.canvas;
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        this._start();

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
        
        this._main();
    }

    private async _main(): Promise<void> {
        // Start
        new JacdacTools();

        window.addEventListener('resize', () => {
            this._engine.resize();
        });

        // Update
        this._engine.runRenderLoop(() => {this._scene.render(); });
    }
    }
new App();