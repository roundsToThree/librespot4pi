#!/bin/bash
set -e

# Client Side dependencies (Rasbian dependencies)
clientSideDep=(
    # For Webserver
    "nodejs"
    "npm"

    # For GUI
    "chromium"
    
    # For Boot Screen
    "plymouth"

    # To run GUI applications without a desktop environment
    "xserver-xorg" 
    "x11-xserver-utils"
    "xinit"
    "openbox"
)

serverSideDep=(
    # For Webserver
    "nodejs"
    "npm"

    # For Audio routing
    "pulseaudio"
)

clear

# Note: Ascii art from TAAG and AsciiArtArchive
echo '
██╗     ██╗██████╗ ██████╗ ███████╗███████╗██████╗  ██████╗ ████████╗██╗  ██╗██████╗ ██╗
██║     ██║██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝██║  ██║██╔══██╗██║
██║     ██║██████╔╝██████╔╝█████╗  ███████╗██████╔╝██║   ██║   ██║   ███████║██████╔╝██║
██║     ██║██╔══██╗██╔══██╗██╔══╝  ╚════██║██╔═══╝ ██║   ██║   ██║   ╚════██║██╔═══╝ ██║
███████╗██║██████╔╝██║  ██║███████╗███████║██║     ╚██████╔╝   ██║        ██║██║     ██║
╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝      ╚═════╝    ╚═╝        ╚═╝╚═╝     ╚═╝
Install Script v1.0.0

Please select an installation mode

>                  .----.                                    .----.     
>      .---------. | == |          .---------.               | == |
>      |.-"""""-.| |----|          |.-"""""-.|               |----|
>      ||       || | == |          ||       ||               | == |
>      ||       || |----|          ||       ||               |----|
>      ||-.....-|| |::::|          ||-.....-||               |::::|
>      `"")---(""` |___.|          `"")---(""`               |___.|
>    
>       [ Standalone ]            [ Client Only ]        [ Server Only ]
>  Use for for a single room       Use for multiple rooms with speakers
>                                      connected to a central area

Type:
1 for Standalone
2 for Client Only
3 for Server Only
Install Option:'

# Prompt for installation type

read INSTALL_TYPE
until [ $INSTALL_TYPE -ge 1 -a $INSTALL_TYPE -le 3 ]
do
    echo 'Invalid option (Valid options are between 1 and 3 inclusive)';
    read INSTALL_TYPE;
done

echo 'Set a unique name for this device (How it will appear to other devices on the network)
Avoid spaces and special characters'
read HOSTNAME
sudo hostnamectl set-hostname $HOSTNAME

echo 'For remote access and higher security, set a password for the default user'
sudo passwd


# Install required packages from apt
echo "Updating package repo";
sudo apt update --yes --force-yes 
sudo apt upgrade --yes --force-yes 

# If InstallType is 1 or 2, install client dependencies
if [ $INSTALL_TYPE -le 2 ];
then
    # Prompt user to assign room name
    echo 'Assign a unique name for this room (This name must exactly match what is in the server config)'
    read ROOM_NAME

    sudo apt install --yes --force-yes  ${clientSideDep[@]}
    for package in ${clientSideDep[@]}; 
    do
        echo "Installing ${package}";
    done
fi


# If InstallType is not 2, install server dependencies
if [ $INSTALL_TYPE -ne 2 ];
then
    sudo apt install --yes --force-yes ${serverSideDep[@]}

    for package in ${serverSideDep[@]}; 
    do
        echo "Installing ${package}";
    done

    # Configure server to launch at startup
    echo "(cd $PWD; bash startServer.sh) &" >> ~/.bashrc

fi



# Configure pi for client side use
if [ $INSTALL_TYPE -le 2 ];
then
    # Commands from these sources
    # https://raspberrypi.stackexchange.com/a/59311
    # https://raspberrypi.stackexchange.com/a/73389
    echo "Configuring client side environment"

    # Modify /boot/cmdline.txt to remove boot messages
    sudo sed -i -e 's/console=tty1/console=tty3/' -e '$ s/$/ quiet splash loglevel=0 logo.nologo vt.global_cursor_default=0 fbcon=map:10 plymouth.ignore-serial-consoles/' /boot/cmdline.txt

    # Modify /etc/rc.local
    sudo sed -i -e 's/exit 0/# exit 0/' /etc/rc.local
    sudo echo '# Suppress Kernel Messages' >> /etc/rc.local
    sudo echo 'dmesg --console-off' >> /etc/rc.local
    sudo echo 'exit 0' >> /etc/rc.local
    
    # Add hushlogin
    sudo touch ~/.hushlogin

    # Disable splash screen
    sudo echo 'disable_splash=1' >> /boot/config.txt

    # Setting up Plymouth
    sudo update-initramfs -c -k $(uname -r);

    # Update initramfs in config.txt
    sudo echo "initramfs $(cd /boot && ls -t | grep img | head -n 1)" >> /boot/config.txt

    # Add initramfs modules
    # TODO: Confirm that these are actually needed as they appear to be specific LCD drivewrs
    echo 'fbtft' | sudo tee -a /etc/initramfs-tools/modules
    echo 'fbtft_device name=hy28a verbose=0' | sudo tee -a /etc/initramfs-tools/modules
    echo 'fb_ili9320' | sudo tee -a /etc/initramfs-tools/modules

    # Configure Plymouth
    # TODO: Handle fb0 which is needed for rpi2
    echo "export FRAMEBUFFER=/dev/fb1" | sudo tee /etc/initramfs-tools/conf.d/fb1
    sudo plymouth-set-default-theme text
    sudo update-initramfs -u

    # Configure browser to open at boot
    echo "(cd $PWD; bash startGUI.sh) &" >> ~/.bashrc

fi

# Configure auto-login
sudo systemctl set-default multi-user.target
sudo ln -fs /lib/systemd/system/getty@.service /etc/systemd/system/getty.target.wants/getty@tty1.service
echo '[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I \$TERM' | sudo tee -a  /etc/systemd/system/getty@tty1.service.d/autologin.conf

echo 'Installation complete, If you are installing this as "Standalone" or "Server", ensure you modify "src/config.json" to reflect your configuration before starting.
Once you are ready, restart to put changes into effect'
