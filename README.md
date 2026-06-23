# EBS Lesson Automator

EBS SW 강의 영상을 감시하다가 현재 영상이 끝나면 다음 회차로 이동하는 데스크톱 도우미 앱입니다.

## 주요 기능

- 화면에 보이는 Chromium 브라우저를 엽니다.
- 사용자가 직접 정상적으로 로그인할 수 있게 합니다.
- 페이지의 `video` 요소를 감시합니다.
- 영상 재생이 끝나면 설정된 다음 `lctreSn` 회차 ID로 이동합니다.
- 다음 회차로 이동한 뒤 재생을 시도합니다. 사이트에서 첫 재생 클릭을 요구하는 경우에는 사용자가 직접 클릭할 수 있습니다.

## 다운로드

일반 사용자는 아래 GitHub Releases 페이지에서 최신 앱 ZIP 파일을 받으면 됩니다.

https://github.com/m161awm2/ebs-lesson-automator/releases

현재 릴리스:

- macOS Apple Silicon: `EBS.Lesson.Automator-0.1.7-arm64-mac.zip`

다운로드 후 실행 방법:

1. ZIP 파일의 압축을 풉니다.
2. 필요하면 `EBS Lesson Automator.app`을 `응용 프로그램` 폴더로 옮깁니다.
3. 앱을 실행합니다.

### macOS 보안 경고

이 앱은 Apple Developer Program 비용 문제로 코드 서명과 공증을 하지 않았습니다. 그래서 macOS에서 아래와 같은 경고가 뜰 수 있습니다.

- `"EBS Lesson Automator.app"이 손상되어 열 수 없습니다.`
- `"Apple에서 악성 소프트웨어가 있는지 확인할 수 없기 때문에 열 수 없습니다."`

이 경우 먼저 아래 방법을 시도해보세요.

1. `EBS Lesson Automator.app`을 우클릭 또는 Control-클릭합니다.
2. `열기`를 클릭합니다.
3. 경고 창이 뜨면 다시 `열기`를 클릭합니다.

그래도 macOS가 앱이 손상되었다고 표시하면, 앱 압축을 푼 뒤 터미널에서 아래 명령어를 실행하세요.

```bash
xattr -cr "/Applications/EBS Lesson Automator.app"
```

앱이 아직 다운로드 폴더에 있다면 아래 명령어를 사용하세요.

```bash
xattr -cr "$HOME/Downloads/EBS Lesson Automator.app"
```

그 다음 앱을 다시 실행하면 됩니다.

## 개발자 실행

```bash
npm install
npm start
```

## 참고 사항

일부 EBS 플레이어 상태에서는 재생을 시작하기 전에 사용자의 실제 첫 클릭이 필요할 수 있습니다. 이 앱은 강의 완료를 조작하지 않습니다. 영상 재생 상태를 감시하다가 현재 영상이 완료된 것으로 확인되면 다음 회차로 이동할 뿐입니다.

서비스 또는 소속 기관에서 브라우저 자동화를 허용하는 경우에만 사용하세요. 이 앱은 완료 우회 도구가 아니라 재생 감시 도구로 설계되었습니다.
