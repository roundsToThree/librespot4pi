/**
 * Functions relating to serving client requests
 */

import { WebSocket, WebSocketServer } from 'ws';
import { Metadata, Axios } from './interfaces';
import axios from 'axios';
import { config } from './config.json';
import { handleLibrespotEvent, getLibrespotWSPath, getLibrespotInstance, getLibrespotAPIPath } from './librespotHandler';
import { getBindings, setRoomVolume, getRoomVolume } from './soundController';

/**
 * A wrapper for sending POST requests
 * 
 * @param {string} url The url of the resource
 * @param {any} body The JSON content of the body
 */
async function sendPOST(url: string, endpoint: string, body: any): Promise<Axios> {
  //todo: handle responses appropriately
  try {
    return await axios.post(url + endpoint, body);
  } catch (err) {
    console.error(err);
  }
}
async function sendGET(url: string, endpoint: string): Promise<Axios> {
  //todo: handle responses appropriately
  try {
    return await axios.get(url + endpoint);
  } catch (err) {
    console.error(err);
  }
}

// Create a websocket for the client to connect to
const wss = new WebSocketServer({ port: 5001 });
wss.on('connection', function connection(ws) {
  ws.on('message', async function message(data) {
    // Attempt to parse content
    try {
      data = JSON.parse(data);
    } catch {
      console.error('Invalid request recieved, Ignoring...');
      return;
    }
    // Interpret client only messages
    if (data?.side === 'client') {
      // Get the instance number if applicable
      const instanceNumber: number = instanceNumberFromClient(ws);

      switch (data?.event) {
        case 'playbackPaused':
          pausePlayback(instanceNumber);
          break;
        case 'playbackResumed':
          resumePlayback(instanceNumber);
          break;
        case 'trackSeeked':
          seekTrack(instanceNumber, data?.time);
          break;
        case 'nextTrack':
          nextTrack(instanceNumber);
          break;
        case 'previousTrack':
          previousTrack(instanceNumber);
          break;
        case 'roomVolumeChanged':
          setRoomVolume(data?.room, data?.volume);
          break;
        case 'getRoomVolume':
	  		ws.send(JSON.stringify({
			  	side: 'server',
				event: 'getRoomVolume',
				volume: await getRoomVolume(data?.room)
			}));
	  		break;
        case 'clientInitialised':
          clientInitialised(data?.instanceNumber, ws);
          break;
      }
    }
  });
});

let clients = [];

function bindClient(instanceNumber: number, client: any) {
  if (instanceNumber == null || client == null)
    return;
  
  // If client is already bound, unbind
  const oldIndx = clients.findIndex(inst => inst.includes(client));
  if (oldIndx != -1)
  	unbindClient(oldIndx, client);
    
  if (clients[instanceNumber] == null)
    clients[instanceNumber] = [];
  client.instanceNumber = instanceNumber;
  clients[instanceNumber].push(client);
}

function unbindClient(instanceNumber: number, client: any) {
  // Janky lol
  console.log("UNBINDING" + instanceNumber);
  clients[instanceNumber] = clients[instanceNumber]?.filter(c => JSON.stringify(c) == JSON.stringify(client));
}

function instanceNumberFromClient(client: any): number {
  return client.instanceNumber;
  //clients.findIndex(list -> list.includes(
}

/**
 * [ACTION]
 * Called from a client issued websocket
 * Sends up to 3 websocket responses back:
 * 1. Librespot instance name (serviceStarted)
 * ** If service active **
 * 2. Metadata available (metadata)
 * 3. Track Seeked (trackSeeked)
 * 
 * Only supports Librespot for now
 */
async function clientInitialised(instanceNumber: number, client: any) {
  // Bind client to intsance number
  bindClient(instanceNumber, client);
  console.log('binding client to ' + instanceNumber);
  notifyServiceStarted(instanceNumber, getLibrespotInstance(instanceNumber)?.instanceName);
  // Status is 204 if there is no service running
  if ((await sendGET(getLibrespotAPIPath(instanceNumber), '/instance'))?.status === 200) {
    let data: any = (await sendPOST(getLibrespotAPIPath(instanceNumber), '/player/current', {}))?.data;
	
    // Forward the metadata event to the handleLibrespotEvent function so it can properly formulate a response
    data.event = 'metadataAvailable';
    handleLibrespotEvent(instanceNumber, data, Date.now());

    notifyPlay(instanceNumber, data.trackTime);
  } else {
    // Send client back to connect page.
    // notifyUnloaded(instanceNumber);

    // Unbind the client pair
    unbindClient(instanceNumber, client);
  }

  broadcastSinkBindings();
}

function broadcastSinkBindings() {
  broadcastClients({
    side: 'server',
    event: 'sinkBindings',
    bindings: getBindings(),
  });
}

function broadcastClients(data: any) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function broadcastClient(data: any, instanceNumber: number) {
  clients[instanceNumber]?.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

export function notifyPlay(instanceNumber: number, trackTime: number) {
  broadcastClient({
    side: 'server',
    event: 'playbackResumed',
    time: trackTime,
  }, instanceNumber);
}

export function notifyPause(instanceNumber: number, trackTime: number) {
  broadcastClient({
    side: 'server',
    event: 'playbackPaused',
    time: trackTime,
  }, instanceNumber);
}

export function notifyTrackChanged(instanceNumber: number, time: number) {
  broadcastClient({
    side: 'server',
    event: 'trackChanged',
    time: time,
  }, instanceNumber);
}

export function notifyMetadata(instanceNumber: number, metadata: Metadata) {
  broadcastClient({
    side: 'server',
    event: 'metadata',
    metadata: metadata,
  }, instanceNumber);
}

export function notifyTrackSeeked(instanceNumber: number, time: number) {
  broadcastClient({
    side: 'server',
    event: 'trackSeeked',
    time: time,
  }, instanceNumber);
}


export function notifyServiceStarted(instanceNumber: number, deviceName: string) {
  broadcastClient({
    side: 'server',
    event: 'serviceStarted',
    deviceName: deviceName,
  }, instanceNumber);
}


export function notifyUnloaded(instanceNumber: number) {
  broadcastClient({
    side: 'server',
    event: 'serviceStopped',
  }, instanceNumber);
}

// function notifyTrackNext() {

// }

// function notifyTrackPrev() {

// }

/**
 * [EVENT]
 * Update the frontend to a change in volume
 * 
 * @param {number} volume A number between 0 - 100 representing new volume
 */
function notifyVolumeChange(instanceNumber: number, volume: number) {

}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests the playback to be paused
 * 
 * Only supports Librespot for now
 */
function pausePlayback(instanceNumber: number) {
  sendPOST(getLibrespotAPIPath(instanceNumber), '/player/pause', {});
}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests the playback to be resumed
 * 
 * Only supports Librespot for now
 */
function resumePlayback(instanceNumber: number) {
  sendPOST(getLibrespotAPIPath(instanceNumber), '/player/resume', {});
}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests to seek the track
 * 
 * Only supports Librespot for now
 */
function seekTrack(instanceNumber: number, trackTime: number) {
  sendPOST(getLibrespotAPIPath(instanceNumber), '/player/seek?pos=' + trackTime, {});
}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests for the next track to be played
 * 
 * Only supports Librespot for now
 */
function nextTrack(instanceNumber: number) {
  sendPOST(getLibrespotAPIPath(instanceNumber), '/player/next', {});
}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests for the pervious track to be played
 * 
 * Only supports Librespot for now
 */
function previousTrack(instanceNumber: number) {
  sendPOST(getLibrespotAPIPath(instanceNumber), '/player/prev', {});
}

/*
Events
{ event: 'sessionChanged', username: 'johnsakoutis' }
{ event: 'volumeChanged', value: 1 }
{ event: 'sessionCleared' }

{ event: 'metadataAvailable',
  track: {
    gid: '4227E42972204321A68C32C97F0287DF',
    name: 'Swim',
    album: {
      gid: 'FF0647266F5145E99D81FBE39FAE69E2',
      name: 'You Are Someone Else',
      artist: [Array],
      label: 'Polydor Records',
      date: [Object],
      coverGroup: [Object]
    },
    artist: [ [Object] ],
    number: 3,
    discNumber: 1,
    duration: 197506,
    popularity: 47,
    externalId: [ [Object] ],
    file: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object]
    ],
    preview: [ [Object] ],
    earliestLiveTimestamp: 1521172800,
    hasLyrics: true,
    licensor: { uuid: 'FE358EA987E2424D9021C2665A0667B7' }
  }
}

{ event: 'trackSeeked', trackTime: 83493 }
{ event: 'playbackHaltStateChanged', trackTime: 83493, halted: true }
{ event: 'playbackHaltStateChanged', trackTime: 83493, halted: false }


{ event: 'playbackResumed', trackTime: 1822 }
{ event: 'playbackPaused', trackTime: 53135 }

// Note! Librespot does not track events when the playback is sent to the start using the back arrow
}


*/
