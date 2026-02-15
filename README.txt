EZ Search - 선택 텍스트를 원하는 사이트/규칙으로 검색하기

1. 개요
--------------------
EZ Search는 크롬(및 크로미움 기반) 브라우저에서
"선택한 텍스트를 우클릭 → 지정한 사이트에서, 지정한 규칙으로 변환하여 검색"
할 수 있게 해 주는 확장 프로그램입니다.

기본 제공되는 "Google에서 '...' 검색" 메뉴를
- 사용자 지정 검색 사이트
- 사용자 지정 문자열 변환 규칙
으로 확장한 형태입니다.

2. 설계 개요
--------------------
[기술 스택]
- Chrome 확장 프로그램 Manifest V3
- background service worker (background.js)
- 옵션 페이지 (options.html, options.js)
- chrome.storage.sync 를 이용한 설정 저장

[기능 흐름]
1) 사용자가 웹페이지에서 텍스트를 드래그합니다.
2) 우클릭(컨텍스트 메뉴) 메뉴에서 "지정 사이트에서 검색"을 클릭합니다.
3) background.js의 컨텍스트 메뉴 핸들러가 호출되어
   - 선택 텍스트를 받습니다.
   - chrome.storage.sync 에 저장된 설정(검색 URL 템플릿, 변환 규칙, 새 탭/새 창 여부)을 읽습니다.
   - 변환 규칙을 적용해 최종 검색 문자열을 만듭니다.
   - URL 템플릿의 {query} 자리에 변환된 문자열(URI 인코딩)을 치환합니다.
   - chrome.tabs.create 또는 chrome.windows.create 로 새 탭/창을 엽니다.

[설정(옵션) 구조 예시]
- searchUrlTemplate: 문자열
  예) https://www.google.com/search?q={query}

- openMode: "new_tab" | "new_window"
  - 검색 결과를 새 탭 또는 새 창으로 열지 선택

- transformRules: 객체
  {
    "trim": true,
    "lowercase": false,
    "prefix": "site:stackoverflow.com ",
    "suffix": "",
    "replaces": [
      { "pattern": "\\s+", "replace": " " }
    ]
  }

3. 파일 구조 설계
--------------------
프로젝트 루트(예: ez_search/)는 다음과 같이 구성합니다.

- manifest.json
- background.js
- options.html
- options.js
- icons/
  - icon16.png
  - icon48.png
  - icon128.png
- README.txt (이 파일)

4. manifest.json 설계
--------------------
Manifest V3 기준 예시는 다음과 같습니다.

- manifest_version: 3
- name: "EZ Search"
- description: "선택한 텍스트를 사용자 지정 사이트와 규칙으로 검색하는 컨텍스트 메뉴 확장."
- version: "0.1.0"
- icons: icons/icon16.png, icon48.png, icon128.png
- permissions:
  - "contextMenus" : 우클릭 메뉴 생성
  - "storage"      : 옵션 저장/로드
  - "tabs"         : 새 탭 열기
- background:
  - service_worker: "background.js"
  - type: "module"
- options_page: "options.html"

5. background.js 동작 설계
--------------------
[1] 확장 설치 시 컨텍스트 메뉴 생성
- chrome.runtime.onInstalled.addListener 안에서
  - chrome.contextMenus.create({
      id: "ez-search-main",
      title: "지정 사이트에서 검색",
      contexts: ["selection"]
    });

[2] 메뉴 클릭 시 처리
- chrome.contextMenus.onClicked.addListener((info, tab) => { ... })
  - info.selectionText 로 선택된 문자열을 가져옵니다.
  - chrome.storage.sync.get(...) 으로 설정을 가져옵니다.
  - transformRules 에 따라 다음과 같은 변환을 수행합니다.
    - trim: 앞뒤 공백 제거
    - lowercase: 소문자 변환
    - replaces: 정규식 치환 배열
    - prefix/suffix: 접두사/접미사 추가
  - encodeURIComponent 로 인코딩 후, searchUrlTemplate 의 {query} 를 치환합니다.
  - openMode 가 "new_window" 면 chrome.windows.create, 그 외에는 chrome.tabs.create 로 새 탭을 엽니다.

6. options.html / options.js 설계
--------------------
options.html 에서는 다음 항목을 입력받는 폼을 구성합니다.

- 검색 URL 템플릿 입력 필드 (input type="text")
  - placeholder: 예) https://www.google.com/search?q={query}
- 열기 방식 선택 (select 또는 radio)
  - new_tab / new_window
- 문자열 변환 규칙
  - trim (checkbox)
  - lowercase (checkbox)
  - prefix (input text)
  - suffix (input text)
  - (선택) 정규식 치환 규칙(간단한 textarea 또는 나중에 확장)

options.js 에서는
- 페이지 로드 시 chrome.storage.sync.get 으로 현재 설정을 불러와 폼에 채워 넣고,
- "저장" 버튼 클릭 시 폼 값을 chrome.storage.sync.set 으로 저장합니다.

7. 설치 및 사용 방법(개발용)
--------------------
1) 이 프로젝트 폴더(ez_search/)를 준비합니다.
2) 크롬 주소창에 chrome://extensions/ 를 입력합니다.
3) 우측 상단 "개발자 모드"를 켭니다.
4) "압축해제된 확장 프로그램을 로드" 버튼을 눌러
   ez_search 폴더를 선택합니다.
5) 아무 웹페이지에서 텍스트를 드래그한 뒤 우클릭해서
   "지정 사이트에서 검색" 메뉴가 나타나는지 확인합니다.
6) chrome://extensions/ → EZ Search → "세부정보" → "확장 프로그램 옵션"에서
   검색 URL 템플릿, 열기 방식, 변환 규칙을 수정합니다.

8. Git 및 GitHub 사용 방법
--------------------
[로컬 Git 초기화]
1) 터미널(또는 PowerShell)에서 상위 리포지토리 루트(예: chrome-extension) 또는
   ez_search 프로젝트 루트로 이동합니다.

   예)
   cd D:/OneDrive/문서/GitHub/chrome-extension

2) 아직 Git 리포지토리가 아니라면 다음을 실행합니다.
   git init

3) 변경 파일을 추가합니다.
   git add ez_search/README.txt

4) 커밋을 생성합니다.
   git commit -m "Add EZ Search README and design"

[GitHub 리포지토리 생성 및 연동]
1) 브라우저에서 GitHub에 접속해 새 리포지토리를 생성합니다.
   - 예: 리포지토리 이름 "chrome-extension" 또는 "ez_search"

2) 생성된 리포지토리의 URL을 확인합니다.
   - 예: https://github.com/USERNAME/chrome-extension.git

3) 터미널에서 원격 저장소를 추가합니다.
   git remote add origin https://github.com/USERNAME/chrome-extension.git

4) 기본 브랜치를 main 으로 설정하고 최초 푸시를 합니다.
   git branch -M main
   git push -u origin main

이미 원격 리포지토리가 존재한다면, 원격 추가/브랜치 설정 단계는 생략하고
단순히 다음과 같이 푸시만 하면 됩니다.
   git push

9. 라이선스
--------------------
원하는 라이선스를 선택해 이 섹션에 표기하세요.
(예: MIT License)

