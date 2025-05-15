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
			// Get current transform
			const currentTransform = window.getComputedStyle(textContent).transform;
			const matrix = new DOMMatrix(currentTransform);
			const currentY = matrix.m42;

			// Calculate total height of content and container
			const totalHeight = textContent.offsetHeight;
			const containerHeight = document.querySelector(".scroll-container").offsetHeight;

			// Stop scrolling if we reach the end
			if (Math.abs(currentY) >= totalHeight - containerHeight) {
				stopScrolling();
				isPlaying = false;
				playPauseButton.textContent = "Play";
				return;
			}

			// Move content up by scrollSpeed pixels
			textContent.style.transform = `translateY(${currentY - scrollSpeed}px)`;
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
	}

	// Manual scroll functions
	function scrollUp(amount = 30) {
		// Get current transform
		const currentTransform = window.getComputedStyle(textContent).transform;
		const matrix = new DOMMatrix(currentTransform);
		const currentY = matrix.m42;

		// Move content down (scrolls text up)
		textContent.style.transform = `translateY(${currentY + amount}px)`;
	}

	function scrollDown(amount = 30) {
		// Get current transform
		const currentTransform = window.getComputedStyle(textContent).transform;
		const matrix = new DOMMatrix(currentTransform);
		const currentY = matrix.m42;

		// Calculate total height of content and container
		const totalHeight = textContent.offsetHeight;
		const containerHeight = document.querySelector(".scroll-container").offsetHeight;

		// Don't scroll past the bottom
		if (Math.abs(currentY - amount) >= totalHeight - containerHeight) {
			return;
		}

		// Move content up (scrolls text down)
		textContent.style.transform = `translateY(${currentY - amount}px)`;
	}

	// Keyboard controls
	document.addEventListener("keydown", (event) => {
		// Handle key presses only if text content is loaded
		if (textContent.innerHTML.trim() === "") return;

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
				scrollDown();
				break;
			case "j":
			case "J":
				event.preventDefault();
				scrollUp();
				break;
			case "q":
			case "Q":
				event.preventDefault();
				togglePlayPause();
				break;
		}
	});

	// Initialize with controls disabled until file is loaded
	playPauseButton.setAttribute("disabled", "true");
});
