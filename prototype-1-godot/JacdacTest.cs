using Godot;
using System;
using Jacdac;
using Jacdac.Clients;
using Jacdac.Transports.WebSockets;

public partial class JacdacTest : Node
{
	[Export]
	private Label DirectionsTextBox { get; set; }

    [Export]
	private Label TemperatureTextBox { get; set; }
	private int LastRotaryValue { get; set; }
	private int Temperature {  get; set; }

	private bool isRotaryActive { get; set; }
	private RotaryEncoderClient rotary;

    public override void _Ready()
	{
		Temperature = 0;
		isRotaryActive = false;
		var bus = new JDBus(WebSocketTransport.Create());
		var button = new ButtonClient(bus, "btn");
		rotary = new RotaryEncoderClient(bus, "rotary");

/*		rotary.Connected += (s, e) => rotary.ReadingChanged += (p, q) => UpdateTemp((RotaryEncoderClient)s);
		rotary.Disconnected += (s, e) => rotary.ReadingChanged -= (p, q) => UpdateTemp((RotaryEncoderClient)s);*/

        rotary.Connected += (s, e) => isRotaryActive = true;
        rotary.Disconnected += (s, e) => isRotaryActive = false;


        // button.Down += (s, e) => DirectionsTextBox.CallDeferred("add_text", " hahaha");
        // rotary.ReadingChanged += (s, e) => UpdateTemp((RotaryEncoderClient)s);
    }

	private void UpdateTemp(RotaryEncoderClient rotary)
	{
		if (Math.Abs(rotary.Position - LastRotaryValue) > 5 || (rotary.Position - LastRotaryValue) == 0) return;
		if (rotary.Position > LastRotaryValue) Temperature++;
		else Temperature--;

		LastRotaryValue = rotary.Position;
		TemperatureTextBox.CallDeferred("set_text", $"{Temperature} C");

        if (Temperature == 23)
        {
            DirectionsTextBox.CallDeferred("set_text", "Ahh, it's the perfect temperature!");
        }
        else if (Temperature > 23)
        {
            DirectionsTextBox.CallDeferred("set_text", "Yikes! It's too hot! I need an AC!");
        }
        else if (Temperature < 23)
        {
            DirectionsTextBox.CallDeferred("set_text", "It's cold! Can you turn up the heater?");
        }
    }

	public override void _Process(double delta)
	{
		if (isRotaryActive) UpdateTemp(rotary);
	}
}
