/**
 * Handles LibreSpot based events and converts them to generic events handled by the frontend
 */
import { notifyMetadata, notifyPause, notifyPlay, notifyTrackSeeked, notifyTrackChanged, notifyUnloaded } from './clientSocket'
import { config as globalConfig} from './config.json';

import { createConfig, PlayerConfig } from './librespotConfigBuilder';
import child_process from 'child_process';
import WebSocket from 'ws';
import fs from 'fs';

let instances: PlayerConfig[] = [];

export function getLibrespotInstance(instanceNumber: number): PlayerConfig {
    console.log('getting instance for number: ' + instanceNumber);
    console.dir(instances);
    return instances[instanceNumber];
}

export function getLibrespotWSPath(instanceNumber: number): string {
    return `ws://0.0.0.0:${instances[instanceNumber].apiPort}`;
}

export function getLibrespotAPIPath(instanceNumber: number): string {
    return `http://localhost:${instances[instanceNumber].apiPort}`;
}


/**
 * Spawns a new Librespot instance wih provided config
 * 
 * @param config The configuration to use
 * @param instanceNumber An identifier for this configuration
 */
export function spawnLibrespotInstance(config: PlayerConfig, instanceNumber: number) {
    // Bind instance
    instances[instanceNumber] = config;

    // Create config and start service
    const configFile = `tmp/${createConfig(config)}.toml`;
    // Get the instance name to force pulseaudio to route to
    const sinkName = instances[instanceNumber].instanceName.replaceAll(' ', '');
    const librespotService = child_process.spawn('java', ['-jar', globalConfig.librespot_jar, '--conf-file=' + configFile], { env: { ...process.env, PULSE_SINK: sinkName } });
    console.log('Using Config file ' + configFile + ' For Instance ' + instanceNumber)
    librespotService.on('close', (code) => {
        console.error(`Librespot failed to start! ${code}`);
        fs.rm(configFile, () => {
            throw Error('Failed to start Librespot, check to see if it is not already running!');
        });
    });

    librespotService.stdout.setEncoding('utf-8');

    librespotService.stdout.on('data', (code: string) => {
        if (code.includes('Server started on port ')) {
            startLibrespotHandler(instanceNumber);
            librespotService.stdout.removeAllListeners('data');
        }
        console.log(code);
    });


}


function startLibrespotHandler(instanceNumber: number) {
    const ws = new WebSocket(getLibrespotWSPath(instanceNumber) + '/events');

    ws.on('open', function open() {
        ws.send('something');
    });

    ws.on('message', (message: string) => {
        const data: any = JSON.parse(message);
        console.dir(data);
        handleLibrespotEvent(instanceNumber, data, Date.now());
    });
}


export async function handleLibrespotEvent(instanceNumber: number, event: any, time: number) {
    switch (event.event) {
        case 'contextChanged':
            // Not implemented
            break;
        case 'trackChanged':
            // Not implemented
            notifyTrackChanged(instanceNumber, time);
            break;
        case 'playbackEnded':
            // Not implemented
            break;
        case 'playbackPaused':
            notifyPause(instanceNumber, event.trackTime);
            break;
        case 'playbackResumed':
            notifyPlay(instanceNumber, event.trackTime);
            break;
        case 'volumeChanged':
            // Not implemented
            break;
        case 'trackSeeked':
            notifyTrackSeeked(instanceNumber, event.trackTime);
            break;
        case 'metadataAvailable':
            // Get the largest cover image
            console.dir(event?.track?.album?.coverGroup?.image);
            let coverImageID: string = event?.track?.album?.coverGroup?.image?.find(img => img.size === 'LARGE')?.fileId;
            if (coverImageID === undefined)
                coverImageID = event?.track?.album?.coverGroup?.image[0]?.fileId;
	    
            const coverUrl: string = 'https://i.scdn.co/image/' + coverImageID?.toLowerCase();
            const trackName: string = event?.track?.name;
            const albumName: string = event?.track?.album?.name;
            const artists: string[] = event?.track?.artist?.map(artist => artist?.name);
            const duration: number = event?.track?.duration;
            notifyMetadata(instanceNumber, {
                trackName: trackName,
                albumName: albumName,
                artists: artists,
                duration: duration,
                coverUrl: coverUrl,
            });
            break;
        case 'playbackHaltStateChanged':
            // Not implemented
            break;
        case 'sessionCleared':
            // Not implemented
            notifyUnloaded(instanceNumber);
            break;
        case 'sessionChanged':
            // Not implemented
            // Todo: popup on top left side saying "Signed in to"
            break;
        case 'inactiveSession':
            // Not implemented
            // Todo: If "timeout" is true, close connection
            notifyUnloaded(instanceNumber);
            break;
        case 'connectionDropped':
            // Not implemented
	    notifyUnloaded(instanceNumber);
            break;
        case 'connectionEstablished':
            // Not implemented
            break;
        case 'panic':
            // Not implemented
            // Todo: popup on top left saying "Something went wrong"
            break;
    }
}
