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
			if (keysPressed["y"] || keysPressed["Y"]) {
				scrollText(-scrollSpeed);
			} else if (keysPressed["j"] || keysPressed["J"]) {
				scrollText(scrollSpeed);
			}
		}, 16); // ~60fps
	}

	function stopManualScroll() {
		clearInterval(manualScrollInterval);
		manualScrollInterval = null;
	}

	// Keyboard controls
	document.addEventListener("keydown", (event) => {
		// Handle key presses only if text content is loaded
		if (textContent.innerHTML.trim() === "") return;

		// Track pressed keys
		keysPressed[event.key] = true;

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
			case "y":
			case "Y":
				event.preventDefault();
				if (!manualScrollInterval) {
					startManualScroll();
				}
				break;
			case "j":
			case "J":
				event.preventDefault();
				if (!manualScrollInterval) {
					startManualScroll();
				}
				break;
			case "q":
			case "Q":
				event.preventDefault();
				togglePlayPause();
				break;
		}
	});

	document.addEventListener("keyup", (event) => {
		// Remove key from pressed keys
		delete keysPressed[event.key];

		// If both Y and J are released, stop manual scrolling
		if (
			(event.key === "y" || event.key === "Y" || event.key === "j" || event.key === "J") &&
			!keysPressed["y"] &&
			!keysPressed["Y"] &&
			!keysPressed["j"] &&
			!keysPressed["J"]
		) {
			stopManualScroll();
		}
	});

	// Initialize with controls disabled until file is loaded
	playPauseButton.setAttribute("disabled", "true");
});
