/**
 * Handles LibreSpot based events and converts them to generic events handled by the frontend
 */
import {notifyMetadata, notifyPause, notifyPlay, notifySeek, notifyTrackChanged} from './clientSocket'

export async function handleLibrespotEvent(event: any, time: number) {
    switch (event.event) {
        case 'contextChanged':
            // Not implemented
            break;
        case 'trackChanged':
            // Not implemented
            notifyTrackChanged(time);
            break;
        case 'playbackEnded':
            // Not implemented
            break;
        case 'playbackPaused':
            notifyPause(event.trackTime);
            break;
        case 'playbackResumed':
            notifyPlay(event.trackTime);
            break;
        case 'volumeChanged':
            // Not implemented
            break;
        case 'trackSeeked':
            notifySeek(event.trackTime);
            break;
        case 'metadataAvailable':
            // Get the largest cover image
            console.dir(event?.track?.album?.coverGroup?.image);
            let coverImageID: string = event?.track?.album?.coverGroup?.image?.find(img => img.size === 'LARGE')?.fileId;
            if(coverImageID === undefined)
            coverImageID = event?.track?.album?.coverGroup?.image[0]?.fileId;

            const coverUrl: string = 'https://i.scdn.co/image/' + coverImageID.toLowerCase();
            const trackName: string = event?.track?.name;
            const albumName: string = event?.track?.album?.name;
            const artists: string[] = event?.track?.artist?.map(artist => artist?.name);
            const duration: number = event?.track?.duration;
            notifyMetadata({
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
            break;
        case 'sessionChanged':
            // Not implemented
            break;
        case 'inactiveSession':
            // Not implemented
            break;
        case 'connectionDropped':
            // Not implemented
            break;
        case 'connectionEstablished':
            // Not implemented
            break;
        case 'panic':
            // Not implemented
            break;
    }
}