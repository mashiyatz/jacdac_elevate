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

	public override void _Ready()
	{
		Temperature = 0;
		var bus = new JDBus(WebSocketTransport.Create());
		var button = new ButtonClient(bus, "btn");
		var rotary = new RotaryEncoderClient(bus, "rotary");

		// button.Down += (s, e) => DirectionsTextBox.CallDeferred("add_text", " ooh");
		rotary.ReadingChanged += (s, e) => UpdateTemp((RotaryEncoderClient)s);
	}

	private void UpdateTemp(RotaryEncoderClient rotary)
	{
		if (Math.Abs(rotary.Position - LastRotaryValue) > 5) return;
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

	}
}
