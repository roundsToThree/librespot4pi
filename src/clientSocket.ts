/**
 * Functions relating to serving client requests
 */

import { WebSocket, WebSocketServer } from 'ws';
import { Metadata } from './interfaces';
import axios from 'axios';
import { config } from './config.json';

/**
 * A wrapper for sending POST requests
 * 
 * @param {string} url The url of the resource
 * @param {any} body The JSON content of the body
 */
function sendPOST(url: string, endpoint: string, body: any) {
  //todo: handle responses appropriately
  axios.post(url + endpoint, body)
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
}

// Create a websocket for the client to connect to
const wss = new WebSocketServer({ port: 5001 });
wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    // Attempt to parse content
    try {
      data = JSON.parse(data);
    } catch {
      console.error('Invalid request recieved, Ignoring...');
      return;
    }
    // Interpret client only messages
    if (data?.side === 'client') {
      switch (data?.event) {
        case 'playbackPaused':
          pausePlayback();
          break;
        case 'playbackResumed':
          resumePlayback();
          break;
        case 'trackSeeked':
          seekTrack(data?.time);
          break;
        case 'nextTrack':
          nextTrack();
          break;
        case 'previousTrack':
          previousTrack();
          break;
      }
    }
  });
});

function broadcastClients(data: any) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

export function notifyPlay(trackTime: number) {
  broadcastClients({
    side: 'server',
    event: 'playbackResumed',
    time: trackTime,
  })
}

export function notifyPause(trackTime: number) {
  broadcastClients({
    side: 'server',
    event: 'playbackPaused',
    time: trackTime,
  })
}

export function notifySeek(trackTime: number) {
  broadcastClients({
    side: 'server',
    event: 'trackSeeked',
    time: trackTime,
  })
}

export function notifyTrackChanged(time: number) {
  broadcastClients({
    side: 'server',
    event: 'trackChanged',
    time: time,
  })
}

export function notifyMetadata(metadata: Metadata) {
  broadcastClients({
    side: 'server',
    event: 'metadata',
    metadata: metadata,
  })
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
function notifyVolumeChange(volume: number) {

}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests the playback to be paused
 * 
 * Only supports Librespot for now
 */
function pausePlayback() {
  sendPOST(config.Librespot.api_url, '/player/pause', {});
}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests the playback to be resumed
 * 
 * Only supports Librespot for now
 */
function resumePlayback() {
  sendPOST(config.Librespot.api_url, '/player/resume', {});
}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests to seek the track
 * 
 * Only supports Librespot for now
 */
function seekTrack(trackTime: number) {
  sendPOST(config.Librespot.api_url, '/player/seek?pos=' + trackTime, {});
}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests for the next track to be played
 * 
 * Only supports Librespot for now
 */
function nextTrack() {
  sendPOST(config.Librespot.api_url, '/player/next', {});
}

/**
 * [ACTION]
 * Called from a client issued websocket (typically), 
 * Requests for the pervious track to be played
 * 
 * Only supports Librespot for now
 */
function previousTrack() {
  sendPOST(config.Librespot.api_url, '/player/prev', {});
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