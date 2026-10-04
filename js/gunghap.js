// =====================================================================
// 궁합 계산 (두 원국 사이의 합·충·원진 등 판정)
// 근거: 사이트풀이초안/궁합/궁합원칙_확정.md
//   - 천간합: 일간끼리의 합 (갑기·을경·병신·정임·무계)
//   - 지지: 확정본 5장의 육합·삼합·방합, 6장 "계산용 표준 목록"의 충·원진·귀문·형·파·격각
//   - 조후: 확정본 3장 + 교수님 기준(월지로 판정, 조후 글자, 자리의 무게). 아래 johuOf()·johuGive() 참고.
// js/manse.js 를 먼저 불러온 뒤 불러온다. manse.js 는 고치지 않는다.
// node 에서도 require 해서 쓸 수 있다 (tests/gunghap-test.js).
// =====================================================================
(function (root) {
  var E = (typeof ManseEngine !== "undefined") ? ManseEngine
    : (typeof require === "function" ? require("./manse.js") : null);
  var S_KO = E.S_KO, B_KO = E.B_KO, B_HA = E.B_HA;
  var B_MAIN = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];   // 지지의 본기 천간 (manse.js 의 B_MAIN 과 같다)

  // 지지 번호: 자0 축1 인2 묘3 진4 사5 오6 미7 신8 유9 술10 해11
  function b(han) { return B_HA.indexOf(han); }
  function pairs(list) { return list.map(function (p) { return [b(p[0]), b(p[1])]; }); }
  function groups(list) { return list.map(function (g) { return g.split("").map(b); }); }

  // ---- 표준 목록 (확정본 그대로) ----
  var STEM_HAP = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]];            // 갑기 을경 병신 정임 무계
  var YUKHAP = pairs(["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"]);
  var SAMHAP = groups(["申子辰", "亥卯未", "寅午戌", "巳酉丑"]);
  var BANGHAP = groups(["寅卯辰", "巳午未", "申酉戌", "亥子丑"]);
  var WONJIN = pairs(["子未", "丑午", "寅酉", "卯申", "辰亥", "巳戌"]);
  var CHUNG = pairs(["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"]);
  var GWIMUN = pairs(["子酉", "丑午", "寅未", "卯申", "辰亥", "巳戌"]);
  var HYEONG_GROUP = groups(["寅巳申", "丑戌未"]);
  var HYEONG_PAIR = pairs(["子卯"]);
  var JAHYEONG = ["辰", "午", "酉", "亥"].map(b);                      // 자형: 같은 글자끼리
  var PA = pairs(["子酉", "丑辰", "寅亥", "卯午", "巳申", "戌未"]);
  // 격각: 지지 순서에서 한 칸 건너 있는 열두 쌍 (자인, 축묘, … 해축)
  var GYEOKGAK = []; for (var i = 0; i < 12; i++) GYEOKGAK.push([i, (i + 2) % 12]);

  function inPairs(list, x, y) {
    for (var k = 0; k < list.length; k++) {
      var p = list[k];
      if ((p[0] === x && p[1] === y) || (p[0] === y && p[1] === x)) return true;
    }
    return false;
  }
  function inGroup(list, x, y) {
    if (x === y) return false;
    for (var k = 0; k < list.length; k++) if (list[k].indexOf(x) >= 0 && list[k].indexOf(y) >= 0) return true;
    return false;
  }

  var REL_ORDER = ["육합", "삼합", "방합", "충", "원진", "귀문", "형", "파", "격각"];
  var HAP_KINDS = ["육합", "삼합", "방합"];

  // 두 지지(번호) 사이의 관계 목록. 한 쌍이 여러 관계를 함께 가질 수 있다 (예: 축오 = 원진·귀문).
  function branchRel(x, y) {
    var r = [];
    if (inPairs(YUKHAP, x, y)) r.push("육합");
    if (inGroup(SAMHAP, x, y)) r.push("삼합");
    if (inGroup(BANGHAP, x, y)) r.push("방합");
    if (inPairs(CHUNG, x, y)) r.push("충");
    if (inPairs(WONJIN, x, y)) r.push("원진");
    if (inPairs(GWIMUN, x, y)) r.push("귀문");
    if (inGroup(HYEONG_GROUP, x, y) || inPairs(HYEONG_PAIR, x, y) || (x === y && JAHYEONG.indexOf(x) >= 0)) r.push("형");
    if (inPairs(PA, x, y)) r.push("파");
    if (inPairs(GYEOKGAK, x, y)) r.push("격각");
    return r;
  }
  function stemHap(s1, s2) { return inPairs(STEM_HAP, s1, s2); }

  // ---- 원국에서 번호 꺼내기 ----
  var POS = ["년", "월", "일", "시"];
  function stemIdx(natal, l) { return S_KO.indexOf(natal[l].stem_ko); }
  function branchIdx(natal, l) { return B_KO.indexOf(natal[l].branch_ko); }
  function cols(timeUnknown) { return POS.filter(function (l) { return !(timeUnknown && l === "시"); }); }

  // ---- 조후 (확정본 3장, 교수님 기준) ----
  // 한 사람의 판정은 월지로 한다. 겨울·여름 생만 따지고, 봄·가을 생(월지 인묘진, 신유술)은 따지지 않는다.
  //   아주 추움: 월지 자·축   추움: 월지 해
  //   아주 더움: 월지 오·미   더움: 월지 사
  //   월지가 해(사)여도 년지·일지·시지에 같은 계절 글자(해자축 / 사오미)가 하나 이상 더 있으면 "아주"로 올린다.
  // 조후 글자
  //   추운 사주: 천간 丙·丁, 지지 巳·午·未
  //   더운 사주: 천간 壬·癸, 지지 子·丑  (亥는 아직 넣지 않는다)
  var WINTER = [11, 0, 1], SUMMER = [5, 6, 7];             // 해자축, 사오미
  var JOHU_STEM = { cold: [2, 3], hot: [8, 9] };           // 丙丁 / 壬癸
  var JOHU_BRANCH = { cold: [5, 6, 7], hot: [0, 1] };      // 巳午未 / 子丑
  var NOT_JUDGED = "따지지 않음";

  function johuLevel(natal, timeUnknown) {
    var m = branchIdx(natal, "월");
    var others = cols(timeUnknown).filter(function (l) { return l !== "월"; }).map(function (l) { return branchIdx(natal, l); });
    var more = function (set) { return others.some(function (x) { return set.indexOf(x) >= 0; }); };
    if (m === 0 || m === 1) return { level: "아주 추움", kind: "cold", month: m };
    if (m === 11) return { level: more(WINTER) ? "아주 추움" : "추움", kind: "cold", month: m, raised: more(WINTER) };
    if (m === 6 || m === 7) return { level: "아주 더움", kind: "hot", month: m };
    if (m === 5) return { level: more(SUMMER) ? "아주 더움" : "더움", kind: "hot", month: m, raised: more(SUMMER) };
    return { level: NOT_JUDGED, kind: null, month: m };
  }

  // 자리 이름과 무게: 일지 > 월지 > 그 밖(천간, 년지, 시지). 숫자가 작을수록 무겁다.
  var PLACE_ORDER = ["일지", "월지", "년간", "월간", "일간", "시간", "년지", "시지"];
  function placeRank(place) { return place === "일지" ? 0 : (place === "월지" ? 1 : 2); }

  // natal 안에서 kind("cold"/"hot") 사주에 필요한 조후 글자를 찾는다.
  // 십성은 refDay(천간 번호) 기준으로 붙인다. 지지의 십성은 본기로 본다.
  function johuHits(natal, timeUnknown, kind, refDay) {
    var hits = [];
    if (!kind) return hits;
    cols(timeUnknown).forEach(function (l) {
      var si = stemIdx(natal, l), bi = branchIdx(natal, l);
      if (JOHU_STEM[kind].indexOf(si) >= 0) hits.push({ place: l + "간", han: E.S_HA[si], ko: S_KO[si], ten: E.tenGod(refDay, si) });
      if (JOHU_BRANCH[kind].indexOf(bi) >= 0) hits.push({ place: l + "지", han: B_HA[bi], ko: B_KO[bi], ten: E.tenGod(refDay, B_MAIN[bi]) });
    });
    hits.forEach(function (h) { h.rank = placeRank(h.place); });
    hits.sort(function (x, y) { return x.rank - y.rank || PLACE_ORDER.indexOf(x.place) - PLACE_ORDER.indexOf(y.place); });
    return hits;
  }

  // 한 사람의 조후 판정: { level, kind, month, raised, hits(원국 안의 조후 글자) }
  function johuOf(natal, timeUnknown) {
    var j = johuLevel(natal, timeUnknown);
    j.hits = johuHits(natal, timeUnknown, j.kind, stemIdx(natal, "일"));
    return j;
  }

  // giver 의 원국에 receiver 의 조후 글자가 있는가. 십성은 받는 사람(receiver)의 일간 기준.
  // 돌려주는 값: { gives, hits(무거운 자리부터), label: "일지로 조후를 줌" }
  function johuGive(giver, receiver) {
    var need = johuLevel(receiver.natal, receiver.timeUnknown);
    var hits = johuHits(giver.natal, giver.timeUnknown, need.kind, stemIdx(receiver.natal, "일"));
    return { gives: hits.length > 0, hits: hits, label: hits.length ? hits[0].place + "로 조후를 줌" : "" };
  }

  // ---- 서로 채워 주는 십성 (확정본 7장, 표는 쓰지 않음) ----
  // 내 원국(일간 제외)에 없는 십성 묶음을, 상대 원국 글자 가운데 2개 이상이 그 십성으로 작용하면 "채워 준다"고 본다.
  var GROUP_OF = { 비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성" };
  var GROUPS = ["비겁", "식상", "재성", "관성", "인성"];
  function tenFill(nA, uA, nB, uB) {
    var dayA = stemIdx(nA, "일"), have = {};
    cols(uA).forEach(function (l) {
      if (l !== "일") have[GROUP_OF[nA[l].ten_stem]] = true;
      have[GROUP_OF[nA[l].ten_branch]] = true;
    });
    var cnt = {};
    cols(uB).forEach(function (l) {
      [stemIdx(nB, l), B_MAIN[branchIdx(nB, l)]].forEach(function (s) {
        var g = GROUP_OF[E.tenGod(dayA, s)]; cnt[g] = (cnt[g] || 0) + 1;
      });
    });
    return GROUPS.filter(function (g) { return !have[g] && (cnt[g] || 0) >= 2; });
  }

  // ---- 두 원국 분석 ----
  // a, b: { natal, timeUnknown }
  function analyze(a, b) {
    var positions = POS.map(function (l) {
      var skip = (a.timeUnknown || b.timeUnknown) && l === "시";
      var x = branchIdx(a.natal, l), y = branchIdx(b.natal, l);
      return { pos: l, a: x, b: y, skip: skip, rels: skip ? [] : branchRel(x, y) };
    });
    var day = positions[2].rels;
    var sh = stemHap(stemIdx(a.natal, "일"), stemIdx(b.natal, "일"));
    var hasHap = day.some(function (r) { return HAP_KINDS.indexOf(r) >= 0; });
    var combo = null;
    if (sh && hasHap) combo = "천합지합";
    else if (sh && day.indexOf("충") >= 0) combo = "천합지충";
    else if (sh && day.indexOf("원진") >= 0) combo = "천합원진";
    else if (!sh && hasHap) combo = "지지만합";
    // 조후: [0] 나의 판정, [1] 상대의 판정 / give[0] 상대가 나에게, give[1] 내가 상대에게
    var johu = [johuOf(a.natal, a.timeUnknown), johuOf(b.natal, b.timeUnknown)];
    var give = [johuGive(b, a), johuGive(a, b)];
    // 조후를 주는 지지 자리가 같은 자리의 원진·충과 겹치는가 (확정본 3장의 축오처럼)
    var overlap = [];
    give.forEach(function (g) {
      g.hits.forEach(function (h) {
        if (h.place.slice(-1) !== "지") return;
        var p = positions[POS.indexOf(h.place[0])];
        p.rels.forEach(function (r) {
          if ((r === "원진" || r === "충") && !overlap.some(function (o) { return o.pos === p.pos && o.rel === r; }))
            overlap.push({ pos: p.pos, rel: r, a: p.a, b: p.b });
        });
      });
    });
    return {
      stemHap: sh, positions: positions, combo: combo,
      johu: johu, johuGive: give, johuOverlap: overlap,
      fill: [tenFill(a.natal, a.timeUnknown, b.natal, b.timeUnknown), tenFill(b.natal, b.timeUnknown, a.natal, a.timeUnknown)],
      unlock: [unlock(a, b), unlock(b, a)]
    };
  }
  // 확정본 6장: 내 사주의 불안한 자리(일·시의 충·원진)를 상대가 합으로 풀어 주는가
  // 내 일지·시지가 서로 충이나 원진이고, 상대의 일지 또는 시지가 내 일지나 시지와 육합이면 "풀어 준다"고 본다.
  function unlock(me, other) {
    if (me.timeUnknown) return false;
    var d = branchIdx(me.natal, "일"), t = branchIdx(me.natal, "시");
    var r = branchRel(d, t);
    if (r.indexOf("충") < 0 && r.indexOf("원진") < 0) return false;
    var mine = [d, t], theirs = [branchIdx(other.natal, "일")];
    if (!other.timeUnknown) theirs.push(branchIdx(other.natal, "시"));
    return theirs.some(function (o) { return mine.some(function (m) { return inPairs(YUKHAP, m, o); }); });
  }

  var Gunghap = {
    REL_ORDER: REL_ORDER, HAP_KINDS: HAP_KINDS, branchRel: branchRel, stemHap: stemHap,
    johuOf: johuOf, johuGive: johuGive, NOT_JUDGED: NOT_JUDGED, tenFill: tenFill, analyze: analyze, unlock: unlock,
    LISTS: { YUKHAP: YUKHAP, SAMHAP: SAMHAP, BANGHAP: BANGHAP, WONJIN: WONJIN, CHUNG: CHUNG, GWIMUN: GWIMUN, HYEONG_GROUP: HYEONG_GROUP, HYEONG_PAIR: HYEONG_PAIR, JAHYEONG: JAHYEONG, PA: PA, GYEOKGAK: GYEOKGAK, STEM_HAP: STEM_HAP }
  };
  root.Gunghap = Gunghap;
  if (typeof module !== "undefined" && module.exports) module.exports = Gunghap;
})(typeof window !== "undefined" ? window : this);
