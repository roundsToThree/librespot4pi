
// Open a websocket to the server to communicate on
socket = new WebSocket('ws://' + window.location.hostname + ':5001');

socket.onopen = function (e) {
    console.dir("[open] Connection established");
};

let timelineInterval;
let lastTrackTime = 0, lastTrackPause, trackPaused = false, trackDuration = 1;

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
                if (trackPaused) {
                    lastTrackPause = Date.now();
                    return;
                }
                const currentTrackTime = lastTrackTime + (Date.now() - lastTrackPause);
                startingTime.textContent = createTimeIntervalString(currentTrackTime / 1000);
                trackScrubber.value = currentTrackTime / trackDuration * 100;
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
            trackDuration = data.metadata.duration;
            duration.textContent = createTimeIntervalString(trackDuration / 1000);
            albumName.textContent = data.metadata.albumName;

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
    }
};

socket.onclose = function (event) {
    console.dir(`[close] Connection closed, code=${event.code} reason=${event.reason}`);

};

socket.onerror = function (error) {
    console.dir(`[error]`);
};

function setBackgroundImage(url, imagesContainer, className) {
    // Check if background is dfferent
    if (imagesContainer.querySelector('.selected').src === url)
        return;
    // Clear any unselected images
    [...imagesContainer.children].forEach((item) => {
        if (item.classList.contains('selected')) item.classList.remove('selected')
        else item.remove()
    });

    // Add a new image to be selected
    const image = document.createElement('img');
    image.src = url;
    image.classList.add(className);
    image.setAttribute('crossorigin', 'anonymous');
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

function toggleControls() {
    // Toggle player controls
    document.querySelector('.player-controls').classList.toggle('hidden');
    // Toggle image size
    [...document.querySelectorAll('.cover-photo')].forEach(element => element.classList.toggle('minimised'));
}