# librespot4pi
# ⚡ The most affordable, free multi-room Spotify compatible sound system 🎶
> An experience like using a Google Nest Hub but with multi-room!

Play Spotify through any speaker just by connecting through the Spotify app on your phone! - No Sign-In Required!\
Capable of running headless, through a UI on your phone or with a dedicated in-wall touch screen, control the music from anywhere and synchronise your music with other rooms **without needing another Raspberry Pi**. Unlike most Spotify players for the Pi, you can run as many instances and rooms from a single pi by changing the config and adding another USB sound adaptor, no need to spend $100 for an extra room! With simple in-app controls, change what rooms can listen to what on demand and change the volume for your zone independent of other rooms.\
Using the amazing [Librespot-java](https://github.com/librespot-org/librespot-java) as the "backend" for the Spotify service, song changes and touch screen interactions happen near instantaneously.
## Why do I need this?
If you want music in your house, office, or any communal space, allow your friends to join in playing their music in their area or in sync with your music everywhere!\
With no sign-in needed, any sessions are temporary and its perfect for the next person to start their session once you're done.

## Sounds great, what do I need?
All you need is a Pi, a DAC and an amplifier to drive the speakers!\
If you want an in-wall touchscreen, any compatible display will work\
\
[ Processor ]\
Any Raspberry Pi will work, however I've found the Pi 3 is about the minimum for more than 1 room\
1GB Pis also work well as the headless host for 4 rooms and the in-wall screen, no need to get heaps of memory!\
However, with the Pi 4, there is a limitation with the USB bus such that unless you also use the USB-C Port, you cannot exceed 3 or 4 DACs - This is not such an issue with the Pi 3.\

Alternatively you can use a single core Celeron with 2GB of ram running Ubuntu and get excellent performance, In my case a ThinkCentre M72e.\
It still runs into the same USB Bandwidth limitation as the Pi but you can split a couble DACs into each of the 5 USB Ports onboard.\
\
[ DAC - Digital to Analog Converter ]\
This allows the audio to be outputted from the pi, usually the built in audio should be disabled as its not very good.\
Use any DAC of your choice (That is compatible with the Pi)!\
The official PI DAC HAT (over SPI) works perfectly but if you want to add more outputs, you will need more USB DACs
> Tested DACs
> - Raspberry PI DAC +
> - Generic USB Sound Card from eBay
> - Genuine Apple USB C - 3.5mm Headphone Jack
> - AB13X USB C to Headphone Jack  [Best value for quality]
> 
> **Note! mixing and matching DACs (more than about 3) can lead to stuttering, popping and silence as the Pi's sound server tries to resample for each different configuration. Try to match all to the same bitdepth and sampling rate in software**

\
[ Amplifier ]\
Whatever works for your DAC!\
I use the XH-M543 (Class D) Dual 50W/Mono 100W driver and its pretty good at only $8.50!\
There is also the XH-M180 (Class AB) which is a Quad 50W Mono / Dual Stereo (4 Channel) for around $40 which may be considered for higher fidelity setups.\
You will need one of these per DAC to drive the speakers\
\
[ In-Wall Touch Screen ]\
Both the Official PI Touch Screen and the Generic HDMI touch screen work perfectly fine.\
If you plan on using PoE to power the PI, ensure your screen is within the power budget (You most likely want the PoE+ HAT in this case).

## Installation
🚧 INSTALLATION SCRIPT STILL IN PROGRESS 🚧\
But if you want to setup from scratch: 
- Install Raspbian on a pi (Lite if you dont want a screen running on it)
- Clone this repo
- Download the latest Librespot-java api.jar file (And put it in the `/src` folder)
- Enter the path of the new api.jar file in config @ `/src/config.json`
- Install all node dependencies (and node/npm too!)
- If you want to run a display too, install Chromium
- Edit `/src/config.json` to reflect your setup, the sink is a keyword to identify each USB/SPI sound card, use `pactl list sinks` to find the name of each and use an identifying keyword from the name
- Launch with `npx ts-node src/app.ts` from the repo folder
- If you want to run the screen, start a fullscreen webpage on the pi with the url in the next step (Arguments for chromium are towards the end of this readme)

You can also change /etc/pulse/daemon.conf to set avoid resamplng and resampling to best quality

## Using the Web Interface
Connect to ``http://localhost:5000?room=MyRoom`` where `MyRoom` is the name of your room in `config.json`.\
If you are trying to use the interface from another device, replace `localhost` with the IP of the pi or `librespot.local` if the pi's hostname is set to `librespot`.

## Software Used
Typescript + NodeJS\
Express framework with EJS\
librespot-java

## Development Note
To be honest, I don't think many people will use this, but if any number of people do, I will rewrite this whole app as its not very development friendly (Many changes over many years stacked up to messy code).

## Extra config required
**Arguments (Prefered)**\
Launch Chromium with the following arguments:\
``chromium --kiosk --incognito --disable-pinch --overscroll-history-navigation=0 http://localhost:5000``\
Alternatively you can use flags to launch the browser\
**Flags**\
Ensure this flag is set to disabled on the chromium browser (Otherwise sliding the range on a touchscreen will go back a page)\
``chrome://flags/#overscroll-history-navigation``\
Also set the pinch flag to disabled (broken in older chromium versions)\
``chrome://flags/#enable-pinch``\
**System configuration**\
Also ensure you add this to the xserver config located at ``/etc/lightdm/lightdm.conf``:\
``xserver-command=X -bs -core -nocursor``\
This hides the cursor from the display so that it does not flicker in and out during use.
## Screenshots
![Image of the connect page](https://github.com/roundsToThree/librespot4pi/blob/main/demo0.jpg?raw=true)
![Image of a song playing](https://github.com/roundsToThree/librespot4pi/blob/main/demo1.jpg?raw=true)
## Disclaimer
Not made in partnership with the Librespot team or any other team!\
Everything here is to be attempted at your own risk! Im happy to help if anything goes wrong though during setup but any damage is at your own risk!
## Credits
[librespot-java](https://github.com/librespot-org/librespot-java)
