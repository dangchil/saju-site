// =====================================================================
// 상담 AI를 부르는 코드는 모두 이 파일에 있습니다.
//
// 지금은 "시험 모드": 사이트 주인이 자기 브라우저에 Claude API 키를 넣고,
// 브라우저에서 Claude API를 직접 부릅니다.
//  - 키는 이 브라우저의 localStorage 에만 저장합니다.
//  - 키는 api.anthropic.com 으로 가는 요청 머리말(x-api-key) 말고는 어디에도 보내지 않고,
//    화면이나 콘솔에도 찍지 않습니다.
//
// 나중에 공개할 때는 이 파일의 send() 안쪽만 바꾸면 됩니다.
// 예: Cloudflare Workers 주소로 { system, messages } 를 보내고, 키와 하루 횟수 제한은 Worker가 맡게.
// 화면(chat.html)은 ChatAPI.send() 만 부르므로 그대로 둬도 됩니다.
// =====================================================================
var ChatAPI = (function () {
  var API_URL = "https://api.anthropic.com/v1/messages";
  var MODEL = "claude-haiku-4-5";
  var MAX_TOKENS = 700;
  var KEY_STORE = "saju.test.apiKey";
  var FAKE_STORE = "saju.test.fake";

  // ---- 키 (이 브라우저에만) ----
  function getKey() { try { return localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { localStorage.setItem(KEY_STORE, String(k).trim()); } catch (e) {} }
  function clearKey() { try { localStorage.removeItem(KEY_STORE); } catch (e) {} }

  // ---- 가짜 답 스위치 (개발용) ----
  // 주소 끝에 ?fake=1 을 붙이거나 시험 설정에서 켜면, API를 부르지 않고 가짜 답을 돌려줍니다.
  function isFake() {
    if (/[?&]fake=1\b/.test(location.search)) return true;
    try { return localStorage.getItem(FAKE_STORE) === "1"; } catch (e) { return false; }
  }
  function setFake(on) { try { on ? localStorage.setItem(FAKE_STORE, "1") : localStorage.removeItem(FAKE_STORE); } catch (e) {} }

  // 시험 모드가 켜져 있는지 (키가 있거나 가짜 답 스위치가 켜져 있으면)
  function isTestMode() { return isFake() || !!getKey(); }

  // ---- 보내기 ----
  // system: 지시문·원국 정보·풀이 자료 글 (문자열 배열)
  // messages: [{ role: "user"|"assistant", content: "..." }, ...]
  // 돌려주는 값: { text, stopReason }
  function send(system, messages) {
    if (isFake()) return fakeReply(system, messages);
    var key = getKey();
    if (!key) return Promise.reject(new Error("시험 설정에서 API 키를 먼저 넣어 주세요."));
    return fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: system.map(function (t) { return { type: "text", text: t }; }),
        messages: messages
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) throw new Error(errorMessage(r.status, body));
        var text = (body.content || []).filter(function (b) { return b.type === "text"; })
          .map(function (b) { return b.text; }).join("\n").trim();
        if (body.stop_reason === "refusal") text = "이 질문에는 답하기 어려워요. 다른 이야기로 함께해 볼까요?";
        return { text: text, stopReason: body.stop_reason };
      });
    }, function () {
      throw new Error("Claude API에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.");
    });
  }

  function errorMessage(status, body) {
    var m = body && body.error && body.error.message ? " (" + body.error.message + ")" : "";
    if (status === 401) return "API 키가 맞지 않아요. 시험 설정에서 키를 다시 넣어 주세요.";
    if (status === 403) return "이 키로는 요청할 권한이 없어요." + m;
    if (status === 429) return "요청이 너무 많아요. 잠시 뒤에 다시 해 주세요.";
    if (status === 529 || status >= 500) return "Claude API가 잠시 바빠요. 조금 뒤에 다시 해 주세요.";
    return "요청이 실패했어요 (" + status + ")" + m;
  }

  // ---- 가짜 답: 넘긴 자료를 그대로 보여 주는 개발용 답 ----
  function fakeReply(system, messages) {
    var q = messages[messages.length - 1].content;
    var info = system[1] || "";
    function line(prefix) {
      var l = info.split("\n").filter(function (x) { return x.indexOf(prefix) === 0; })[0];
      return l ? l.slice(prefix.length).trim() : "(없음)";
    }
    var text =
      "(가짜 답이에요. 실제 AI를 부르지 않고, 넘길 자료가 잘 들어갔는지 보여 드려요.)\n\n" +
      "물어보신 말은 \"" + q + "\"이에요. 일간은 " + line("일간:") + "으로 넘어갔어요.\n\n" +
      "올해 세운은 " + line("올해 세운:") + ", 오늘 일진은 " + line("오늘 일진:") + "으로 계산해 넘겼어요. " +
      "이달 월건은 " + line("이달 월건(").replace(/^[^)]*\):\s*/, "") + "이에요.\n\n" +
      "지시문은 " + (system[0] || "").length + "자, 원국 정보는 " + info.length + "자, 풀이 자료는 " + (system[2] || "").length + "자예요. 실제 답에서는 이 자료 안에서만 이야기해요. 더 궁금한 것이 있으신가요?";
    return new Promise(function (res) { setTimeout(function () { res({ text: text, stopReason: "end_turn" }); }, 1400); });
  }

  return {
    MODEL: MODEL, MAX_TOKENS: MAX_TOKENS,
    getKey: getKey, setKey: setKey, clearKey: clearKey,
    isFake: isFake, setFake: setFake, isTestMode: isTestMode, send: send
  };
})();
