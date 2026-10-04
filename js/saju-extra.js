// =====================================================================
// 원본 만세력 엔진(js/manse.js)에 없는 계산을 이 파일에 따로 둡니다.
// manse.js 는 원본과 똑같이 유지하기 위해 손대지 않습니다.
// 반드시 js/manse.js 를 먼저 불러온 뒤에 이 파일을 불러와야 합니다.
// =====================================================================

// ---- 사령(司令) 지장간 ----
// 월지의 지장간 가운데, 태어난 때가 절입 후 며칠째인지에 따라
// 그 달을 맡은 글자(사령)를 고릅니다.
// 아래 날수는 흔히 쓰는 월률분야(여기·중기·정기) 표입니다.
// 지장간 순서는 manse.js 의 HIDDEN 표와 같습니다.
// 학파마다 날수가 조금씩 다르니, 다른 표를 쓰려면 숫자만 바꾸면 됩니다.
var SARYEONG_DAYS = {
  0:  [10, 20],      // 자: 임 10일, 계 20일
  1:  [9, 3, 18],    // 축: 계 9일, 신 3일, 기 18일
  2:  [7, 7, 16],    // 인: 무 7일, 병 7일, 갑 16일
  3:  [10, 20],      // 묘: 갑 10일, 을 20일
  4:  [9, 3, 18],    // 진: 을 9일, 계 3일, 무 18일
  5:  [7, 7, 16],    // 사: 무 7일, 경 7일, 병 16일
  6:  [10, 9, 11],   // 오: 병 10일, 기 9일, 정 11일
  7:  [9, 3, 18],    // 미: 정 9일, 을 3일, 기 18일
  8:  [7, 7, 16],    // 신: 무 7일, 임 7일, 경 16일
  9:  [10, 20],      // 유: 경 10일, 신 20일
  10: [9, 3, 18],    // 술: 신 9일, 정 3일, 무 18일
  11: [7, 7, 16]     // 해: 무 7일, 갑 7일, 임 16일
};

// sj: getSaju() 결과. 돌려주는 값: { index: 월지 지장간 중 몇 번째인지(0부터), stem: 천간 번호, days: 절입 후 날수 }
function saryeong(sj) {
  var terms = allTerms(sj.birthYear - 1, sj.birthYear);
  var cur = null;
  for (var i = 0; i < terms.length; i++) {
    if (terms[i].t <= sj.bornMin) cur = terms[i]; else break;
  }
  var days = (sj.bornMin - cur.t) / 1440;
  var table = SARYEONG_DAYS[sj.m[1]];
  var acc = 0, idx = table.length - 1;
  for (var k = 0; k < table.length; k++) {
    acc += table[k];
    if (days < acc) { idx = k; break; }
  }
  return { index: idx, stem: HIDDEN[sj.m[1]][idx], days: days, jeol: cur.name };
}

// ---- 오늘 날짜 (한국 시각 기준) ----
function todayKST() {
  var d = new Date(Date.now() + 9 * 3600 * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

// ---- 어느 날의 일주 ----  돌려주는 값: [천간 번호, 지지 번호]
function dayPillar(y, m, d) {
  return getSaju(y, m, d, 12, 0).d;
}

// ---- 입력값으로 원국 계산 (원본 화면과 같은 방식: chartData + 자정 기준) ----
// 사령 계산을 위해 getSaju 결과도 함께 돌려줍니다.
function computeChart(digits, calType, gender) {
  var data = chartData(digits, calType, gender);
  var p = parse12(digits);
  var solar = toSolar(p[0], p[1], p[2], calType);
  var sj = getSaju(solar[0], solar[1], solar[2], p[3], p[4]);
  return { data: data, sj: sj, saryeong: saryeong(sj) };
}

var SajuExtra = {
  SARYEONG_DAYS: SARYEONG_DAYS, saryeong: saryeong, todayKST: todayKST,
  dayPillar: dayPillar, computeChart: computeChart
};
if (typeof module !== "undefined" && module.exports) { module.exports = SajuExtra; }
