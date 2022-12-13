
// Open a websocket to the server to communicate on
socket = new WebSocket('ws://' + window.location.hostname + ':5001');

socket.onopen = function (e) {
    console.log("[open] Connection established");
    // Attempt to query the current state of the app
    sendInitialised();
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.event !== 'serviceStarted')
        // Leave the connect page and return to the player page
        playerLoaded();
    switch (data.event) {
        case 'serviceStarted':
            serviceStarted(data);
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
    }
};

socket.onclose = function (event) {
    console.dir(`[close] Connection closed, code=${event.code} reason=${event.reason}`);

};

socket.onerror = function (error) {
    console.dir(`[error]`);
};

// Determines whether the service has already connected / a song is already playing if the page has just reloaded
function sendInitialised() {
    socket.send(JSON.stringify({
        side: 'client',
        event: 'clientInitialised'
    }))
}

/**
 * Populate the device name field in the connect page
 * 
 * @param {object} data the socket event that triggered this function
 */
function serviceStarted(data) {
    document.getElementById('serviceName').textContent = data.deviceName;
}

/**
 * Open the player page as the service has loaded
 */
function playerLoaded() {
    document.getElementById('connect_page').classList.add('page_hidden');
    document.getElementById('player_page').classList.remove('page_hidden');
}