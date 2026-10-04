// 원본 만세력(dangchil/manseryeok index.html)과 js/manse.js 의 계산 결과가 같은지 확인합니다.
// 사용법: node tests/verify.js <원본 index.html 경로>
//   예) git clone https://github.com/dangchil/manseryeok ../manseryeok
//       node tests/verify.js ../manseryeok/index.html
// 원본에서 쓰는 방식 그대로 chartData(생년월일시12자리, 양력/음력/윤달, 남/여)를 불러
// 원국·대운·세운 전체를 비교합니다. 하나라도 다르면 종료 코드 1로 끝납니다.
"use strict";
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var origPath = process.argv[2] || path.join(__dirname, "..", "..", "manseryeok", "index.html");
var html = fs.readFileSync(origPath, "utf8").replace(/\r\n/g, "\n");  // 원본은 CRLF 줄바꿈
var m = html.match(/<script id="engine">\n([\s\S]*?)<\/script>/);
if (!m) { console.error("원본에서 계산 엔진을 찾지 못했습니다."); process.exit(1); }
var origSrc = m[1];
var newSrc = fs.readFileSync(path.join(__dirname, "..", "js", "manse.js"), "utf8").replace(/\r\n/g, "\n");

function load(src) {
  var ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx;
}
var O = load(origSrc), N = load(newSrc);

// 0) 코드 자체가 같은지 (머리말 주석을 뺀 본문)
var body = newSrc.slice(newSrc.indexOf("// ---- 절기표"));
console.log("코드 본문 일치: " + (body === origSrc ? "예" : "아니오"));

function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = "0" + n; return n; }
function minToDigits(t) {          // 절기표의 UTC epoch 분 → KST 12자리
  var d = new Date((t + 540) * 60000);
  return pad(d.getUTCFullYear(), 4) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
         pad(d.getUTCHours()) + pad(d.getUTCMinutes());
}
function leapMonth(y) {
  var c = new O.KoreanLunarCalendar();
  return c._getLunarIntercalationMonth(c._getLunarData(y));
}

var cases = [];
function add(label, digits, cal, gender) { cases.push({ label: label, digits: digits, cal: cal, gender: gender }); }

// 1) 야자시(23:30~24:00)와 그 앞뒤
["199005152329", "199005152330", "199005152345", "199005152359", "199005160000", "199005160029",
 "202412312330", "202402292350"].forEach(function (d, i) {
  add("야자시 구간 " + d.slice(8, 10) + ":" + d.slice(10), d, "양력", i % 2 ? "여" : "남");
});
add("야자시 + 음력 입력", "198808152340", "음력", "남");

// 2) 절입 시각 전후 1시간 (입춘은 연주, 나머지는 월주가 바뀌는 경계)
[[2024, "입춘"], [1985, "경칩"], [2000, "청명"], [1971, "입하"], [2010, "망종"], [1955, "소서"],
 [2033, "입추"], [1999, "백로"], [2015, "한로"], [1962, "입동"], [2021, "대설"], [1994, "소한"]
].forEach(function (p, i) {
  var t = O.jeolgiAt(p[0], p[1]);
  add(p[0] + " " + p[1] + " 1시간 전", minToDigits(t - 60), "양력", i % 2 ? "남" : "여");
  add(p[0] + " " + p[1] + " 1시간 후", minToDigits(t + 60), "양력", i % 2 ? "여" : "남");
});
var tIp = O.jeolgiAt(2024, "입춘");
add("2024 입춘 1분 전", minToDigits(tIp - 1), "양력", "남");
add("2024 입춘 정각", minToDigits(tIp), "양력", "남");

// 3) 음력 윤달 (같은 날짜의 평달과 나란히)
[2020, 2023, 2017, 1987, 2001, 1944].forEach(function (y, i) {
  var lm = leapMonth(y);
  var d = String(y) + pad(lm) + "15" + (i % 2 ? "0830" : "2140");
  add(y + "년 윤" + lm + "월 (윤달)", d, "윤달", i % 2 ? "여" : "남");
  add(y + "년 " + lm + "월 (평달)", d, "음력", i % 2 ? "남" : "여");
});

// 4) 남녀 각각 — 같은 생년월일시로 순행/역행 비교 (양년·음년 모두)
["196703211015", "198411110505", "199302280000", "200708031800", "190002041200", "209912311130"
].forEach(function (d) {
  add("성별 비교 남 " + d, d, "양력", "남");
  add("성별 비교 여 " + d, d, "양력", "여");
});

// --cases 를 붙이면 사례 목록만 JSON으로 출력합니다 (화면 비교용).
if (process.argv.indexOf("--cases") >= 0) { console.log(JSON.stringify(cases)); process.exit(0); }

var pass = 0, fail = [];
cases.forEach(function (c) {
  var a, b, ea = null, eb = null;
  try { a = JSON.stringify(O.chartData(c.digits, c.cal, c.gender)); } catch (e) { ea = e.message; }
  try { b = JSON.stringify(N.chartData(c.digits, c.cal, c.gender)); } catch (e) { eb = e.message; }
  var ok = (ea === null && eb === null) ? a === b : ea === eb;
  var info = ea ? "오류: " + ea : (function () {
    var r = JSON.parse(a), n = r.natal;
    return ["년", "월", "일", "시"].map(function (k) { return n[k].stem_ko + n[k].branch_ko; }).join(" ") +
      " | " + r.direction + " 대운수 " + r.daeun_num;
  })();
  console.log((ok ? "일치  " : "불일치") + "  " + c.label + "  [" + c.digits + " " + c.cal + " " + c.gender + "]  " + info);
  if (ok) pass++; else fail.push(c);
});
console.log("\n총 " + cases.length + "건 중 " + pass + "건 일치");
if (fail.length || body !== origSrc) process.exit(1);
