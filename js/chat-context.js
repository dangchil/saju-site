// =====================================================================
// 상담에 넘길 [원국 정보]와 [풀이 자료]를 만듭니다.
// 간지·십성·대운·세운·오늘 일진·월건은 모두 js/manse.js 엔진으로 여기서 계산합니다.
// AI에게는 계산을 시키지 않고, 계산된 값만 글로 넘깁니다.
// js/manse.js, js/saju-extra.js, js/common.js 를 먼저 불러와야 합니다.
// =====================================================================
var ChatContext = (function () {
  var ELEM = ["목(木)", "화(火)", "토(土)", "금(金)", "수(水)"];
  var PILLARS = ["년", "월", "일", "시"];

  function gj(s, b) { return S_HA[s] + B_HA[b] + "(" + S_KO[s] + B_KO[b] + ")"; }
  function cellGj(c) { return c.stem_han + c.branch_han + "(" + c.stem_ko + c.branch_ko + ")"; }

  // 지금 한국 시각 (연·월·일·시·분)
  function nowKST() {
    var d = new Date(Date.now() + 9 * 3600 * 1000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mm: d.getUTCMinutes() };
  }

  // 저장된 생일 s = { birth12, cal, gender, timeUnknown } 로 필요한 값을 모두 계산합니다.
  function compute(s) {
    var r = computeChart(s.birth12, s.cal, s.gender);          // 원본 만세력과 같은 계산 (saju-extra.js)
    var data = r.data, natal = data.natal;
    var ds = S_HA.indexOf(natal["일"].stem_han);              // 일간 번호
    var now = nowKST();

    // 지금 대운
    var curDu = null;
    data.daeun.forEach(function (d) { if (d.year_from <= now.y && now.y <= d.year_to) curDu = d; });

    // 올해 세운 (그해의 간지 — 만세력 화면의 세운과 같은 계산)
    var ys = ManseEngine.mod(now.y - 4, 10), yb = ManseEngine.mod(now.y - 4, 12);
    var seun = cell(ds, ys, yb);

    // 오늘 일진
    var tp = dayPillar(now.y, now.m, now.d);
    // 월건: 지금 시각이 어느 절입 뒤인지로 정해지는 이달의 간지
    var nowSj = getSaju(now.y, now.m, now.d, now.hh, now.mm);

    return {
      s: s, data: data, natal: natal, ds: ds, sar: r.saryeong, now: now,
      daeun: data.daeun, curDu: curDu,
      seun: { year: now.y, stem: ys, branch: yb, c: seun },
      iljin: { stem: tp[0], branch: tp[1], tenS: tenGod(ds, tp[0]), tenB: tenGod(ds, B_MAIN[tp[1]]) },
      wolgeon: { stem: nowSj.m[0], branch: nowSj.m[1], jeol: nowSj.jeol,
                 tenS: tenGod(ds, nowSj.m[0]), tenB: tenGod(ds, B_MAIN[nowSj.m[1]]) }
    };
  }

  // [원국 정보] 글
  function infoText(c) {
    var s = c.s, n = c.natal, L = [];
    var cols = PILLARS.filter(function (l) { return !(s.timeUnknown && l === "시"); });
    L.push("[원국 정보]");
    L.push("생일: " + Site.birthLine(s) + (s.cal !== "양력" ? " (양력 " + c.data.solar.slice(0, 10) + ")" : ""));
    if (s.timeUnknown) L.push("태어난 시간을 몰라 시주는 비워 둡니다.");
    L.push("일간: " + n["일"].stem_han + "(" + n["일"].stem_ko + ") " + ELEM[n["일"].stem_elem]);
    L.push("원국 (년주 · 월주 · 일주 · 시주):");
    cols.forEach(function (l) {
      L.push("- " + l + "주 " + cellGj(n[l]) + " / 천간 십성: " + n[l].ten_stem + " / 지지 십성: " + n[l].ten_branch +
        " / 지장간: " + n[l].hidden);
    });
    L.push("월지 사령: " + S_HA[c.sar.stem] + "(" + S_KO[c.sar.stem] + ")");
    L.push("대운 (" + c.data.direction + ", 대운수 " + c.data.daeun_num + "):");
    c.daeun.forEach(function (d) {
      L.push("- " + d.age + "세(" + d.year_from + "~" + d.year_to + "년) " + cellGj(d) +
        " / 천간 " + d.ten_stem + " · 지지 " + d.ten_branch + (d === c.curDu ? "  ← 지금 대운" : ""));
    });
    L.push("올해 세운: " + c.seun.year + "년 " + gj(c.seun.stem, c.seun.branch) +
      " / 천간 " + c.seun.c.ten_stem + " · 지지 " + c.seun.c.ten_branch);
    L.push("이달 월건(절입 기준, " + c.wolgeon.jeol + " 이후): " + gj(c.wolgeon.stem, c.wolgeon.branch) +
      " / 천간 " + c.wolgeon.tenS + " · 지지 " + c.wolgeon.tenB);
    L.push("오늘 일진: " + c.now.y + "년 " + c.now.m + "월 " + c.now.d + "일 " + gj(c.iljin.stem, c.iljin.branch) +
      " / 천간 " + c.iljin.tenS + " · 지지 " + c.iljin.tenB);
    L.push("(십성은 모두 이 사람의 일간 기준이고, 지지 십성은 지지의 본기로 본 것입니다.)");
    return L.join("\n");
  }

  // [풀이 자료]에 넣을 항목을 고릅니다: 그 사람 원국의 일간·지지, 그리고 원국·대운·세운·일진에 나온 십성
  function pickKeys(c) {
    var cols = PILLARS.filter(function (l) { return !(c.s.timeUnknown && l === "시"); });
    var ilgan = [c.natal["일"].stem_ko];
    var jiji = [];
    cols.forEach(function (l) { var b = c.natal[l].branch_ko; if (jiji.indexOf(b) < 0) jiji.push(b); });
    var sip = [];
    function add(t) { if (t && t !== "일간" && sip.indexOf(t) < 0) sip.push(t); }
    cols.forEach(function (l) { add(c.natal[l].ten_stem); add(c.natal[l].ten_branch); });
    if (c.curDu) { add(c.curDu.ten_stem); add(c.curDu.ten_branch); }
    add(c.seun.c.ten_stem); add(c.seun.c.ten_branch);
    add(c.iljin.tenS); add(c.iljin.tenB);
    sip.sort(function (a, b) { return TEN.indexOf(a) - TEN.indexOf(b); });
    return { ilgan: ilgan, jiji: jiji, sipsung: sip };
  }

  function readingText(keys, files) {
    var L = ["[풀이 자료]", "(사이트 주인이 쓴 풀이입니다. 해석은 이 안에서만 합니다. '준비 중'인 항목은 뺐습니다.)"];
    function section(title, data, list) {
      var got = list.filter(function (k) { return !Site.isPending(Site.textOf(data, k)); });
      L.push("");
      L.push("## " + title + (got.length ? "" : " — 넘길 풀이가 아직 없습니다"));
      got.forEach(function (k) { L.push("### " + k); L.push(Site.textOf(data, k)); });
    }
    section("일간", files.ilgan, keys.ilgan);
    section("지지 (원국에 있는 글자)", files.jiji, keys.jiji);
    section("십성 (원국·지금 대운·올해 세운·오늘 일진에 나온 것)", files.sipsung, keys.sipsung);
    return L.join("\n");
  }

  // 지시문 파일에서 메모(<!-- -->)를 빼고, {캐릭터 이름}을 채웁니다.
  function rulesText(md, charName) {
    return md.replace(/<!--[\s\S]*?-->/g, "").replace(/\{캐릭터 이름\}/g, charName).trim();
  }

  // 지시문 + 원국 정보 + 풀이 자료를 모두 모아 돌려줍니다.
  function build(s) {
    var c = compute(s);
    var keys = pickKeys(c);
    return Promise.all([
      fetch(Site.BASE + "data/chat-rules.md", { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("data/chat-rules.md 를 읽지 못했습니다 (" + r.status + ")");
        return r.text();
      }),
      Site.loadData("site"), Site.loadData("ilgan"), Site.loadData("jiji"), Site.loadData("sipsung")
    ]).then(function (got) {
      var name = Site.textOf(got[1], "캐릭터_이름");
      if (Site.isPending(name)) name = "사주 노트 캐릭터";
      return {
        calc: c, keys: keys, charName: name,
        rules: rulesText(got[0], name),
        info: infoText(c),
        readings: readingText(keys, { ilgan: got[2], jiji: got[3], sipsung: got[4] })
      };
    });
  }

  return { compute: compute, infoText: infoText, pickKeys: pickKeys, build: build };
})();
