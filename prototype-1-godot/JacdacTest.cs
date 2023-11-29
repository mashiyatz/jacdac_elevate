using Godot;
using System;
using Jacdac;
using Jacdac.Clients;
using Jacdac.Transports.WebSockets;

public partial class JacdacTest : Node
{
	public override void _Ready()
	{
		var bus = new JDBus(WebSocketTransport.Create());
		var button = new ButtonClient(bus, "btn");
	}

	// Called every frame. 'delta' is the elapsed time since the previous frame.
	public override void _Process(double delta)
	{
	}
}
