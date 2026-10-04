// 궁합 판정(js/gunghap.js)이 확정본 표준 목록과 같은지 지지 144쌍(12×12)과 천간 100쌍을 모두 확인합니다.
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

console.log("\n지지 144쌍 확인" + (fail ? ", 문제 " + fail + "건" : ", 모두 일치"));
process.exit(fail ? 1 : 0);
