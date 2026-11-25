# Modbus Server

Turns the gateway into a Modbus server, so PLCs, SCADA systems, HMIs and historians read NCD wireless sensor data as plain Modbus registers.

## What it does

- **Modbus TCP, Modbus RTU, or both.** Modbus TCP on the gateway's Ethernet ports and Modbus RTU on its RS-485 port, serving the same data.
- **One fixed block of 100 registers per sensor.** A PLC reads a whole sensor in one request, and a sensor keeps its block when other sensors are added or removed.
- **Decoded values.** Every measurement is a 32-bit float in two registers, so there is no payload decoding on the PLC side. The word order is a setting, with a test value that always reads 1.0.
- **Status with every sensor.** Online and stale bits, sensor type, last report time, age, battery, signal strength and a sequence number that increases with every report. A gateway heartbeat stops if the data freezes.
- **Holding and input registers carry the same data**, for clients that only use one.
- **Read-only by default.** The one writable point is an optional new-data acknowledge.
- **A register map in the app**, with live values and a CSV export for the integrator.
- **Diagnostics.** Request and error counters for each interface, the connected clients and the last 100 requests.

Raw vibration and ultrasound waveforms are not on Modbus. Sensors that can send them have their overall values mapped.

## What it needs

- **Atrium 2.10.0 or newer.** Atrium 2.10.0 is a pre-release. To install it, open the gateway's **Settings, Updates**, choose **Force Update to Specific Version** and enter `2.10.0`.
- An EG5100 or EG5120 gateway. Modbus RTU uses the gateway's **COM2** port in RS-485 mode.
- For Modbus TCP, a client on the same private network as the gateway.
- No license. The app is free.

## Getting started

1. Open the app. The server is off until you turn it on.
2. Under **Settings**, turn on **Modbus TCP**, **Modbus RTU** or both, and click **Save**.
3. For Modbus TCP, connect your client to the port shown on the **Overview**. The gateway normally cannot use port 502, so the server listens on **5020** and says so.
4. For Modbus RTU, set the baud rate, parity, stop bits and slave address to match your master. The default is 19200 baud, 8 data bits, even parity, 1 stop bit. Saving sets COM2 to RS-485 mode, which takes about 10 seconds.
5. Open **Sensors**, then **Registers**, to see where each value is. Download the CSV for your integrator.

## Who can connect

Modbus has no login. By default the server answers only clients on private network addresses, so a gateway with a public address does not serve its registers to the internet.

- **Who may connect** has two choices: private addresses only, or any address.
- **Allowed clients** narrows either choice to the addresses and ranges you list.

## Good to know

- Register addresses belong to one gateway. The order of a sensor type's values is fixed on a gateway, but it is not the same on every gateway. Use each gateway's own register map.
- Changing a Modbus TCP setting disconnects the connected clients. They reconnect by themselves.
- Only one app can use the RS-485 port at a time.
- If COM2 is changed later in the Robustel dashboard, the app reports it and offers **Apply**. It does not change the port by itself.
