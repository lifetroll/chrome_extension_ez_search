// 기본 설정값
const DEFAULT_OPTIONS = {
  searchUrlTemplate: "https://www.google.com/search?q={query}",
  openMode: "new_tab",
  transformRules: {
    trim: true,
    lowercase: false,
    prefix: "",
    suffix: "",
    replaces: []
  }
};

// 확장 설치 시 컨텍스트 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ez-search-main",
    title: "지정 사이트에서 검색",
    contexts: ["selection"]
  });
});

// 선택 텍스트에 변환 규칙 적용
function applyTransformRules(text, rules) {
  if (!text || typeof text !== "string") return "";
  let result = text;

  if (rules.trim) {
    result = result.trim();
  }
  if (rules.lowercase) {
    result = result.toLowerCase();
  }
  if (Array.isArray(rules.replaces) && rules.replaces.length > 0) {
    for (const { pattern, replace } of rules.replaces) {
      try {
        const re = new RegExp(pattern, "g");
        result = result.replace(re, replace || "");
      } catch (_) {
        // 잘못된 정규식은 무시
      }
    }
  }
  if (rules.prefix) {
    result = rules.prefix + result;
  }
  if (rules.suffix) {
    result = result + rules.suffix;
  }

  return result;
}

// 메뉴 클릭 시 처리
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "ez-search-main") return;

  const selectedText = (info.selectionText || "").trim();
  if (!selectedText) return;

  const stored = await chrome.storage.sync.get(DEFAULT_OPTIONS);
  const {
    searchUrlTemplate,
    openMode,
    transformRules
  } = stored;

  const query = applyTransformRules(selectedText, transformRules || DEFAULT_OPTIONS.transformRules);
  const encodedQuery = encodeURIComponent(query);
  const targetUrl = searchUrlTemplate.replace(/\{query\}/g, encodedQuery);

  if (openMode === "new_window") {
    chrome.windows.create({ url: targetUrl });
  } else {
    chrome.tabs.create({ url: targetUrl });
  }
});
