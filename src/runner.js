import { chromium } from "playwright";

const DEFAULT_POLL_MS = 5000;

export class LessonRunner {
  constructor({ startUrl, lessonIds, pollMs = DEFAULT_POLL_MS, onStatus }) {
    this.startUrl = startUrl;
    this.lessonIds = lessonIds;
    this.pollMs = Number(pollMs) || DEFAULT_POLL_MS;
    this.onStatus = onStatus;
    this.browser = null;
    this.page = null;
    this.stopped = false;
  }

  async start() {
    this.stopped = false;
    this.browser = await chromium.launch({
      headless: false,
      args: ["--autoplay-policy=no-user-gesture-required"]
    });
    this.page = await this.browser.newPage();
    await this.page.goto(this.startUrl);
    this.status("opened", "브라우저를 열었습니다. 로그인과 첫 재생은 필요하면 직접 해주세요.");
    this.loop().catch((error) => {
      this.status("error", error.message);
    });
  }

  async stop() {
    this.stopped = true;
    await this.browser?.close().catch(() => {});
    this.browser = null;
    this.page = null;
    this.status("stopped", "중지되었습니다.");
  }

  async loop() {
    while (!this.stopped) {
      await this.page.waitForTimeout(this.pollMs);

      const state = await this.readVideoState();
      if (!state.hasVideo) {
        this.status("waiting", "영상 요소를 찾는 중입니다.");
        continue;
      }

      if (state.paused && !state.ended && state.currentTime === 0) {
        await this.tryStartPlayback();
      }

      const refreshed = await this.readVideoState();
      this.status("watching", formatProgress(refreshed));

      if (isComplete(refreshed)) {
        const moved = await this.gotoNextLesson();
        if (!moved) {
          this.status("complete", "현재 목록의 마지막 회차까지 완료했습니다.");
          await this.stop();
          return;
        }
      }
    }
  }

  async readVideoState() {
    return this.page.evaluate(() => {
      const video = document.querySelector("video");
      if (!video) {
        return { hasVideo: false };
      }

      return {
        hasVideo: true,
        currentTime: video.currentTime || 0,
        duration: video.duration || 0,
        ended: video.ended,
        paused: video.paused,
        url: location.href
      };
    });
  }

  async tryStartPlayback() {
    const playButton = this.page.locator(".vjs-big-play-button");
    if ((await playButton.count()) === 1) {
      await playButton.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(700);
    }

    const videoBox = await this.page.evaluate(() => {
      const video = document.querySelector("video");
      const rect = video?.getBoundingClientRect();
      return rect
        ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        : null;
    });

    if (videoBox) {
      await this.page.mouse.click(
        Math.round(videoBox.x + videoBox.width / 2),
        Math.round(videoBox.y + videoBox.height / 2)
      );
    }
  }

  async gotoNextLesson() {
    const currentId = getCurrentLessonId(await this.page.url());
    const currentIndex = this.lessonIds.indexOf(currentId);
    const nextId = this.lessonIds[currentIndex + 1];
    if (!nextId) {
      return false;
    }

    const nextUrl = replaceLessonId(await this.page.url(), nextId);
    this.status("moving", `다음 회차로 이동합니다: ${nextId}`);
    await this.page.goto(nextUrl);
    await this.page.waitForLoadState("domcontentloaded").catch(() => {});
    await this.page.waitForTimeout(1500);
    await this.tryStartPlayback();
    return true;
  }

  status(type, message) {
    this.onStatus?.({
      type,
      message,
      time: new Date().toLocaleTimeString()
    });
  }
}

function isComplete(state) {
  return (
    state.hasVideo &&
    state.duration > 0 &&
    (state.ended || state.currentTime >= state.duration - 1.5)
  );
}

function getCurrentLessonId(url) {
  return new URL(url).searchParams.get("lctreSn");
}

function replaceLessonId(url, lessonId) {
  const next = new URL(url);
  next.searchParams.set("lctreSn", lessonId);
  return next.toString();
}

function formatProgress(state) {
  const current = Math.floor(state.currentTime || 0);
  const duration = Math.floor(state.duration || 0);
  const flag = state.paused ? "일시정지" : "재생 중";
  return `${flag} ${current}s / ${duration}s`;
}
