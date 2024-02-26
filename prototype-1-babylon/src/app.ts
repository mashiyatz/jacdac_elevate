import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder } from "@babylonjs/core";
import { createWebBus, DEVICE_ANNOUNCE, CHANGE, CONNECT, DISCONNECT, SRV_ROTARY_ENCODER } from "jacdac-ts";
import { DEVICE_CONNECT, DEVICE_DISCONNECT } from "jacdac-ts";

class App {
    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        // initialize Jacdac bus
        const bus = createWebBus();
        const rotary = bus.devices({serviceClass: SRV_ROTARY_ENCODER})[0];

        const connectEl = document.getElementById("connectbtn");
        connectEl.onclick = async () => (bus.connected ? bus.disconnect() : bus.connect());
        
        bus.on(DEVICE_ANNOUNCE, device => console.log(device.describe() + " has connected!"));
        bus.on(DEVICE_DISCONNECT, device => console.log(device.describe() + " has disconnected..."));

        // rotary.on(CONNECT, () => console.log('Rotary Encoder Connected!'));
        // rotary.on(DISCONNECT, () => console.log('Rotary Encoder Disconnected!'))

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();