// Generate random id
const id = Math.round(Math.random() * 100000);
    
    
// Open a websocket to the server to communicate on
socket = new WebSocket('ws://' + window.location.hostname + ':5001');

// Janky but determines whether the player is ready to transition from waiting for connection to the player screen
function isPlayerReady() {
	// Values from player.js
	return trackName != '' && trackName != null && trackDuration > 0;
}


socket.onopen = async function (e) {
    console.log("[open] Connection established");

    // Get page configuration
    let sp = new URLSearchParams(new URL(window.location.href).search);
    let room = roomName = sp.get('room'); //roomName is in player.js
    if (room == null) {
        alert('URL Parameters Missing! Please specify a "room" parameter in the search query')
        return;
    }
    // Get an instance number from the room name
    let instanceNumber = (await (await fetch("/api/instanceFromRoom?room=" + encodeURI(room))).json())?.instanceNumber;
    if (instanceNumber == null) {
        alert('Invalid Room name: Room does not exist!');
        return;
    }
    
    // Attempt to query the current state of the app
    sendInitialised(instanceNumber);
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.event) {
        case 'serviceStarted':
            serviceStarted(data);
            break;
        case 'sinkBindings':
            sinkBindings(data);
            break;
        case 'serviceStopped':
            playerUnloaded(data);
            break;
        case 'trackChanged':
            trackChanged(data);
            break;
        case 'metadata':
            metadataAvailable(data);
            break;
        case 'playbackPaused':
            playbackPaused(data);
            break;
        case 'playbackResumed':
            playbackResumed(data);
            break;
        case 'trackSeeked':
            trackSeeked(data);
            break;
        case 'getRoomVolume':
	    roomVolume(data);
	    break;
    }
    
	if (isPlayerReady())
        // Leave the connect page and return to the player page
        playerLoaded();
};

socket.onclose = function (event) {
    console.dir(`[close] Connection closed, code=${event.code} reason=${event.reason}`);

};

socket.onerror = function (error) {
    console.dir(`[error]`);
};

// Determines whether the service has already connected / a song is already playing if the page has just reloaded
function sendInitialised(intsanceNumber) {
    sendMessage('clientInitialised', {id: id});
   /* socket.send(JSON.stringify({
        side: 'client',
        event: 'clientInitialised',
        instanceNumber: intsanceNumber
    }))*/
}

/**
 * Populate the device name field in the connect page
 * 
 * @param {object} data the socket event that triggered this function
 */
function serviceStarted(data) {
    document.getElementById('serviceName').textContent = data.deviceName;
    
    // Initialised recieved, request volume
    requestVolume();
}

/**
 * Open the player page as the service has loaded
 */
function playerLoaded() {
    document.getElementById('connect_page').classList.add('page_hidden');
    document.getElementById('player_page').classList.remove('page_hidden');
}


/**
 * Restore the connect page as the service is no longer loaded
 */
function playerUnloaded() {
    document.getElementById('connect_page').classList.remove('page_hidden');
    document.getElementById('player_page').classList.add('page_hidden');
    
    // Remove the track name and end time to tell the player that the track is no longer loaded
    trackName = '';
    trackDuration = -1;
}

function openSourceTray() {
	document.getElementsByClassName('source-tray')[0].style.display = 'flex';
	setTimeout(() => {
    	document.getElementsByClassName('source-tray')[0].classList.remove('hidden');
	}, 10);


    setTimeout(() => {closeSourceTray()}, 5000);
}

function closeSourceTray() {
    document.getElementsByClassName('source-tray')[0].classList.add('hidden');
    // after transition plays, set hidden
    setTimeout(() => {
    document.getElementsByClassName('source-tray')[0].style.display = 'none';
    }, 500);
}
