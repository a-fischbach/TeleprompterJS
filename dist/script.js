"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("file-input");
    const textContent = document.getElementById("text-content");
    const playPauseButton = document.getElementById("play-pause");
    const speedUpButton = document.getElementById("speed-up");
    const speedDownButton = document.getElementById("speed-down");
    const speedDisplay = document.getElementById("speed-display");
    const scrollContainer = document.querySelector(".scroll-container");
    if (!fileInput ||
        !textContent ||
        !playPauseButton ||
        !speedUpButton ||
        !speedDownButton ||
        !speedDisplay ||
        !scrollContainer) {
        console.error("Required DOM elements not found");
        return;
    }
    let scrollSpeed = 1.0;
    let isPlaying = false;
    let scrollInterval;
    let manualScrollInterval;
    let keysPressed = {};
    // Remote key mappings
    const remoteKeys = {
        // Physical key = [keyDown, keyUp]
        x: { down: "y", up: "t" },
        y: { down: "u", up: "f" },
        a: { down: "h", up: "r" },
        b: { down: "j", up: "n" },
        mirror: { down: "o", up: "g" }, // Mirror
        arrowLeft: { down: "a", up: "q" }, // Down
        arrowRight: { down: "d", up: "c" }, // Up
        arrowUp: { down: "w", up: "e" }, // Left
        arrowDown: { down: "x", up: "z" }, // Right
    };
    // File handling
    fileInput.addEventListener("change", (event) => {
        var _a;
        const inputEvent = event;
        const file = (_a = inputEvent.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileEvent = e;
            const content = fileEvent.target.result;
            displayContent(content);
        };
        reader.readAsText(file);
    });
    function displayContent(content) {
        // Process the content - replace new lines with <p> tags
        const formattedContent = content
            .split("\n\n") // Split on empty lines
            .map((paragraph) => paragraph.trim())
            .filter((paragraph) => paragraph.length > 0) // Remove empty paragraphs
            .map((paragraph) => `<p>${paragraph}</p>`)
            .join("");
        textContent.innerHTML = formattedContent;
        // Reset scroll position
        textContent.style.transform = "translateY(0)";
        // Enable controls
        playPauseButton.removeAttribute("disabled");
    }
    // Play/Pause functionality
    playPauseButton.addEventListener("click", togglePlayPause);
    function togglePlayPause() {
        isPlaying = !isPlaying;
        playPauseButton.textContent = isPlaying ? "Pause" : "Play";
        if (isPlaying) {
            startScrolling();
        }
        else {
            stopScrolling();
        }
    }
    function startScrolling() {
        stopScrolling(); // Clear any existing interval
        scrollInterval = setInterval(() => {
            // If scrolling fails (hit a boundary), stop auto-scrolling
            if (!scrollText(-scrollSpeed)) {
                stopScrolling();
                isPlaying = false;
                playPauseButton.textContent = "Play";
            }
        }, 16); // ~60fps
    }
    function stopScrolling() {
        clearInterval(scrollInterval);
    }
    // Speed controls
    speedUpButton.addEventListener("click", () => {
        adjustSpeed(0.1);
    });
    speedDownButton.addEventListener("click", () => {
        adjustSpeed(-0.1);
    });
    function adjustSpeed(delta) {
        scrollSpeed = Math.max(0.1, Math.min(5.0, scrollSpeed + delta));
        scrollSpeed = parseFloat(scrollSpeed.toFixed(1)); // Round to 1 decimal place
        speedDisplay.textContent = `${scrollSpeed.toFixed(1)}x`;
        if (isPlaying) {
            startScrolling(); // Restart scrolling with new speed
        }
        if (manualScrollInterval) {
            clearInterval(manualScrollInterval);
            startManualScroll(); // Restart manual scrolling with new speed
        }
    }
    // Scroll text function - reused by both auto and manual scrolling
    function scrollText(amount) {
        // Get current transform
        const currentTransform = window.getComputedStyle(textContent).transform;
        const matrix = new DOMMatrix(currentTransform);
        const currentY = matrix.m42;
        // Calculate total height of content and container
        const totalHeight = textContent.offsetHeight;
        const containerHeight = scrollContainer.offsetHeight;
        // Check boundaries
        if (amount < 0 && Math.abs(currentY - Math.abs(amount)) >= totalHeight - containerHeight) {
            // Don't scroll past the bottom
            return false;
        }
        else if (amount > 0 && currentY + amount > 0) {
            // Don't scroll past the top
            return false;
        }
        // Move content
        textContent.style.transform = `translateY(${currentY + amount}px)`;
        return true;
    }
    // Manual scroll functions with key hold support
    function startManualScroll() {
        clearInterval(manualScrollInterval);
        console.log("keysPressed", keysPressed);
        manualScrollInterval = setInterval(() => {
            // Check for remote keys that should scroll down
            if (keysPressed["arrowRight"]) {
                scrollText(-scrollSpeed);
            }
            // Check for remote keys that should scroll up
            else if (keysPressed["arrowLeft"]) {
                scrollText(scrollSpeed);
            }
        }, 16); // ~60fps
    }
    function stopManualScroll() {
        clearInterval(manualScrollInterval);
        manualScrollInterval = undefined;
    }
    // Handle remote key mappings
    function handleRemoteKey(key, isKeyDown) {
        // Find which physical key this belongs to
        for (const [physicalKey, binding] of Object.entries(remoteKeys)) {
            if (binding.down === key) {
                keysPressed[physicalKey] = isKeyDown;
                handleKeyAction(physicalKey, isKeyDown);
                return;
            }
            if (binding.up === key) {
                keysPressed[physicalKey] = false;
                handleKeyAction(physicalKey, false);
                return;
            }
        }
    }
    // Handle actions based on physical keys
    function handleKeyAction(physicalKey, isKeyDown) {
        console.log("key", physicalKey, "isKeyDown", isKeyDown);
        if (!isKeyDown) {
            // Check if any scroll keys are still pressed
            const scrollKeysPressed = ["arrowRight", "arrowLeft"].some((key) => keysPressed[key]);
            // If no scroll keys are pressed, stop manual scrolling
            if (!scrollKeysPressed) {
                stopManualScroll();
            }
            return;
        }
        // Handle key down actions
        switch (physicalKey) {
            case "x": // Y button (scroll down)
                adjustSpeed(0.1);
                break;
            case "y": // U button (scroll down)
                //increase font size
                break;
            case "a": // H button (scroll up)
                //decrease font size
                break;
            case "b": // J button (scroll up)
                adjustSpeed(-0.1);
                break;
            case "arrowLeft": // W button (scroll left)
                if (!manualScrollInterval) {
                    startManualScroll();
                }
                break;
            case "arrowRight": // X button (scroll right)
                if (!manualScrollInterval) {
                    startManualScroll();
                }
                break;
            case "arrowDown": // A button (increase speed)
                togglePlayPause();
                break;
            case "arrowUp": // D button (decrease speed)
                togglePlayPause();
                break;
            case "mirror": // O button (play/pause)
                //mirror the text
                break;
        }
    }
    // Keyboard controls
    document.addEventListener("keydown", (event) => {
        // Handle key presses only if text content is loaded
        if (textContent.innerHTML.trim() === "")
            return;
        // Try to handle as a remote key
        handleRemoteKey(event.key, true);
        if (Object.values(remoteKeys).some((binding) => binding.down === event.key || binding.up === event.key)) {
            event.preventDefault();
            return;
        }
        // Fall back to regular keyboard controls
        switch (event.key) {
            case " ": // Space bar
                event.preventDefault();
                togglePlayPause();
                break;
        }
    });
    document.addEventListener("keyup", (event) => {
        // Try to handle as a remote key
        handleRemoteKey(event.key, false);
        if (Object.values(remoteKeys).some((binding) => binding.down === event.key || binding.up === event.key)) {
            event.preventDefault();
            return;
        }
    });
    scrollContainer.addEventListener("click", (event) => {
        console.log("scroll", event);
    });
    // Initialize with controls disabled until file is loaded
    playPauseButton.setAttribute("disabled", "true");
});
