# librespot4pi
# A frontend for librespot java, designed to run on raspberry pi
## Hardware
Raspberry Pi 4 (1GB)\
Raspberry Pi 7" Touch Display\
[OPT] POE HAT\
[OPT] DAC+ HAT
## Applicaton/Intention
This is intented to be used on premises that are impractical to be tied to a certain Spotify account (Like a public space or workplace).\
Using Spotify Connect with Librespot, anyone can connect to the device and navigate it (ideally) like a Google Nest Hub.\
Due to the use of the amazing [librespot-java](https://github.com/librespot-org/librespot-java), play/pause/seeks from the ui are more responsive than the Spotify phone app!
## Progress
Currently most of the core UI has been constructed, extra features like the user's playlists and search functionality has not yet been completed.\
Code may (or may not) yet be available on the repo, likewise for a disk image/container.\
Expect this to be in a usable state by early 2023.
## Demo 
![Image of the connect page](https://github.com/roundsToThree/librespot4pi/blob/main/demo0.jpg?raw=true)
![Image of a song playing](https://github.com/roundsToThree/librespot4pi/blob/main/demo1.jpg?raw=true)
![Image of ui controls](https://github.com/roundsToThree/librespot4pi/blob/main/demo2.jpg?raw=true)
## Software Used
Typescript + NodeJS\
Express framework with EJS\
librespot-java
## Extra config required
Ensure this flag is set to disabled on the chromium browser (Otherwise sliding the range on a touchscreen will go back a page)\
``chrome://flags/#overscroll-history-navigation``
## Credits
[librespot-java](https://github.com/librespot-org/librespot-java)
