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
    this.lastLessonUrl = startUrl;
    this.hasSeenVideo = false;
    this.logoutNotified = false;
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
        const redirected = await this.redirectToLessonAfterLogin();
        if (redirected) {
          continue;
        }

        this.status("waiting", "영상 요소를 찾는 중입니다.");
        continue;
      }

      this.hasSeenVideo = true;
      this.logoutNotified = false;
      if (state.url) {
        this.lastLessonUrl = state.url;
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
    await this.page.locator("video").first().waitFor({ timeout: 8000 }).catch(() => {});
    await this.playVideoElement();
    if (await this.isVideoPlaying()) {
      return;
    }

    const playButton = this.page.locator(".vjs-big-play-button");
    if ((await playButton.count()) > 0) {
      await playButton.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(700);
      if (await this.isVideoPlaying()) {
        return;
      }
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
      await this.page.waitForTimeout(700);
      if (!(await this.isVideoPlaying())) {
        await this.playVideoElement();
      }
    }
  }

  async playVideoElement() {
    await this.page.evaluate(async () => {
      const video = document.querySelector("video");
      if (!video || !video.paused) {
        return;
      }

      await video.play().catch(() => {});
    });
  }

  async isVideoPlaying() {
    const state = await this.readVideoState();
    return state.hasVideo && !state.paused && !state.ended;
  }

  async redirectToLessonAfterLogin() {
    const currentUrl = await this.page.url();
    if (isLessonUrl(currentUrl)) {
      return false;
    }

    const loginState = await this.readLoginState();
    if (loginState.isLoginPage || loginState.hasPasswordInput) {
      if (this.hasSeenVideo) {
        if (!this.logoutNotified) {
          this.status(
            "logged-out",
            "로그인이 해제되어 강의가 멈췄습니다. 브라우저에서 다시 로그인해주세요."
          );
          this.logoutNotified = true;
        } else {
          this.status("waiting", "재로그인을 기다리는 중입니다.");
        }
      } else {
        this.status("waiting", "로그인을 기다리는 중입니다.");
      }
      return true;
    }

    const targetUrl = this.lastLessonUrl || this.startUrl;
    this.status("moving", "로그인이 완료된 것으로 보여 강의 화면으로 이동합니다.");
    await this.page.goto(targetUrl);
    await this.page.waitForLoadState("domcontentloaded").catch(() => {});
    await this.page.waitForTimeout(1500);
    await this.tryStartPlayback();
    return true;
  }

  async readLoginState() {
    return this.page.evaluate(() => {
      const url = location.href.toLowerCase();
      const hasPasswordInput = Boolean(
        document.querySelector("input[type='password']")
      );
      const isLoginPage =
        url.includes("login") ||
        url.includes("signin") ||
        url.includes("sso") ||
        url.includes("member");

      return { hasPasswordInput, isLoginPage };
    });
  }

  async gotoNextLesson() {
    const currentId = getCurrentLessonId(await this.page.url());
    const currentIndex = this.lessonIds.indexOf(currentId);
    const nextId = this.lessonIds[currentIndex + 1];
    if (!nextId) {
      return false;
    }

    const nextUrl = replaceLessonId(await this.page.url(), nextId);
    this.lastLessonUrl = nextUrl;
    this.status("moving", `다음 회차로 이동합니다: ${nextId}`);
    await this.page.goto(nextUrl);
    await this.page.waitForLoadState("domcontentloaded").catch(() => {});
    await this.page.locator("video").first().waitFor({ timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
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

function isLessonUrl(url) {
  return Boolean(getCurrentLessonId(url));
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
