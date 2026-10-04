// =====================================================================
// 모든 페이지가 함께 쓰는 화면 부품
//  - 아래 탭 4개 (홈 / 일진 / 상담 / 사주 공부)
//  - 페이지 맨 아래 안내 (이용약관 · 개인정보처리방침 · 사업자 정보)
//  - data/ 폴더의 풀이 파일 읽기, "준비 중" 칸 흐리게 그리기
//  - 간지 칩, 선 아이콘, 저장된 생일 읽고 쓰기
// 페이지의 <body data-tab="home"> 값으로 어느 탭이 켜질지 정합니다.
// =====================================================================
(function () {
  var script = document.currentScript;
  // 이 파일 주소에서 사이트 맨 위 주소를 알아냅니다 (study/ 안의 페이지에서도 맞게).
  var BASE = script.src.replace(/js\/common\.js(\?.*)?$/, "");

  var SITE_NAME = "사주 노트";   // 사이트 이름 — 바꾸려면 여기와 각 html 의 <title> 을 고치세요.
  var PENDING = "준비 중";
  var MASCOT = BASE + "images/mascot.svg";   // 캐릭터 그림 — 이 파일 하나만 바꾸면 모든 화면이 바뀝니다.

  // ---- 선으로 그린 아이콘 ----
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  var ICONS = {
    home: svg('<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
    chat: svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-7l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z"/>'),
    book: svg('<path d="M4 5.5c2.8-1 5.5-.8 8 1 2.5-1.8 5.2-2 8-1V19c-2.8-1-5.5-.8-8 1-2.5-1.8-5.2-2-8-1z"/><path d="M12 6.5V20"/>'),
    person: svg('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>'),
    next: svg('<path d="M9 5l7 7-7 7"/>'),
    down: svg('<path d="M6 9l6 6 6-6"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
    send: svg('<path d="M4 12l16-7-6 16-2.5-6.5z"/><path d="M11.5 14.5 20 5"/>'),
    calendar: svg('<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'),
    grid: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 4v16M4 12h16"/>'),
    info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'),
    play: svg('<rect x="3.5" y="6" width="17" height="12" rx="3.5"/><path d="M10.5 9.5v5l4-2.5z"/>')
  };
  function icon(name) { return ICONS[name] || ""; }

  var TABS = [
    ["home", "홈", "index.html", "home"],
    ["iljin", "일진", "iljin.html", "sun"],
    ["chat", "상담", "chat.html", "chat"],
    ["study", "사주 공부", "study/index.html", "book"]
  ];

  function renderTabbar() {
    var on = document.body.getAttribute("data-tab");
    if (on === "none") return;
    var el = document.createElement("div");
    el.className = "tabbar";
    el.innerHTML = '<nav aria-label="주요 메뉴">' + TABS.map(function (t) {
      var cur = t[0] === on;
      return '<a href="' + BASE + t[2] + '"' + (cur ? ' class="on" aria-current="page"' : "") + ">" +
        icon(t[3]) + "<span>" + t[1] + "</span></a>";
    }).join("") + "</nav>";
    document.body.appendChild(el);
  }

  function renderFooter() {
    var app = document.querySelector(".app") || document.body;
    var el = document.createElement("footer");
    el.className = "site-footer";
    el.innerHTML =
      "<nav>" +
      '<a href="' + BASE + 'legal.html#terms">이용약관</a><span>·</span>' +
      '<a href="' + BASE + 'legal.html#privacy">개인정보처리방침</a><span>·</span>' +
      '<a href="' + BASE + 'legal.html#business">사업자 정보</a>' +
      "</nav>" +
      "<div>© " + SITE_NAME + "</div>";
    app.appendChild(el);
  }

  // 페이지 안의 <img data-mascot> 와 <span data-icon="이름"> 을 채웁니다.
  function fillPlaceholders() {
    var imgs = document.querySelectorAll("img[data-mascot]");
    for (var i = 0; i < imgs.length; i++) { imgs[i].src = MASCOT; if (!imgs[i].alt) imgs[i].alt = ""; }
    var icons = document.querySelectorAll("[data-icon]");
    for (var k = 0; k < icons.length; k++) icons[k].innerHTML = icon(icons[k].getAttribute("data-icon"));
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
  // 항목의 어느 칸(기본 "내용")을 꺼냅니다. 없거나 비어 있으면 "준비 중".
  function textOf(data, key, field) {
    var item = data && data[key];
    var t = item && typeof item === "object" ? item[field || "내용"] : item;
    t = (typeof t === "string") ? t.trim() : "";
    return t || PENDING;
  }
  function isPending(text) { return !text || text.trim() === PENDING; }

  // 풀이 칸 하나를 만듭니다. 내용이 "준비 중"이면 흐리게 표시됩니다.
  function readingBlock(title, text, fileHint) {
    var div = document.createElement("div");
    div.className = "reading" + (isPending(text) ? " pending" : "");
    if (title) {
      var t = document.createElement("div");
      t.className = "rt";
      t.textContent = title;
      if (isPending(text) && fileHint) {
        var p = document.createElement("span");
        p.className = "file-hint";
        p.textContent = fileHint;
        t.appendChild(p);
      }
      div.appendChild(t);
    }
    var b = document.createElement("div");
    b.className = "rb";
    b.textContent = text;
    div.appendChild(b);
    return div;
  }

  // 간지 칩 (둥근 사각형, 오행 색)
  function chip(han, elemIdx, size) {
    var key = ManseEngine.ELEM_KEYS[elemIdx];
    return '<span class="chip chip-' + key + (size ? " " + size : "") + '">' + han + "</span>";
  }

  // 받침에 따라 조사를 고릅니다. josa("갑", "은", "는") → "은"
  function josa(word, withBatchim, without) {
    var c = word.charCodeAt(word.length - 1);
    if (c < 0xac00 || c > 0xd7a3) return withBatchim;
    return (c - 0xac00) % 28 ? withBatchim : without;
  }

  // ---- 저장된 생일 (이 기기의 브라우저 안에만 저장됩니다) ----
  // { birth12: "199005152345", cal: "양력", gender: "여", timeUnknown: false }
  function remember(obj) {
    try { localStorage.setItem("saju.lastInput", JSON.stringify(obj)); } catch (e) {}
  }
  function recall() {
    try { return JSON.parse(localStorage.getItem("saju.lastInput") || "null"); } catch (e) { return null; }
  }
  // 저장된 생일을 한 줄로: "1990년 5월 15일 23:45 · 양력 · 여자"
  function birthLine(s) {
    if (!s || !s.birth12) return "";
    var b = s.birth12;
    var calName = s.cal === "윤달" ? "음력 윤달" : s.cal;
    return Number(b.slice(0, 4)) + "년 " + Number(b.slice(4, 6)) + "월 " + Number(b.slice(6, 8)) + "일 " +
      (s.timeUnknown ? "시간 모름" : b.slice(8, 10) + ":" + b.slice(10, 12)) + " · " + calName +
      (s.gender ? " · " + (s.gender === "여" ? "여자" : "남자") : "");
  }

  // 잠깐 뜨는 알림 ("곧 열려요" 같은 안내)
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  window.Site = {
    BASE: BASE, NAME: SITE_NAME, PENDING: PENDING, MASCOT: MASCOT,
    loadData: loadData, textOf: textOf, isPending: isPending, readingBlock: readingBlock,
    chip: chip, josa: josa, icon: icon, remember: remember, recall: recall, birthLine: birthLine, toast: toast
  };

  fillPlaceholders();
  renderFooter();
  renderTabbar();
})();
