document.addEventListener("DOMContentLoaded", () => {
  const trendsList = document.getElementById("trends-list");
  const selectedTrendDisplay = document.getElementById("selected-trend");
  const jackBtn = document.getElementById("jack-btn");
  const brandInput = document.getElementById("brand-context");
  const resultArea = document.getElementById("result-area");
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

    jackBtn.textContent = "Generating...";
    jackBtn.disabled = true;

    try {
      const response = await fetch("/api/jack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headline: currentHeadline,
          brand: brandContext,
          aspectRatio,
          resolution,
        }),
      });

      const data = await response.json();

      if (data.url) {
        showMeme(data.url);
      } else {
        alert("Failed to generate meme");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to server");
    } finally {
      jackBtn.textContent = "Jack this Trend";
      jackBtn.disabled = false;
    }
  });

  function showMeme(url) {
    memeImage.src = url;
    downloadLink.href = url;

    // Toggle UI state
    document.getElementById("empty-state").classList.add("hidden");
    document.getElementById("generated-content").classList.remove("hidden");

    // Optional: adding a fade-in effect via class could be done here if CSS supports it
  }
});
