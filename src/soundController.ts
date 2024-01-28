import { PulseAudio, percentToVolume, volumeToPercent } from 'pulseaudio.js';


import { exec } from 'node:child_process';

import * as fs from 'fs';

const pa = new PulseAudio();
let config;

const defaultFormat = 's24le';
const defaultRate = 48000;


let soundmap = [];
/*
 * Example of soundmap
 * [
 * 	{
 *		instanceName: "Test-Instance-1",
 *		nullSink: 20,
 *		nullSinkName: "Instance1",
 *		combinedSink: 21,
 *		combinedSinkName: "CombinedInstance1",
 *		loopback: 22,
 *		outputs: [
 *			{
 *				name: "Room 1",
 *				sink: "alsa.stereo.multi......."
 *			}
 *		]
 *  	}
 * ]
 */
 function sleep(ms) {
	return new Promise((resolve) => {
	  setTimeout(resolve, ms);
	});
  }
// Initialises null sinks for the instances
export async function initialise() {

	// Clear old settings
	await close();
	await sleep(1000);
	// Load config
	config = JSON.parse(fs.readFileSync('./src/config.json', 'utf8')).config;

	await pa.connect();
	await sleep(1000);
	
	// For each of the instances, initialise a null sink
	console.log(config);
	console.dir(config.instances);

	for (let i = 0; i < config.instances.length; ++i) {
		const instanceName = config.instances[i].name;
		console.log(instanceName);
		// Make null sink
		const nullSinkName = instanceName.replaceAll(' ', '');

		const nullSink = await pa.loadModule('module-null-sink', {
			sink_name: nullSinkName,
			sink_properties: {
				// unloadModule: true,
			},
			rate: defaultRate,
			format: defaultFormat
			// Original 44100 @ s24le, 48000 mostly works, testing 48000 @ s16le
		});
		console.log(`Made NULL SINK ${nullSink} w name "${nullSinkName}"`)
		
		// Find all rooms that reference this sink
		const rooms = config.rooms.filter(room => room.instance == instanceName);

		// Extract the sink names
		await Promise.all(rooms.map(async (room) => { room.sink = await findQualifiedSinkName(room.sink) }));

		const outputs = rooms.map(room => {
			const newRoom = { name: room.name, sink: room.sink }
			return newRoom;
		});

		soundmap[i] = {
			instanceName: instanceName,
			nullSink: nullSink,
			nullSinkName: nullSinkName,
			outputs: outputs,
		};

		// Make the combined sink and loopback
		await remakeCombinedSink(i);
	}

	console.dir(soundmap)
	console.dir(soundmap[0].outputs)
	console.dir(JSON.stringify(soundmap))
}

// Given a partial match of a sink name, find the full qualified sink name
async function findQualifiedSinkName(sinkName) {
	const sinks = await pa.getAllSinks();
	const filteredSinks = sinks.filter(sink => sink.name.includes(sinkName));
	if (filteredSinks.length == 0)
		throw (`Sink ${sinkName} could not be found!`);
	return filteredSinks[0].name;
}

export async function moveRoomToInstance(roomName, instanceName) {
	let instanceNumber = soundmap.findIndex(instance => instance.instanceName == instanceName);
	if(instanceNumber == -1)
		return;
	console.log(roomName)
	console.log(instanceName)
	console.log(instanceNumber)
	await moveSinkToInstance(roomName, instanceNumber);
}

export function instanceFromRoomName(roomName) {
	return soundmap.findIndex(m => m.outputs.find(o => o.name == roomName) != null);
}

export async function moveSinkToInstance(roomName, instanceNumber) {
	// Unbind sink from current instance

	// Get the instance the room is in and unbind
	const originalInstanceNumber = instanceFromRoomName(roomName);
	const room = soundmap[originalInstanceNumber].outputs.splice(soundmap[originalInstanceNumber].outputs.findIndex(o => o.name == roomName), 1)[0];

	// Add to new instance number
	soundmap[instanceNumber].outputs.push(room);

	// Update changes
	await remakeCombinedSink(instanceNumber);
	await remakeCombinedSink(originalInstanceNumber);
}

export async function setRoomVolume(roomName, volume) {
	if (volume == null || volume < 0 || volume > 100)
		return;
	
	// Get the Sink Name
	const sink = soundmap.flatMap(i => i.outputs).find(room => room.name == roomName).sink;
	if (sink == null)
		return;
		
	await pa.setSinkVolume(percentToVolume(volume), sink);
}

export async function getRoomVolume(roomName) {
	// Get the Sink Name
	const sink = soundmap.flatMap(i => i.outputs).find(room => room.name == roomName).sink;
	if (sink == null)
		return  -1;
		
	return volumeToPercent((await pa.getSinkInfo(sink))?.volume?.current[0]);
}

async function remakeCombinedSink(instanceNumber) {
	// Check the combinedSink and loopback ids
	let combinedSink = soundmap[instanceNumber].combinedSink;
	let loopback = soundmap[instanceNumber].loopback;
	console.log('combine sink = ' + combinedSink)
	// Unload if not null
	if (combinedSink != null) await pa.unloadModule(combinedSink);
	if (loopback != null) await pa.unloadModule(loopback);

	// Create combined sink

	if (soundmap[instanceNumber].outputs.length != 0) {
		console.log('making combined sink')
		const combinedName = 'Combined' + soundmap[instanceNumber].nullSinkName;
		const slaves = soundmap[instanceNumber].outputs.map(output => output.sink).join(',');
		console.dir(soundmap[instanceNumber].outputs.map(o => o.sink));
		console.log(slaves);

		combinedSink = await pa.loadModule('module-combine-sink', {
			sink_name: combinedName,
			slaves: slaves,
			sink_properties: {
				unloadModule: true,
				'device.description': combinedName
			},
			channels: 2,
			rate: defaultRate,
			format: defaultFormat
		});
		console.log('combinsink: ' + combinedSink)

		// Loopback null sink
		const source = soundmap[instanceNumber].nullSinkName + '.monitor';
		console.log('making loopback with source:' + source + ' sink: ' + combinedName)

		loopback = await pa.loadModule('module-loopback', {
			source: source,
			sink: combinedName,
			rate: defaultRate,
			format: defaultFormat

		});

		soundmap[instanceNumber].loopback = loopback;
		soundmap[instanceNumber].combinedSink = combinedSink;
		soundmap[instanceNumber].combinedSinkName = combinedName;
	} else {
		// No outputs
		console.log('No Slaves');
		soundmap[instanceNumber].loopback = null;
		soundmap[instanceNumber].combinedSink = null;
		soundmap[instanceNumber].combinedSinkName = '';
	}
	console.log('remapped')
	console.dir(JSON.stringify(soundmap))


}


export function getBindings() {
	return soundmap.map(instance => { return { name: instance.instanceName, outputs: instance.outputs.map(output => output.name) } });
}

async function close() {
	// TODO: Safely unload all modules
	await exec('pactl unload-module module-null-sink')
	await exec('pactl unload-module module-combine-sink')
}

async function main() {
	//console.log(await pa.getAllSinks());

	// await close();
	// await initialise();
	// await moveSinkToInstance('Room 3', 0);
	// await moveSinkToInstance('Room 1', 1);

	// remakeCombinedSink(0);


	// Make Combined Sink
	//pactl load-module module-combine-sink sink_name=CombinedInstance1 sink_properties=device.description=CombinedInstance1 slaves=<Room's Sink> channels=2


}

// main();
