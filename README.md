# EBS Lesson Automator

Desktop helper that watches an EBS SW lesson video and opens the next lesson when the current video reaches the end.

## What It Does

- Opens a visible Chromium browser.
- Lets the user log in normally.
- Watches the page's `video` element.
- Moves to the next configured `lctreSn` lesson ID when playback completes.
- Tries to start playback after moving, while still allowing manual first-play clicks when the site requires them.

## Install

```bash
npm install
npm start
```

## Notes

Some EBS player states require a real first user click before playback starts. The app does not fake course completion; it only watches playback progress and moves to the next lesson after the current video reports completion.

Use this only where browser automation is permitted by the service and your organization. The app is designed as a playback watcher, not as a completion bypass.
