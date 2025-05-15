document.addEventListener("DOMContentLoaded", () => {
	const fileInput = document.getElementById("file-input");
	const textContent = document.getElementById("text-content");
	const playPauseButton = document.getElementById("play-pause");
	const speedUpButton = document.getElementById("speed-up");
	const speedDownButton = document.getElementById("speed-down");
	const speedDisplay = document.getElementById("speed-display");

	let scrollSpeed = 1.0;
	let isPlaying = false;
	let scrollInterval;
	let manualScrollInterval;
	let keysPressed = {};

	// Remote key mappings
	const remoteKeys = {
		// Physical key = [keyDown, keyUp]
		x: ["y", "t"],
		y: ["u", "f"],
		a: ["h", "r"],
		b: ["j", "n"],
		o: ["o", "g"], // Mirror
		a: ["a", "q"], // Down
		d: ["d", "c"], // Up
		w: ["w", "e"], // Left
		x: ["x", "z"], // Right
	};

	// File handling
	fileInput.addEventListener("change", (event) => {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target.result;
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
		} else {
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
		const containerHeight = document.querySelector(".scroll-container").offsetHeight;

		// Check boundaries
		if (amount < 0 && Math.abs(currentY - Math.abs(amount)) >= totalHeight - containerHeight) {
			// Don't scroll past the bottom
			return false;
		} else if (amount > 0 && currentY + amount > 0) {
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

		manualScrollInterval = setInterval(() => {
			// Check for remote keys that should scroll down
			if (keysPressed["x"] || keysPressed["a"]) {
				scrollText(-scrollSpeed);
			}
			// Check for remote keys that should scroll up
			else if (keysPressed["b"] || keysPressed["d"]) {
				scrollText(scrollSpeed);
			}
		}, 16); // ~60fps
	}

	function stopManualScroll() {
		clearInterval(manualScrollInterval);
		manualScrollInterval = null;
	}

	// Handle remote key mappings
	function handleRemoteKey(key, isKeyDown) {
		// Find which physical key this belongs to
		for (const [physicalKey, [downKey, upKey]] of Object.entries(remoteKeys)) {
			if (isKeyDown && key === downKey) {
				// This is a key down event for a remote key
				keysPressed[physicalKey] = true;
				handleKeyAction(physicalKey, true);
				return true;
			} else if (!isKeyDown && key === upKey) {
				// This is a key up event for a remote key
				delete keysPressed[physicalKey];
				handleKeyAction(physicalKey, false);
				return true;
			}
		}
		return false;
	}

	// Handle actions based on physical keys
	function handleKeyAction(physicalKey, isKeyDown) {
		if (!isKeyDown) {
			// Check if any scroll keys are still pressed
			const scrollKeysPressed = ["x", "a", "b", "d"].some((key) => keysPressed[key]);

			// If no scroll keys are pressed, stop manual scrolling
			if (!scrollKeysPressed) {
				stopManualScroll();
			}
			return;
		}

		// Handle key down actions
		switch (physicalKey) {
			case "x": // Y button (scroll down)
			case "a": // Down button (scroll down)
				if (!manualScrollInterval) {
					startManualScroll();
				}
				break;
			case "b": // J button (scroll up)
			case "d": // Up button (scroll up)
				if (!manualScrollInterval) {
					startManualScroll();
				}
				break;
			case "y": // U button (increase speed)
				adjustSpeed(0.1);
				break;
			case "a": // H button (decrease speed)
				adjustSpeed(-0.1);
				break;
			case "o": // Mirror button (play/pause)
				togglePlayPause();
				break;
		}
	}

	// Keyboard controls
	document.addEventListener("keydown", (event) => {
		// Handle key presses only if text content is loaded
		if (textContent.innerHTML.trim() === "") return;

		// Try to handle as a remote key
		if (handleRemoteKey(event.key, true)) {
			event.preventDefault();
			return;
		}

		// Fall back to regular keyboard controls
		switch (event.key) {
			case " ": // Space bar
				event.preventDefault();
				togglePlayPause();
				break;
			case "ArrowUp":
				event.preventDefault();
				adjustSpeed(0.1);
				break;
			case "ArrowDown":
				event.preventDefault();
				adjustSpeed(-0.1);
				break;
		}
	});

	document.addEventListener("keyup", (event) => {
		// Try to handle as a remote key
		if (handleRemoteKey(event.key, false)) {
			event.preventDefault();
			return;
		}
	});

	// Initialize with controls disabled until file is loaded
	playPauseButton.setAttribute("disabled", "true");
});
