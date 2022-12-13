
// Open a websocket to the server to communicate on
socket = new WebSocket('ws://' + window.location.hostname + ':5001');

socket.onopen = function (e) {
    console.dir("[open] Connection established");
};

// App states
let timelineInterval;       // Stores the interval that updates the "track progress bar"
let
    lastTrackTime = 0,      // The last position in the song that the track was paused at (in ms)
    lastTrackPause,         // The UNIX time the track was last paused at (in ms)
    trackPaused = false;    // Whether the track is currently paused
let trackSeeking = false;   // Whether the track is currently being seeked (dragged)

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.event) {
        case 'trackChanged':
            // Set the song to start now
            clearInterval(timelineInterval);
            trackPaused = false;
            lastTrackTime = 0;
            lastTrackPause = data.time;

            const startingTime = document.getElementById('timelineCurrent');
            const trackScrubber = document.querySelector('.track-scrubber');

            timelineInterval = setInterval(() => {
                if (trackSeeking)
                    return;

                if (trackPaused) {
                    lastTrackPause = Date.now();
                    return;
                }
                const currentTrackTime = (lastTrackTime + (Date.now() - lastTrackPause)) / 1000;
                // Dont display anything past duration

                if (currentTrackTime > trackScrubber.max)
                    return;
                startingTime.textContent = createTimeIntervalString(currentTrackTime);
                trackScrubber.value = currentTrackTime
            }, 200);
            break;
        case 'metadata':
            // Set the cover photo
            setBackgroundImage(data.metadata.coverUrl, document.getElementById('cover-images'), 'cover-photo');

            // Set the background image
            setBackgroundImage(data.metadata.coverUrl, document.getElementById('background-images'), 'background-image');

            const name = document.getElementById('trackName')
            const duration = document.getElementById('timelineMax')
            const albumName = document.getElementById('albumName')

            // artists.textContent = data.metadata.artists;
            name.textContent = data.metadata.trackName;
            duration.textContent = createTimeIntervalString(data.metadata.duration / 1000);
            albumName.textContent = data.metadata.albumName;

            // Set the range slider duration
            document.querySelector('.track-scrubber').max = data.metadata.duration / 1000;
            break;

        case 'playbackPaused':
            trackPaused = true;
            lastTrackTime = data.time;
            lastTrackPause = Date.now();
            break;
        case 'playbackResumed':
            trackPaused = false;
            lastTrackTime = data.time;
            lastTrackPause = Date.now();
            break;
        case 'trackSeeked':
            trackPaused = false;
            lastTrackTime = data.time;
            lastTrackPause = Date.now();
            break;
    }
};

socket.onclose = function (event) {
    console.dir(`[close] Connection closed, code=${event.code} reason=${event.reason}`);

};

socket.onerror = function (error) {
    console.dir(`[error]`);
};

function setBackgroundImage(url, imagesContainer, className) {

    // Add a new image to be selected
    const image = document.createElement('img');
    image.src = url;
    image.classList.add(className);
    image.setAttribute('crossorigin', 'anonymous');

    // Check if background is dfferent
    if (imagesContainer.querySelector('.selected').src === url)
        return;
    // Clear any unselected images
    [...imagesContainer.children].forEach((item) => {
        if (item.classList.contains('selected')) item.classList.remove('selected')
        else item.remove()

        // Copy minimised attribute to new image
        if (item.classList.contains('minimised')) image.classList.add('minimised')

    });

    imagesContainer.appendChild(image);

    // Wait a moment to start the fade in transition
    setTimeout(() => image.classList.add('selected'), 0);

}

/**
 * Converts a number containing seconds into a HH:MM:SS string
 * Hours is optionally present (hidden when 00)
 * 
 * @param {number} time The number of seconds to convert
 * @returns {string} a string in HH:MM:SS format 
 */
function createTimeIntervalString(time) {
    let output = '';
    output = fixLength(time % 60, 2);
    time /= 60;
    output = fixLength(Math.floor(time) % 60, 2) + ':' + output;
    time /= 60;
    if (time >= 1)
        output = fixLength(Math.floor(time), 2) + ':' + output;

    return output;
}

/**
 * 0 Pads a number to reach a desired minimum number of digits
 * 
 * @param {number} number The number to round and convert to a fixed number of digits
 * @param {number} digits The number of digits to pad the number to (minimum)
 * @returns {string} A 0 padded number string
 */
function fixLength(number, digits) {
    return Math.round(number).toLocaleString(undefined, { minimumIntegerDigits: digits })
}


let controlsTimeout;
function showControls() {
    clearTimeout(controlsTimeout);
    // Toggle them and set a timeout to close them after 5 seconds of no input
    toggleControls();
    controlsTimeout = setTimeout(() => hideControls(), 5000);
}

function toggleControls() {
    // Toggle player controls
    document.querySelector('.player-controls').classList.toggle('hidden');
    // Toggle image size
    [...document.querySelectorAll('.cover-photo')].forEach(element => element.classList.toggle('minimised'));
}

function hideControls() {
    // Toggle player controls
    document.querySelector('.player-controls').classList.add('hidden');
    // Toggle image size
    [...document.querySelectorAll('.cover-photo')].forEach(element => element.classList.remove('minimised'));
}

/**
 * An event triggered by scrubbing on the track timeline
 */
function trackScrubbing() {
    trackSeeking = true;
}

/**
 * An event triggered by the conclusion of scrubbing the track timeline
 * 
 * @param {Event} event 
 */
function trackScrubbed(event) {
    keepControlsOpen(event);
    trackSeeking = false;
    // Request the seek from the server
    socket.send(JSON.stringify({ side: 'client', event: 'trackSeeked', time: event.target.value * 1000 }));
}

function nextTrack(event) {
    keepControlsOpen(event);
    socket.send(JSON.stringify({ side: 'client', event: 'nextTrack' }));
}

function previousTrack(event) {
    keepControlsOpen(event);
    socket.send(JSON.stringify({ side: 'client', event: 'previousTrack' }));
}

function togglePause(event, element) {
    keepControlsOpen(event);

    // Check current state (use includes as textcontent may have whitespace)
    if (element.textContent.includes('pause')) {
        element.textContent = 'play_arrow';
        socket.send(JSON.stringify({ side: 'client', event: 'playbackPaused' }));
    } else {
        element.textContent = 'pause';
        socket.send(JSON.stringify({ side: 'client', event: 'playbackResumed' }));
    }
}

/**
 * Prevents a pointer event from propagating and closing the controls and also resets the timeout to keep the controls open
 * 
 * @param {Event} event The pointer event that was triggered on the button that called this function
 */
function keepControlsOpen(event) {
    // Prevent the controls from closing
    event.stopPropagation();
    // Reset the timeout
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => hideControls(), 5000);
}