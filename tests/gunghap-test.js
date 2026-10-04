// 궁합 판정(js/gunghap.js)이 확정본 표준 목록과 같은지 지지 144쌍(12×12)과 천간 100쌍을 모두 확인하고,
// 조후(월지 기준) 판정과 조후를 주는 자리도 시험합니다.
// 사용법: node tests/gunghap-test.js
// js/gunghap.js 는 한자 목록으로 판정합니다. 이 시험은 같은 목록을 다른 방식(번호 셈식, 한글 이름)으로
// 따로 만들어 서로 대조합니다. 하나라도 다르면 종료 코드 1로 끝납니다.
"use strict";
var G = require("../js/gunghap.js");
var KO = "자축인묘진사오미신유술해";
var n = function (ch) { return KO.indexOf(ch); };
var has = function (list, x, y) { return list.some(function (p) { return (n(p[0]) === x && n(p[1]) === y) || (n(p[0]) === y && n(p[1]) === x); }); };

// ---- 기대값: 확정본 5장·6장을 셈식과 한글 이름으로 다시 적은 것 ----
function expected(x, y) {
  var r = [];
  var d = ((x - y) % 12 + 12) % 12;
  if ((x + y) % 12 === 1) r.push("육합");                                   // 자축 인해 묘술 진유 사신 오미
  if (x !== y && x % 4 === y % 4) r.push("삼합");                           // 신자진 해묘미 인오술 사유축
  if (x !== y && Math.floor(((x + 10) % 12) / 3) === Math.floor(((y + 10) % 12) / 3)) r.push("방합"); // 인묘진 사오미 신유술 해자축
  if (d === 6) r.push("충");                                               // 마주 보는 여섯 쌍
  if (has(["자미", "축오", "인유", "묘신", "진해", "사술"], x, y)) r.push("원진");
  if (has(["자유", "축오", "인미", "묘신", "진해", "사술"], x, y)) r.push("귀문");
  var hyeong = (x !== y && ("인사신".indexOf(KO[x]) >= 0 && "인사신".indexOf(KO[y]) >= 0 || "축술미".indexOf(KO[x]) >= 0 && "축술미".indexOf(KO[y]) >= 0))
    || has(["자묘"], x, y) || (x === y && "진오유해".indexOf(KO[x]) >= 0);
  if (hyeong) r.push("형");
  if (has(["자유", "축진", "인해", "묘오", "사신", "술미"], x, y)) r.push("파");
  if (d === 2 || d === 10) r.push("격각");                                  // 한 칸 건너
  return r;
}

var fail = 0, tally = {};
for (var x = 0; x < 12; x++) {
  for (var y = 0; y < 12; y++) {
    var got = G.branchRel(x, y), exp = expected(x, y);
    if (got.join(",") !== exp.join(",")) { fail++; console.log("다름  " + KO[x] + KO[y] + "  계산: [" + got + "]  기대: [" + exp + "]"); }
    if (G.branchRel(y, x).join(",") !== got.join(",")) { fail++; console.log("앞뒤가 다름  " + KO[x] + KO[y]); }
    got.forEach(function (k) { tally[k] = (tally[k] || 0) + 1; });
  }
}
// 순서쌍 개수: 두 글자가 다른 쌍은 앞뒤 두 번 세어진다 (형 = 인사신 3쌍×2 + 축술미 3쌍×2 + 자묘 2 + 자형 4)
var WANT = { 육합: 12, 삼합: 24, 방합: 24, 충: 12, 원진: 12, 귀문: 12, 형: 6 + 6 + 2 + 4, 파: 12, 격각: 24 };
Object.keys(WANT).forEach(function (k) {
  var ok = (tally[k] || 0) === WANT[k];
  if (!ok) fail++;
  console.log((ok ? "일치  " : "다름  ") + k + " 순서쌍 " + (tally[k] || 0) + "개 (기대 " + WANT[k] + ")");
});

// 천간합 100쌍: 갑기 을경 병신 정임 무계 = 번호 차이가 5
var sfail = 0;
for (var s = 0; s < 10; s++) for (var t = 0; t < 10; t++) if (G.stemHap(s, t) !== (Math.abs(s - t) === 5)) sfail++;
console.log((sfail ? "다름  " : "일치  ") + "천간합 100쌍" + (sfail ? " (" + sfail + "쌍 다름)" : ""));
fail += sfail;

// ---- 조후 (월지 기준) ----
// 원국을 간지 네 개(년·월·일·시)로 간단히 만든다. 예: mk("庚戌 丁亥 甲子 …") 처럼 천간+지지 한자 두 글자씩.
var S_HA = "甲乙丙丁戊己庚辛壬癸", S_KO = "갑을병정무기경신임계", B_HA = "子丑寅卯辰巳午未申酉戌亥";
function mk(s) {
  var g = s.split(" "), natal = {};
  ["년", "월", "일", "시"].forEach(function (l, i) {
    natal[l] = { stem_ko: S_KO[S_HA.indexOf(g[i][0])], branch_ko: KO[B_HA.indexOf(g[i][1])] };
  });
  return { natal: natal, timeUnknown: false };
}
var jfail = 0;
function check(name, got, want) {
  var ok = got === want;
  if (!ok) jfail++;
  console.log((ok ? "일치  " : "다름  ") + name + "  → " + got + (ok ? "" : "  (기대: " + want + ")"));
}
// 1) 자월생 + 상대 일지 午 → 일지로 조후를 줌
var A = mk("甲辰 丙子 庚申 戊寅"), B = mk("辛酉 庚寅 甲午 甲戌");
check("자월생의 판정", G.johuOf(A.natal).level, "아주 추움");
check("자월생 + 상대 일지 午", G.johuGive(B, A).label, "일지로 조후를 줌");
// 2) 해월·축년·자일 → 아주 추움 (해월이어도 같은 계절 글자가 더 있으면 올린다)
check("해월·축년·자일", G.johuOf(mk("癸丑 癸亥 甲子 甲戌").natal).level, "아주 추움");
check("해월만 (다른 겨울 글자 없음)", G.johuOf(mk("甲辰 乙亥 丙寅 丁卯").natal).level, "추움");
// 3) 묘월생 → 따지지 않음, 줄 글자를 찾지도 않음
var C = mk("甲辰 丁卯 庚申 戊寅");
check("묘월생", G.johuOf(C.natal).level, "따지지 않음");
check("묘월생은 상대 午가 있어도", String(G.johuGive(mk("丙午 丙午 丙午 丙午"), C).gives), "false");
// 4) 오월생 + 상대 월지 子 → 월지로 조후를 줌 (상대 일지·천간에는 조후 글자 없음)
var D = mk("甲辰 庚午 丙寅 戊戌"), E2 = mk("乙卯 丙子 戊寅 甲辰");
check("오월생의 판정", G.johuOf(D.natal).level, "아주 더움");
check("오월생 + 상대 월지 子", G.johuGive(E2, D).label, "월지로 조후를 줌");
// 5) 그 밖의 경계
check("사월 + 년지 未 → 아주 더움", G.johuOf(mk("乙未 辛巳 甲辰 丙寅").natal).level, "아주 더움");
check("사월만 → 더움", G.johuOf(mk("甲辰 己巳 甲寅 丙寅").natal).level, "더움");
check("더운 사주에 상대 일지 亥는 아직 조후 아님", String(G.johuGive(mk("甲辰 丙寅 丁亥 戊申"), D).gives), "false");
// 궁합에서 조후를 주는 자리는 상대의 일지·월지만 본다 (천간·년지·시지는 세지 않음)
check("상대 년간 丙·시간 丁만 있으면 조후를 주지 않음", String(G.johuGive(mk("丙辰 庚寅 甲申 丁卯"), A).gives), "false");
check("상대 일지 午 + 천간 丙·丁 → 일지만 셈", G.johuGive(mk("丁卯 甲寅 丙午 甲辰"), A).label, "일지로 조후를 줌");
check("상대 년지 午·시지 巳는 세지 않음", String(G.johuGive(mk("庚午 戊寅 甲申 辛巳"), A).gives), "false");
check("상대 일지·월지 둘 다 조후 글자 → 둘 다, 일지 먼저", G.johuGive(mk("甲辰 庚午 丁巳 甲辰"), A).labels.join(","), "일지로 조후를 줌,월지로 조후를 줌");
check("조후 글자의 십성 (받는 사람 일간 庚 기준 午 = 정관)", G.johuGive(B, A).hits[0].ten, "정관");
// 6) 조후와 원진이 겹치는 자리 (확정본 3장 축오): 내 일지 丑(자월생), 상대 일지 午
var R = G.analyze(mk("甲辰 丙子 癸丑 戊午"), mk("辛酉 庚寅 甲午 甲戌"));
check("일지 丑·午: 조후 + 원진 겹침", R.johuOverlap.map(function (o) { return o.pos + o.rel; }).join(","), "일원진");
console.log((jfail ? "다름  " : "일치  ") + "조후 시험" + (jfail ? " (" + jfail + "건 다름)" : " 모두 통과"));
fail += jfail;

console.log("\n지지 144쌍 확인" + (fail ? ", 문제 " + fail + "건" : ", 모두 일치"));
process.exit(fail ? 1 : 0);
