/**
 * Handles LibreSpot based events and converts them to generic events handled by the frontend
 */

async function handleLibrespotEvent(event: any, time: number) {
    switch (event.event) {
        case 'contextChanged':
            // Not implemented
            break;
        case 'trackChanged':
            // Not implemented
            notifyTrackChanged();
            break;
        case 'playbackEnded':
            // Not implemented
            break;
        case 'playbackPaused':
            // Not implemented
            break;
        case 'playbackResumed':
            // Not implemented
            break;
        case 'volumeChanged':
            // Not implemented
            break;
        case 'trackSeeked':
            // Not implemented
            break;
        case 'metadataAvailable':
            // Not implemented
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