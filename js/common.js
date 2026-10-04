// =====================================================================
// 모든 페이지가 함께 쓰는 화면 부품
//  - 아래 탭 4개 (홈 / 상담 / 사주 공부 / 내 정보)
//  - 페이지 맨 아래 안내 (이용약관 · 개인정보처리방침 · 사업자 정보)
//  - data/ 폴더의 풀이 파일 읽기
//  - 오행 색 동그라미 그리기
// 페이지의 <body data-tab="home"> 값으로 어느 탭이 켜질지 정합니다.
// =====================================================================
(function () {
  var script = document.currentScript;
  // 이 파일 주소에서 사이트 맨 위 주소를 알아냅니다 (study/ 안의 페이지에서도 맞게).
  var BASE = script.src.replace(/js\/common\.js(\?.*)?$/, "");

  var SITE_NAME = "사주 노트";   // 사이트 이름 — 바꾸려면 여기만 고치세요.
  var PENDING = "준비 중";

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4.5 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>',
    study: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5c2.8-1 5.5-.8 8 1 2.5-1.8 5.2-2 8-1V19c-2.8-1-5.5-.8-8 1-2.5-1.8-5.2-2-8-1z"/><path d="M12 6.5V20"/></svg>',
    my: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3"/></svg>'
  };
  var TABS = [
    ["home", "홈", "index.html"],
    ["chat", "상담", "chat.html"],
    ["study", "사주 공부", "study/index.html"],
    ["my", "내 정보", "my.html"]
  ];

  function renderTabbar() {
    var on = document.body.getAttribute("data-tab") || "";
    var el = document.createElement("div");
    el.className = "tabbar";
    el.innerHTML = "<nav>" + TABS.map(function (t) {
      return '<a href="' + BASE + t[2] + '" class="' + (t[0] === on ? "on" : "") + '"' +
        (t[0] === on ? ' aria-current="page"' : "") + ">" + ICONS[t[0]] + "<span>" + t[1] + "</span></a>";
    }).join("") + "</nav>";
    document.body.appendChild(el);
  }

  function renderFooter() {
    var app = document.querySelector(".app") || document.body;
    var el = document.createElement("footer");
    el.className = "site-footer";
    el.innerHTML =
      "<nav>" +
      '<a href="' + BASE + 'legal.html#terms">이용약관</a>' +
      '<a href="' + BASE + 'legal.html#privacy">개인정보처리방침</a>' +
      '<a href="' + BASE + 'legal.html#business">사업자 정보</a>' +
      "</nav>" +
      "<div>" + SITE_NAME + "</div>";
    app.appendChild(el);
  }

  // ---- data/ 파일 읽기 ----
  var cache = {};
  function loadData(name) {
    if (!cache[name]) {
      cache[name] = fetch(BASE + "data/" + name + ".json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(function (e) {
          console.warn("data/" + name + ".json 을 읽지 못했습니다:", e);
          return null;   // 파일을 못 읽으면 모든 칸을 "준비 중"으로 보여 줍니다.
        });
    }
    return cache[name];
  }
  // 항목의 "내용"을 꺼냅니다. 없거나 비어 있으면 "준비 중".
  function textOf(data, key) {
    var item = data && data[key];
    var t = item && typeof item === "object" ? item["내용"] : item;
    t = (typeof t === "string") ? t.trim() : "";
    return t || PENDING;
  }
  function isPending(text) { return !text || text.trim() === PENDING; }

  // 풀이 칸 하나를 만듭니다. 내용이 "준비 중"이면 흐리게 표시됩니다.
  function readingBlock(title, text, fileHint) {
    var div = document.createElement("div");
    div.className = "reading" + (isPending(text) ? " pending" : "");
    var t = document.createElement("div");
    t.className = "rt";
    t.textContent = title;
    if (isPending(text) && fileHint) {
      var p = document.createElement("span");
      p.className = "pill";
      p.textContent = fileHint;
      t.appendChild(p);
    }
    var b = document.createElement("div");
    b.className = "rb";
    b.textContent = text;
    div.appendChild(t);
    div.appendChild(b);
    return div;
  }

  // 오행 색 동그라미
  function chip(han, elemIdx, size) {
    var key = ManseEngine.ELEM_KEYS[elemIdx];
    return '<span class="chip chip-' + key + (size ? " " + size : "") + '">' + han + "</span>";
  }

  // 지난번 입력값 기억 (이 기기 안에만 저장됩니다)
  function remember(obj) {
    try { localStorage.setItem("saju.lastInput", JSON.stringify(obj)); } catch (e) {}
  }
  function recall() {
    try { return JSON.parse(localStorage.getItem("saju.lastInput") || "null"); } catch (e) { return null; }
  }

  // 받침에 따라 조사를 고릅니다. josa("갑", "은", "는") → "은"
  function josa(word, withBatchim, without) {
    var c = word.charCodeAt(word.length - 1);
    if (c < 0xac00 || c > 0xd7a3) return withBatchim;
    return (c - 0xac00) % 28 ? withBatchim : without;
  }

  window.Site = {
    BASE: BASE, NAME: SITE_NAME, PENDING: PENDING,
    loadData: loadData, textOf: textOf, isPending: isPending, readingBlock: readingBlock,
    chip: chip, josa: josa, remember: remember, recall: recall
  };

  renderFooter();
  renderTabbar();
})();
