# EBS Lesson Automator

Desktop helper that watches an EBS SW lesson video and opens the next lesson when the current video reaches the end.

## What It Does

- Opens a visible Chromium browser.
- Lets the user log in normally.
- Watches the page's `video` element.
- Moves to the next configured `lctreSn` lesson ID when playback completes.
- Tries to start playback after moving, while still allowing manual first-play clicks when the site requires them.

## Download

For regular users, download the latest app zip from the GitHub Releases page:

https://github.com/m161awm2/ebs-lesson-automator/releases

Current release:

- macOS Apple Silicon: `EBS.Lesson.Automator-0.1.7-arm64-mac.zip`

After downloading:

1. Unzip the file.
2. Move `EBS Lesson Automator.app` to `Applications` if you want.
3. Open the app.

### macOS Security Warning

This app is not code signed or notarized because Apple charges for the Developer Program. macOS may show a warning such as:

- `"EBS Lesson Automator.app" is damaged and can't be opened.`
- `"EBS Lesson Automator.app" cannot be opened because Apple cannot check it for malicious software.`

If that happens, try this first:

1. Right-click or Control-click `EBS Lesson Automator.app`.
2. Click `Open`.
3. Click `Open` again in the warning dialog.

If macOS still says the app is damaged, run this command in Terminal after unzipping the app:

```bash
xattr -cr "/Applications/EBS Lesson Automator.app"
```

If the app is still in Downloads, use this instead:

```bash
xattr -cr "$HOME/Downloads/EBS Lesson Automator.app"
```

Then open the app again.

## Developer Install

```bash
npm install
npm start
```

## Notes

Some EBS player states require a real first user click before playback starts. The app does not fake course completion; it only watches playback progress and moves to the next lesson after the current video reports completion.

Use this only where browser automation is permitted by the service and your organization. The app is designed as a playback watcher, not as a completion bypass.
