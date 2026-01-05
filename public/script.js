document.addEventListener("DOMContentLoaded", () => {
  const trendsList = document.getElementById("trends-list");
  const selectedTrendDisplay = document.getElementById("selected-trend");
  const jackBtn = document.getElementById("jack-btn");
  const brandInput = document.getElementById("brand-context");

  // Progress Elements
  const progressContainer = document.getElementById("progress-container");
  const progressStatus = document.getElementById("progress-status");
  const progressPercent = document.getElementById("progress-percent");
  const progressFill = document.getElementById("progress-fill");
  const emptyState = document.getElementById("empty-state");
  const generatedContent = document.getElementById("generated-content");
  const memeImage = document.getElementById("meme-image");
  const downloadLink = document.getElementById("download-link");

  let currentHeadline = null;

  // Fetch Trends on Load
  fetchTrends();

  async function fetchTrends() {
    try {
      const response = await fetch("/api/trends");
      const trends = await response.json();

      trendsList.innerHTML = ""; // Clear loading

      trends.forEach((trend, index) => {
        const div = document.createElement("div");
        div.className = "trend-item";
        div.textContent = trend.title;
        div.dataset.headline = trend.title;

        div.addEventListener("click", () => {
          selectTrend(div, trend.title);
        });

        trendsList.appendChild(div);
      });
    } catch (error) {
      trendsList.innerHTML =
        '<div class="error">Failed to load trends. Is the server running?</div>';
      console.error(error);
    }
  }

  function selectTrend(element, headline) {
    // Remove active class from all
    document
      .querySelectorAll(".trend-item")
      .forEach((el) => el.classList.remove("selected"));
    // Add to clicked
    element.classList.add("selected");

    currentHeadline = headline;
    selectedTrendDisplay.textContent = headline;
    checkButtonState();
  }

  brandInput.addEventListener("input", checkButtonState);

  function checkButtonState() {
    if (currentHeadline && brandInput.value.trim().length > 0) {
      jackBtn.disabled = false;
    } else {
      jackBtn.disabled = true;
    }
  }

  jackBtn.addEventListener("click", async () => {
    const brandContext = brandInput.value.trim();
    const aspectRatio = document.getElementById("aspect-ratio").value;
    const resolution = document.getElementById("resolution").value;

    if (!currentHeadline || !brandContext) return;

    // Reset UI State
    jackBtn.textContent = "Generating...";
    jackBtn.disabled = true;

    emptyState.classList.add("hidden");
    generatedContent.classList.add("hidden");
    progressContainer.classList.remove("hidden");

    // Step 0: Start
    updateProgress(10, "Analyzing trend and brand context...");

    try {
      // Step 1: Generate Prompt
      const promptResponse = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: currentHeadline,
          brand: brandContext,
        }),
      });

      if (!promptResponse.ok) throw new Error("Failed to generate prompt");
      const promptData = await promptResponse.json();

      updateProgress(50, "Dreaming up a visual concept...");

      // Step 2: Generate Image
      const imageResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptData.prompt,
          aspectRatio,
          resolution,
        }),
      });

      if (!imageResponse.ok) throw new Error("Failed to generate image");
      const imageData = await imageResponse.json();

      updateProgress(90, "Finishing touches...");

      if (imageData.url) {
        // Small delay to let user see 90%
        setTimeout(() => {
          updateProgress(100, "Done!");
          setTimeout(() => {
            showMeme(imageData.url);
          }, 500);
        }, 500);
      } else {
        throw new Error("No image URL returned");
      }
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
      // Reset to empty state or previous state on error
      resetUI();
    } finally {
      jackBtn.textContent = "Jack this Trend";
      jackBtn.disabled = false;
    }
  });

  function updateProgress(percent, text) {
    progressFill.style.width = `${percent}%`;
    if (text) progressStatus.textContent = text;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
  }

  function resetUI() {
    progressContainer.classList.add("hidden");
    emptyState.classList.remove("hidden");
  }

  function showMeme(url) {
    memeImage.src = url;
    downloadLink.href = url;

    // Toggle UI state
    progressContainer.classList.add("hidden");
    generatedContent.classList.remove("hidden");
  }
});
