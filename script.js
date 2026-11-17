const audio = document.querySelector("#soundscape");
const sky = document.querySelector("#sky");
const skyline = document.querySelector("#skyline");
const snow = document.querySelector("#snow");
const chapter = document.querySelector("#chapter");
const canvas = document.querySelector("#visualizer");
const context2d = canvas.getContext("2d");
const snowButtons = document.querySelectorAll("[data-snow]");

let audioContext;
let analyser;
let source;
let frequencyData;
let animationId;

function createSnowflakes() {
  snow.innerHTML = "";

  for (let index = 0; index < 90; index += 1) {
    const flake = document.createElement("span");
    const size = 2 + Math.random() * 6;
    const duration = 7 + Math.random() * 11;
    const delay = Math.random() * -18;
    const drift = -55 + Math.random() * 110;

    flake.className = "flake";
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.opacity = `${0.3 + Math.random() * 0.7}`;
    flake.style.setProperty("--size", `${size}px`);
    flake.style.setProperty("--duration", `${duration}s`);
    flake.style.setProperty("--delay", `${delay}s`);
    flake.style.setProperty("--drift", `${drift}px`);
    snow.appendChild(flake);
  }
}

function setupAudioAnalysis() {
  if (audioContext) {
    return;
  }

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.82;
  source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  frequencyData = new Uint8Array(analyser.frequencyBinCount);
}

function updateChapter() {
  const time = audio.currentTime;

  if (time < 14) {
    chapter.textContent = "Wind & first flakes";
  } else if (time < 27) {
    chapter.textContent = "Streetcar bell in the distance";
  } else if (time < 45) {
    chapter.textContent = "Crosswalk signal & footsteps";
  } else if (time < 64) {
    chapter.textContent = "Streetcar passing through snow";
  } else {
    chapter.textContent = "The city grows quiet";
  }
}

function drawVisualizer() {
  const width = canvas.width;
  const height = canvas.height;
  context2d.clearRect(0, 0, width, height);

  if (!analyser || audio.paused) {
    context2d.fillStyle = "rgba(151, 204, 245, 0.24)";
    for (let index = 0; index < 28; index += 1) {
      const barHeight = 12 + (index % 5) * 4;
      context2d.fillRect(index * 33, height - barHeight, 14, barHeight);
    }
    document.documentElement.style.setProperty("--energy", "0");
    return;
  }

  analyser.getByteFrequencyData(frequencyData);
  const average =
    frequencyData.reduce((total, value) => total + value, 0) /
    frequencyData.length;
  const energy = Math.min(1, average / 115);
  document.documentElement.style.setProperty("--energy", energy.toFixed(3));

  const barWidth = width / frequencyData.length;
  frequencyData.forEach((value, index) => {
    const barHeight = 10 + (value / 255) * (height - 18);
    const lightness = 66 + (value / 255) * 24;
    context2d.fillStyle = `hsl(${202 + index * 0.6} 85% ${lightness}%)`;
    context2d.fillRect(index * barWidth, height - barHeight, barWidth - 5, barHeight);
  });

  updateChapter();
  animationId = requestAnimationFrame(drawVisualizer);
}

audio.addEventListener("play", () => {
  setupAudioAnalysis();
  audioContext.resume();
  document.body.classList.add("is-playing");
  cancelAnimationFrame(animationId);
  drawVisualizer();
});

audio.addEventListener("pause", () => {
  document.body.classList.remove("is-playing");
  cancelAnimationFrame(animationId);
  drawVisualizer();
});

audio.addEventListener("ended", () => {
  document.body.classList.remove("is-playing");
  chapter.textContent = "Soundscape complete";
  document.documentElement.style.setProperty("--energy", "0");
});

audio.addEventListener("timeupdate", updateChapter);

sky.addEventListener("pointermove", (event) => {
  const bounds = sky.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  document.documentElement.style.setProperty("--pointer-x", x.toFixed(3));
  document.documentElement.style.setProperty("--pointer-y", y.toFixed(3));
});

sky.addEventListener("pointerleave", () => {
  document.documentElement.style.setProperty("--pointer-x", "0");
  document.documentElement.style.setProperty("--pointer-y", "0");
});

snowButtons.forEach((button) => {
  button.addEventListener("click", () => {
    snowButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    snow.dataset.mode = button.dataset.snow;
  });
});

createSnowflakes();
snow.dataset.mode = "steady";
drawVisualizer();
