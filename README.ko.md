[English](README.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | **한국어** | [Português (BR)](README.pt_BR.md) | [简体中文](README.zh_CN.md)

# AI Window Deck

여러 AI 도구와 참고 자료를 나란히 띄워 놓고 작업하는 사람을 위한 Chrome 확장 프로그램입니다. 함께 사용하는 창을 저장하고, 캔버스에 배치하고, 타일 형태로 정렬된 Chrome 창으로 한 번에 열 수 있습니다. 단축키 하나로 그중 한 창을 확대(Spotlight)할 수도 있습니다.

Chrome 프로필, 로그인 상태, 비밀번호 관리자, 다른 확장 프로그램은 그대로 유지됩니다. AI Window Deck은 일반 Chrome 창을 정렬하기만 합니다.

![캔버스에 창 배치하기](store-assets/screenshots/01-arrange.png)

## 기능

- **창 라이브러리.** 저장한 각 창에는 이름과 하나 이상의 URL이 있으며, URL은 탭으로 열립니다. 창을 하나씩 추가하거나, 텍스트로 한꺼번에 붙여 넣거나, `.txt` 파일로 가져오고 내보낼 수 있습니다.
- **레이아웃 캔버스.** 12 × 12 캔버스에 창을 드래그하고 어느 가장자리에서든 크기를 조절할 수 있습니다. 레이아웃은 자동, 세로, 가로, 그리드, 포커스(큰 창 하나), 자유형 중에서 선택합니다. 캔버스에서는 실행취소와 다시 실행을 지원하며, 여러 레이아웃 프리셋(A, B, …)을 보관할 수 있습니다.
- **실행 및 다시 정렬.** 클릭 한 번으로 레이아웃의 모든 창을 열어 선택한 디스플레이에 타일 형태로 정렬하고, 탭은 그룹으로 묶습니다. *그리드 다시 정렬*을 사용하면 이미 실행한 창을 제자리로 되돌립니다.
- **Spotlight.** `Alt+X`를 누르면 활성 창이 확대됩니다. 크기는 절반, 너비 절반·높이 전체, 4분의 3, 높이 전체, 전체 화면, 사용자 지정 크기 중에서 고를 수 있습니다. 현재 위치에서 확대할지, 화면 중앙에서 확대할지도 선택할 수 있습니다. `Alt+X`를 다시 누르거나 `Alt+Z`를 누르면 원래 타일로 돌아갑니다.
- **창 간 이동.** 이전 창이나 다음 창으로 이동하고, 창 1–8에 포커스를 맞추고, 마지막 정렬을 실행취소하고, 전체 화면을 전환할 수 있습니다.
- **다중 디스플레이.** 덱을 열 모니터를 하나 또는 여러 개 선택할 수 있습니다.
- **플로팅 컨트롤러와 큰 창.** 작은 컨트롤러를 열어 둔 채로 사용하거나, 설정을 별도의 창에서 열 수 있습니다.
- **백업.** 모든 창, 레이아웃, 설정을 JSON 파일로 백업하거나 복원할 수 있습니다.
- **8개 언어.** English, 日本語, Deutsch, Español, Français, 한국어, Português (Brasil), 简体中文을 지원합니다. 언어를 직접 선택하기 전까지 패널은 브라우저 언어를 따릅니다.

| Spotlight | 창 라이브러리 | 창 등록 |
| --- | --- | --- |
| ![Spotlight](store-assets/screenshots/02-spotlight.png) | ![창 라이브러리](store-assets/screenshots/03-window-library.png) | ![등록](store-assets/screenshots/04-register.png) |

## 설치

### Chrome 웹 스토어

[Chrome 웹 스토어](https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc)에서 설치할 수 있습니다.

### 릴리스 ZIP에서 설치

1. [Releases](https://github.com/takaoumehara/ai-window-deck/releases)에서 `AI-Window-Deck-vX.Y.Z.zip`을 다운로드하고 압축을 풉니다.
2. `chrome://extensions`를 열고 **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 클릭하고 압축을 푼 폴더를 선택합니다.

### 소스에서 설치

```sh
git clone https://github.com/takaoumehara/ai-window-deck.git
cd ai-window-deck
npm install
npm run build
```

그런 다음 **압축해제된 확장 프로그램을 로드합니다**로 저장소 폴더(`manifest.json`이 들어 있는 폴더)를 로드합니다. `dist/`가 커밋되어 있으므로, 새로 클론한 저장소를 빌드하지 않고 바로 로드해도 동작합니다.

## 사용 방법

1. 툴바 아이콘을 클릭합니다. 처음 실행하면 세 단계를 안내하는 짧은 가이드가 표시됩니다.
2. *대상 디스플레이 선택*에서 **디스플레이를 선택합니다**.
3. *창* 사이드바의 **+** 버튼으로 **창을 등록합니다**. 이름과 하나 이상의 URL을 입력합니다.
4. **창을 캔버스로 드래그합니다.** 원하는 창 개수를 설정하고, 레이아웃을 선택하고, 타일 가장자리를 드래그해 크기를 조절합니다.
5. **실행**을 클릭합니다. 각 창이 개별 Chrome 창으로 열리고 캔버스와 같은 모양으로 타일 정렬됩니다.
6. 작업하는 동안 Spotlight와 이동 단축키를 활용하세요.

팁:

- 사이드바에서 창 카드를 더블클릭하거나 카드에서 `Enter`를 누르면 편집할 수 있습니다. `Delete`를 누르면 삭제됩니다.
- 대화상자는 `Escape`로 닫히며, 키보드 포커스는 대화상자를 연 버튼으로 돌아갑니다.
- *큰 창에서 열기*를 사용하면 툴바 팝업보다 넓은 크기로 같은 패널을 열 수 있습니다.

### 키보드 단축키

| 명령 | 기본값 |
| --- | --- |
| Spotlight: 활성 창 확대 / 타일로 되돌리기 | `Alt+X` |
| 창을 처음 타일 위치로 되돌리기 | `Alt+Z` |
| 덱 창 정렬(다시 정렬) | `Alt+A` |
| 전체 화면 / 되돌리기 | `Alt+Q` |
| 마지막 정렬 실행취소 | 설정 안 됨 |
| 다음 창 / 이전 창 | 설정 안 됨 |
| 창 1–8에 포커스 | 설정 안 됨 |

Chrome에서는 확장 프로그램이 기본 단축키를 네 개까지만 제안할 수 있습니다. 모든 단축키는 `chrome://extensions/shortcuts`에서 지정하거나 변경할 수 있으며, 패널의 *단축키 변경* 링크를 누르면 이 페이지가 열립니다. macOS에서는 Chrome이 `Alt`를 `⌥`로 표시합니다.

## 권한 및 개인정보 보호

| 권한 | 필요한 이유 |
| --- | --- |
| `tabs` | 저장된 URL을 탭으로 열고, 열려 있는 창의 제목과 URL을 읽어 목록을 표시하고 정렬하기 위해 필요합니다. |
| `tabGroups` | 덱이 여는 각 창의 탭 그룹에 이름과 색상을 지정하기 위해 필요합니다. |
| `storage` | 창, 레이아웃, 환경설정을 저장하기 위해 필요합니다. |
| `system.display` | 디스플레이의 크기와 위치를 읽어 올바른 모니터에 창을 타일 정렬하기 위해 필요합니다. |

AI Window Deck에는 호스트 권한이나 콘텐츠 스크립트가 없으며, 페이지 콘텐츠를 읽지 않습니다. 네트워크 요청을 보내지 않고 원격 코드를 로드하지도 않습니다. 분석 도구나 계정도 없습니다. 설정은 `chrome.storage.sync`에 저장되므로, Chrome 동기화를 켜 두었다면 Chrome이 사용자 본인의 기기 간에 설정을 동기화할 수 있습니다. 실행취소를 위한 임시 상태는 `chrome.storage.session`에 보관됩니다. 개발자나 제3자에게 전송되는 정보는 없습니다.

전체 정책은 [PRIVACY.md](PRIVACY.md)에서 확인할 수 있습니다.

## 개발

Node.js 20 이상과 Python 3이 필요합니다.

```sh
npm install           # dependencies
npm run build         # build the React panel into dist/
npm test              # unit tests (node --test)
npm run dev           # Vite dev server for the panel (no chrome.* APIs)
./tools/package.sh    # build, validate and zip AI-Window-Deck-v<version>.zip
```

저장소 구성:

| 경로 | 내용 |
| --- | --- |
| `manifest.json`, `background.js` | 확장 프로그램 매니페스트와 서비스 워커(창 배치, 단축키) |
| `src/` | 팝업과 옵션 페이지에서 사용하는 React + Tailwind 패널 |
| `dist/` | 빌드된 패널. 저장소를 그대로 압축해제된 확장 프로그램으로 로드할 수 있도록 커밋되어 있습니다 |
| `identify.html`, `identify.js` | 디스플레이를 식별할 때 해당 디스플레이에 잠시 표시되는 번호 |
| `_locales/`, `tools/strings.json`, `tools/ui-strings.json` | 번역(아래 참조) |
| `tools/` | i18n 빌드, 패키징, 패키지 검증 |
| `store-assets/` | Chrome 웹 스토어 등록 문구, 스크린샷, 프로모션 타일, 캡처 스크립트 |
| `test/` | 단위 테스트 |

`deck.html`, `deck.js`, `dock.html`, `dock.js`는 1.7 이전 버전의 패널입니다. 참고용으로 남겨 두었으며 패키지에는 포함되지 않습니다.

### 번역

패널 문자열은 `tools/ui-strings.json`에 있습니다. Chrome 자체에서 사용하는 문자열(확장 프로그램 설명과 단축키 이름)은 `tools/strings.json`에 있습니다. 두 파일 중 하나를 수정한 후에는 다음 명령을 실행합니다.

```sh
python3 tools/build-i18n.py
```

이 명령은 `src/lib/ui-strings.js`와 `_locales/*/messages.json`을 다시 생성합니다. 패널 로캘 중 하나에 키가 누락되어 있으면 빌드가 실패합니다. `npm test`는 모든 언어에서 자리표시자가 일치하는지도 확인합니다.

## 릴리스 절차

1. `manifest.json`과 `package.json`의 `version`을 올리고 `CHANGELOG.md`를 업데이트합니다.
2. `npm test`와 `./tools/package.sh`를 실행합니다. 이 스크립트는 ZIP을 검증합니다(참조된 파일, 모든 로캘의 `__MSG_` 키, 설명 길이).
3. ZIP을 Chrome 웹 스토어 대시보드에 업로드합니다.
4. 스토어에서 해당 버전이 승인되면 `main`에 `vX.Y.Z` 태그를 지정하고 GitHub Release에 ZIP을 첨부합니다.

자세한 내용은 [docs/RELEASING.md](docs/RELEASING.md)를 참조하세요.

## 지원

버그 신고와 제안은 [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues)에 남겨 주세요.

## 라이선스

[MIT](LICENSE) © 2026 Takao Umehara
