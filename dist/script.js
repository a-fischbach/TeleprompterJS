"use strict";
// Constants for localStorage keys
const STORAGE_KEYS = {
    SCROLL_SPEED: "teleprompter_scroll_speed",
    FONT_SIZE: "teleprompter_font_size",
};
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("file-input");
    const fileInputLabel = document.getElementById("file-input-label");
    const textContent = document.getElementById("text-content");
    const playPauseButton = document.getElementById("play-pause");
    const speedUpButton = document.getElementById("speed-up");
    const speedDownButton = document.getElementById("speed-down");
    const speedDisplay = document.getElementById("speed-display");
    const fontSizeDisplay = document.getElementById("font-size-display");
    const fontSizeUpButton = document.getElementById("font-size-up");
    const fontSizeDownButton = document.getElementById("font-size-down");
    const scrollContainer = document.querySelector(".scroll-container");
    const mirrorButton = document.getElementById("mirror");
    if (!fileInput ||
        !fileInputLabel ||
        !textContent ||
        !playPauseButton ||
        !speedUpButton ||
        !speedDownButton ||
        !speedDisplay ||
        !fontSizeDisplay ||
        !fontSizeUpButton ||
        !fontSizeDownButton ||
        !scrollContainer ||
        !mirrorButton) {
        console.error("Required DOM elements not found");
        return;
    }
    let scrollSpeed = loadScrollSpeed();
    let isPlaying = false;
    let isMirrored = false;
    let scrollInterval;
    let manualScrollInterval;
    let keysPressed = {};
    let fontSize = loadFontSize();
    // Load preferences from localStorage
    function loadScrollSpeed() {
        const saved = localStorage.getItem(STORAGE_KEYS.SCROLL_SPEED);
        return saved ? parseFloat(saved) : 1.0;
    }
    function loadFontSize() {
        const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
        return saved ? parseInt(saved) : 24;
    }
    // Save preferences to localStorage
    function saveScrollSpeed(speed) {
        localStorage.setItem(STORAGE_KEYS.SCROLL_SPEED, speed.toString());
    }
    function saveFontSize(size) {
        localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size.toString());
    }
    // Apply loaded preferences to UI
    speedDisplay.textContent = `${scrollSpeed.toFixed(1)}x`;
    textContent.style.fontSize = `${fontSize}px`;
    fontSizeDisplay.textContent = `${fontSize}px`;
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
    function calculateCenterOffset() {
        // Calculate total height of content and container
        const totalHeight = textContent.offsetHeight;
        const containerHeight = scrollContainer.offsetHeight;
        const maxScroll = totalHeight - containerHeight;
        const centerOffset = containerHeight / 2;
        return { maxScroll, centerOffset };
    }
    function displayContent(content) {
        // Process the content - replace new lines with <p> tags
        const formattedContent = content
            .split("\n\n") // Split on empty lines
            .map((paragraph) => paragraph.trim())
            .filter((paragraph) => paragraph.length > 0) // Remove empty paragraphs
            .map((paragraph) => `<p>${paragraph}</p>`)
            .join("");
        textContent.innerHTML = formattedContent;
        const { maxScroll, centerOffset } = calculateCenterOffset();
        // Set initial position to center (red line) by offsetting by half the container height
        textContent.style.transform = `translateY(${centerOffset}px)`;
        // Enable controls
        playPauseButton.removeAttribute("disabled");
        mirrorButton.removeAttribute("disabled");
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
    // Font size controls
    fontSizeUpButton.addEventListener("click", () => {
        adjustFontSize(2);
    });
    fontSizeDownButton.addEventListener("click", () => {
        adjustFontSize(-2);
    });
    function adjustSpeed(delta) {
        scrollSpeed = Math.max(0.1, Math.min(5.0, scrollSpeed + delta));
        scrollSpeed = parseFloat(scrollSpeed.toFixed(1)); // Round to 1 decimal place
        speedDisplay.textContent = `${scrollSpeed.toFixed(1)}x`;
        saveScrollSpeed(scrollSpeed); // Save to localStorage
        if (isPlaying) {
            startScrolling(); // Restart scrolling with new speed
        }
        if (manualScrollInterval) {
            clearInterval(manualScrollInterval);
            startManualScroll(); // Restart manual scrolling with new speed
        }
    }
    function adjustFontSize(delta) {
        fontSize = Math.max(12, Math.min(72, fontSize + delta)); // Limit font size between 12px and 72px
        textContent.style.fontSize = `${fontSize}px`;
        fontSizeDisplay.textContent = `${fontSize}px`;
        saveFontSize(fontSize); // Save to localStorage
        // Recalculate center offset after font size change
        const { maxScroll, centerOffset } = calculateCenterOffset();
        // Apply the new center offset while preserving any existing mirroring
        textContent.style.transform = isMirrored
            ? `translateY(${-maxScroll - centerOffset}px) scaleX(-1) rotate(180deg)`
            : `translateY(${centerOffset}px)`;
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
        const { maxScroll, centerOffset } = calculateCenterOffset();
        // For mirrored text, we need to invert the scroll direction
        const adjustedAmount = isMirrored ? -amount : amount;
        // Check boundaries with proper center offset consideration
        if (adjustedAmount < 0 &&
            Math.abs(currentY - Math.abs(adjustedAmount)) >= totalHeight - containerHeight + centerOffset) {
            // Don't scroll past the bottom
            return false;
        }
        else if (adjustedAmount > 0 && currentY + adjustedAmount > centerOffset) {
            // Don't scroll past the top
            return false;
        }
        // Move content with mirroring and rotation if enabled
        textContent.style.transform = isMirrored
            ? `translateY(${currentY + adjustedAmount}px) scaleX(-1) rotate(180deg)`
            : `translateY(${currentY + adjustedAmount}px)`;
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
    // Mirror functionality
    mirrorButton.addEventListener("click", toggleMirror);
    function toggleMirror() {
        isMirrored = !isMirrored;
        mirrorButton.textContent = isMirrored ? "Unmirror" : "Mirror";
        const { maxScroll, centerOffset } = calculateCenterOffset();
        // Set initial position - start at center (red line) in both modes
        textContent.style.transform = isMirrored
            ? `translateY(${-maxScroll - centerOffset}px) scaleX(-1) rotate(180deg)`
            : `translateY(${centerOffset}px)`;
        fileInputLabel.style.transform = isMirrored ? `scaleX(-1) rotate(180deg)` : `scaleX(1)`;
        mirrorButton.style.transform = isMirrored ? `scaleX(-1) rotate(180deg)` : `scaleX(1)`;
        playPauseButton.style.transform = isMirrored ? `scaleX(-1) rotate(180deg)` : `scaleX(1)`;
        fontSizeDisplay.style.transform = isMirrored ? `scaleX(-1) rotate(180deg)` : `scaleX(1)`;
        speedDisplay.style.transform = isMirrored ? `scaleX(-1) rotate(180deg)` : `scaleX(1)`;
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
                adjustFontSize(2); // Increase font size by 2px
                break;
            case "a": // H button (scroll up)
                adjustFontSize(-2); // Decrease font size by 2px
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
                toggleMirror();
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
    // Mouse wheel scrolling
    scrollContainer.addEventListener("wheel", (event) => {
        event.preventDefault();
        // Adjust scroll speed based on wheel delta
        const scrollAmount = event.deltaY * 0.5;
        scrollText(-scrollAmount);
    });
    // Touch scrolling
    let touchStartY = 0;
    let lastTouchY = 0;
    scrollContainer.addEventListener("touchstart", (event) => {
        touchStartY = event.touches[0].clientY;
        lastTouchY = touchStartY;
    });
    scrollContainer.addEventListener("touchmove", (event) => {
        event.preventDefault();
        const currentY = event.touches[0].clientY;
        const deltaY = lastTouchY - currentY;
        lastTouchY = currentY;
        // Adjust scroll speed based on touch movement
        const scrollAmount = deltaY * 0.5;
        scrollText(-scrollAmount);
    });
    // Initialize with controls disabled until file is loaded
    playPauseButton.setAttribute("disabled", "true");
    mirrorButton.setAttribute("disabled", "true");
});
