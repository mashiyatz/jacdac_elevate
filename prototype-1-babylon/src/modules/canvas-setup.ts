export class CanvasSetup {

    public canvas: HTMLCanvasElement;

    public createCanvas(): HTMLCanvasElement {
        var _canvas: HTMLCanvasElement;

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
        
        _canvas = document.createElement("canvas");
        _canvas.style.width = "100%";
        _canvas.style.height = "100%";
        _canvas.id = "gameCanvas";

        document.body.appendChild(_canvas);
        return _canvas;
    }

    constructor() {
        this.canvas = this.createCanvas();
    }
}
