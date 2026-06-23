const startButton = document.querySelector("#start");
const stopButton = document.querySelector("#stop");
const log = document.querySelector("#log");

startButton.addEventListener("click", async () => {
  const startUrl = document.querySelector("#startUrl").value.trim();
  const lessonIds = document
    .querySelector("#lessonIds")
    .value.split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const pollMs = Number(document.querySelector("#pollMs").value);

  await window.lessonApp.start({ startUrl, lessonIds, pollMs });
  appendLog("started", "자동화를 시작했습니다.");
});

stopButton.addEventListener("click", async () => {
  await window.lessonApp.stop();
});

window.lessonApp.onStatus((payload) => {
  appendLog(payload.type, `[${payload.time}] ${payload.message}`);
});

function appendLog(type, message) {
  const item = document.createElement("li");
  item.className = type;
  item.textContent = message;
  log.prepend(item);
}
