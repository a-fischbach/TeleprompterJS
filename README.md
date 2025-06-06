# Teleprompter JS

A simple teleprompter application built with vanilla JavaScript, HTML, and CSS. Designed to work well on older iPads and support Bluetooth keyboard controls.

## Features

-   Load and display text files (.txt)
-   Adjustable scroll speed
-   Play/pause functionality
-   Support for remote control and keyboard controls:
    -   Remote Control:
        -   X Button (Y/T): Scroll Down
        -   B Button (J/N): Scroll Up
        -   Y Button (U/F): Increase Speed
        -   A Button (H/R): Decrease Speed
        -   Mirror Button (O/G): Play/Pause
        -   Down Button (A/Q): Scroll Down
        -   Up Button (D/C): Scroll Up
    -   Keyboard Controls:
        -   Space: Play/Pause
        -   Up Arrow: Increase Speed
        -   Down Arrow: Decrease Speed
-   Mobile-optimized for iPad usage
-   Visual marker for current reading position

## Usage

1. Open `index.html` in your web browser
2. Click "Open Text File" to load a .txt document
3. Press "Play" to begin scrolling text
4. Adjust scroll speed with "+" and "-" buttons
5. Use remote control or keyboard controls for hands-free operation

## iPad Setup

1. Transfer the files to your iPad using a file transfer app or by hosting them on a local web server
2. Open the `index.html` file in Safari
3. Connect your Bluetooth keyboard or remote control
4. For a better experience, add the page to your home screen:
    - Tap the Share button
    - Select "Add to Home Screen"
    - Now you can open the teleprompter in fullscreen mode

## Compatible Browsers

-   Safari (iOS 9+)
-   Chrome
-   Firefox

## Notes for Older iPads

-   Performance may vary on older iPad models
-   For best results, keep text files under 1MB
-   Close other applications to ensure smooth scrolling
