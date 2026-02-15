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

const searchUrlTemplateEl = document.getElementById("searchUrlTemplate");
const openModeEl = document.getElementById("openMode");
const trimEl = document.getElementById("trim");
const lowercaseEl = document.getElementById("lowercase");
const prefixEl = document.getElementById("prefix");
const suffixEl = document.getElementById("suffix");
const replacesListEl = document.getElementById("replacesList");
const addReplaceBtn = document.getElementById("addReplace");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

function showStatus(msg) {
  statusEl.textContent = msg;
  setTimeout(() => { statusEl.textContent = ""; }, 2000);
}

function createReplaceRow(pattern = "", replace = "") {
  const div = document.createElement("div");
  div.className = "replace-item";
  const inputPattern = document.createElement("input");
  inputPattern.type = "text";
  inputPattern.placeholder = "정규식 패턴 (예: \\s+)";
  inputPattern.value = pattern;
  const inputReplace = document.createElement("input");
  inputReplace.type = "text";
  inputReplace.placeholder = "치환 문자열";
  inputReplace.value = replace;
  const btn = document.createElement("button");
  btn.textContent = "삭제";
  btn.type = "button";
  btn.addEventListener("click", () => div.remove());
  div.appendChild(inputPattern);
  div.appendChild(inputReplace);
  div.appendChild(btn);
  return { div, inputPattern, inputReplace };
}

function renderReplaces(replaces) {
  replacesListEl.innerHTML = "";
  (replaces || []).forEach(({ pattern, replace }) => {
    const { div } = createReplaceRow(pattern, replace);
    replacesListEl.appendChild(div);
  });
}

function getReplacesFromDOM() {
  const items = replacesListEl.querySelectorAll(".replace-item");
  return Array.from(items).map(item => {
    const inputs = item.querySelectorAll("input");
    return {
      pattern: (inputs[0] && inputs[0].value) || "",
      replace: (inputs[1] && inputs[1].value) || ""
    };
  }).filter(r => r.pattern !== "");
}

addReplaceBtn.addEventListener("click", () => {
  const { div } = createReplaceRow();
  replacesListEl.appendChild(div);
});

function loadOptions() {
  chrome.storage.sync.get(DEFAULT_OPTIONS, (stored) => {
    searchUrlTemplateEl.value = stored.searchUrlTemplate || DEFAULT_OPTIONS.searchUrlTemplate;
    openModeEl.value = stored.openMode || DEFAULT_OPTIONS.openMode;
    const rules = stored.transformRules || DEFAULT_OPTIONS.transformRules;
    trimEl.checked = !!rules.trim;
    lowercaseEl.checked = !!rules.lowercase;
    prefixEl.value = rules.prefix || "";
    suffixEl.value = rules.suffix || "";
    renderReplaces(rules.replaces);
  });
}

function saveOptions() {
  const searchUrlTemplate = searchUrlTemplateEl.value.trim();
  if (!searchUrlTemplate.includes("{query}")) {
    showStatus("URL 템플릿에 {query} 가 필요합니다.");
    return;
  }

  const options = {
    searchUrlTemplate,
    openMode: openModeEl.value,
    transformRules: {
      trim: trimEl.checked,
      lowercase: lowercaseEl.checked,
      prefix: prefixEl.value,
      suffix: suffixEl.value,
      replaces: getReplacesFromDOM()
    }
  };

  chrome.storage.sync.set(options, () => {
    showStatus("저장되었습니다.");
  });
}

saveBtn.addEventListener("click", saveOptions);
loadOptions();
