// =====================================================================
// 궁합 계산 (두 원국 사이의 합·충·원진 등 판정)
// 근거: 사이트풀이초안/궁합/궁합원칙_확정.md
//   - 천간합: 일간끼리의 합 (갑기·을경·병신·정임·무계)
//   - 지지: 확정본 5장의 육합·삼합·방합, 6장 "계산용 표준 목록"의 충·원진·귀문·형·파·격각
//   - 조후: 확정본 3장. 계산 방법은 확정본에 없어 아래 temperature() 에 간단한 기준을 적어 두었다.
// js/manse.js 를 먼저 불러온 뒤 불러온다. manse.js 는 고치지 않는다.
// node 에서도 require 해서 쓸 수 있다 (tests/gunghap-test.js).
// =====================================================================
(function (root) {
  var E = (typeof ManseEngine !== "undefined") ? ManseEngine
    : (typeof require === "function" ? require("./manse.js") : null);
  var S_KO = E.S_KO, B_KO = E.B_KO, B_HA = E.B_HA;

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

  // ---- 조후 (확정본 3장) ----
  // 확정본에 계산 방법이 없어 이렇게 간단히 가늠한다:
  //   따뜻함 = 원국 글자 가운데 화(火)의 수 + (태어난 달이 사·오·미월이면 1)
  //   차가움 = 원국 글자 가운데 수(水)의 수 + (태어난 달이 해·자·축월이면 1)
  //   따뜻함이 차가움보다 2 이상 많으면 "따뜻한 원국", 반대면 "차가운 원국", 그 사이는 "고른 원국"
  // 한 사람은 따뜻하고 한 사람은 차가우면, 서로의 온도를 채워 주는 관계(조후)로 본다.
  var FIRE = 1, WATER = 4;
  function temperature(natal, timeUnknown) {
    var hot = 0, cold = 0;
    cols(timeUnknown).forEach(function (l) {
      [natal[l].stem_elem, natal[l].branch_elem].forEach(function (e) { if (e === FIRE) hot++; if (e === WATER) cold++; });
    });
    var m = branchIdx(natal, "월");
    if ([5, 6, 7].indexOf(m) >= 0) hot++;
    if ([11, 0, 1].indexOf(m) >= 0) cold++;
    var d = hot - cold;
    return { hot: hot, cold: cold, kind: d >= 2 ? "따뜻한" : (d <= -2 ? "차가운" : "고른") };
  }

  // ---- 서로 채워 주는 십성 (확정본 7장, 표는 쓰지 않음) ----
  // 내 원국(일간 제외)에 없는 십성 묶음을, 상대 원국 글자 가운데 2개 이상이 그 십성으로 작용하면 "채워 준다"고 본다.
  var GROUP_OF = { 비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성" };
  var GROUPS = ["비겁", "식상", "재성", "관성", "인성"];
  var B_MAIN = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];   // 지지의 본기 천간 (manse.js 의 B_MAIN 과 같다)
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
    var ta = temperature(a.natal, a.timeUnknown), tb = temperature(b.natal, b.timeUnknown);
    var johu = (ta.kind === "따뜻한" && tb.kind === "차가운") || (ta.kind === "차가운" && tb.kind === "따뜻한");
    return {
      stemHap: sh, positions: positions, combo: combo,
      temp: [ta, tb], johu: johu,
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
    temperature: temperature, tenFill: tenFill, analyze: analyze, unlock: unlock,
    LISTS: { YUKHAP: YUKHAP, SAMHAP: SAMHAP, BANGHAP: BANGHAP, WONJIN: WONJIN, CHUNG: CHUNG, GWIMUN: GWIMUN, HYEONG_GROUP: HYEONG_GROUP, HYEONG_PAIR: HYEONG_PAIR, JAHYEONG: JAHYEONG, PA: PA, GYEOKGAK: GYEOKGAK, STEM_HAP: STEM_HAP }
  };
  root.Gunghap = Gunghap;
  if (typeof module !== "undefined" && module.exports) module.exports = Gunghap;
})(typeof window !== "undefined" ? window : this);
