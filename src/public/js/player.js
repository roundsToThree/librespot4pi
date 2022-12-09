
// Open a websocket to the server to communicate on
socket = new WebSocket('ws://' + window.location.hostname + ':5001');

socket.onopen = function (e) {
    console.dir("[open] Connection established");
};

let timelineInterval;

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.event) {
        case 'trackChanged':
            // Set the song to start now
            clearInterval(timelineInterval);

            const startingTime = document.getElementById('timelineCurrent')
            
            timelineInterval = setInterval(() => {
                startingTime.textContent = createTimeIntervalString((data.time - Date.now())/1000)
            }, 500);
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
            startingTime.textContent
            duration.textContent = data.metadata.duration; albumName.textContent = data.metadata.albumName;

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
    output = fixLength(time) % 60;
    time /= 60;
    output = fixLength(time) % 60 + ':' + output;
    time /= 60;
    if (time >= 1)
    output = fixLength(time) + ':' + output';
    
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
    return Math.round(number).toLocaleString(undefined, {minimumIntegerDigits: digits})
}