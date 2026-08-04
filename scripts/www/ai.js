/* 小雅雅思 · AI 点评层
 * 支持 OpenAI 兼容 chat/completions 与 Anthropic Claude Messages；
 * key/baseUrl/model/provider 全部本机存储，仅随请求发送
 */
(function () {
  "use strict";

  var STORE_KEY = "xy_ai_config";

  var DEFAULT_CONFIG = {
    provider: "openai", // openai(OpenAI 兼容) | claude(Messages API)
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5.6-terra",
    key: ""
  };

  var CLAUDE_BASE = "https://api.anthropic.com";

  // 2026-08 在售模型（全部支持 OpenAI 兼容 chat/completions）
  var PRESET_MODELS = [
    "gpt-5.6-sol",
    "gpt-5.6-terra",
    "gpt-5.6-luna",
    "gpt-5.5",
    "gpt-5.4-mini",
    "gpt-5.2",
    "gpt-5.2-chat-latest",
    "deepseek-v4-flash",
    "deepseek-v4-pro",
    "qwen-plus",
    "moonshot-v1-8k"
  ];

  var MODELS_STORE = "xy_ai_models"; // { baseUrl: [模型id...] } 缓存拉取结果

  // 2026-08 Claude 在售模型（Messages API，可自定义填写）
  var CLAUDE_MODELS = [
    "claude-opus-5",
    "claude-sonnet-4-6",
    "claude-3-7-sonnet"
  ];

  function loadConfig() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_CONFIG);
      var cfg = JSON.parse(raw);
      return Object.assign({}, DEFAULT_CONFIG, cfg);
    } catch (e) {
      return Object.assign({}, DEFAULT_CONFIG);
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
  }

  function hasKey() {
    return !!loadConfig().key;
  }

  /* ---------- 请求 ---------- */
  // 把 OpenAI 风格消息里的 system 拆成 Claude 的顶层 system + 其余消息
  function splitSystem(messages) {
    var sys = [], rest = [];
    (messages || []).forEach(function (m) {
      if (m.role === "system") sys.push(m.content || "");
      else rest.push({ role: m.role, content: m.content });
    });
    return { system: sys.join("\n"), messages: rest };
  }
  function callChat(messages, opts) {
    opts = opts || {};
    var cfg = loadConfig();
    if (!cfg.key) {
      return Promise.reject({ code: "no-key", message: "还没有配置 AI Key，请到「我的 → AI 设置」填写。" });
    }
    if (cfg.provider === "claude") {
      var base = String(cfg.baseUrl || CLAUDE_BASE).replace(/\/+$/, "");
      if (!/\/v1$/.test(base)) base += "/v1";
      var sp = splitSystem(messages);
      return fetch(base + "/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cfg.key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: opts.maxTokens || 1600,
          temperature: opts.temperature != null ? opts.temperature : 0.4,
          system: sp.system,
          messages: sp.messages
        })
      }).then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            var msg = (data.error && data.error.message) || ("HTTP " + res.status);
            throw { code: "http-" + res.status, message: "AI 请求失败：" + msg };
          });
        }
        return res.json();
      }).then(function (data) {
        var parts = (data.content || []).filter(function (b) { return b.type === "text"; })
          .map(function (b) { return b.text; });
        var content = parts.join("\n");
        if (!content) throw { code: "empty", message: "AI 没有返回内容，请重试。" };
        return content;
      });
    }
    var url = cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions";
    var body = {
      model: cfg.model,
      messages: messages,
      temperature: opts.temperature != null ? opts.temperature : 0.4,
      max_tokens: opts.maxTokens || 1600
    };
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.key
      },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          var msg = (data.error && data.error.message) || ("HTTP " + res.status);
          throw { code: "http-" + res.status, message: "AI 请求失败：" + msg };
        });
      }
      return res.json();
    }).then(function (data) {
      var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) throw { code: "empty", message: "AI 没有返回内容，请重试。" };
      return content;
    });
  }

  /* ---------- 模型列表拉取 ---------- */
  function modelsCache() {
    try {
      return JSON.parse(localStorage.getItem(MODELS_STORE) || "{}");
    } catch (e) { return {}; }
  }
  function saveModelsCache(cache) {
    try { localStorage.setItem(MODELS_STORE, JSON.stringify(cache)); } catch (e) {}
  }
  // GET {baseUrl}/models，带 Bearer；返回 id 数组，失败抛 {code, message}
  function fetchModels(baseUrl, key, provider) {
    if (!key) return Promise.reject({ code: "no-key", message: "请先填写 API Key 再拉取模型列表。" });
    var url = String(baseUrl || "").replace(/\/+$/, "");
    if (!url) return Promise.reject({ code: "no-url", message: "请先填写 API Base URL。" });
    if (provider === "claude") {
      return Promise.reject({ code: "no-models-api", message: "Claude 官方接口没有模型列表端点，请直接填写模型名（如 claude-sonnet-4-6）。" });
    }
    return fetch(url + "/models", {
      headers: { "Authorization": "Bearer " + key }
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          var msg = (data.error && data.error.message) || ("HTTP " + res.status);
          throw { code: "http-" + res.status, message: "拉取失败：" + msg };
        });
      }
      return res.json();
    }).then(function (data) {
      var ids = (data.data || []).map(function (m) { return m.id; }).filter(Boolean);
      if (!ids.length) throw { code: "empty", message: "接口没有返回可用模型。" };
      var cache = modelsCache();
      cache[url] = ids;
      saveModelsCache(cache);
      return ids;
    });
  }
  function cachedModels(baseUrl) {
    var url = String(baseUrl || "").replace(/\/+$/, "");
    return (modelsCache()[url] || []).slice();
  }

  /* ---------- 连接延迟测试 ---------- */
  // 对当前模型发一个最小请求（max_tokens 1），实测整体耗时毫秒
  function testLatency(baseUrl, model, key, provider) {
    if (!key) return Promise.reject({ code: "no-key", message: "请先填写 API Key 再测试。" });
    var url = String(baseUrl || "").replace(/\/+$/, "");
    if (!url) return Promise.reject({ code: "no-url", message: "请先填写 API Base URL。" });
    var t0 = Date.now();
    var req;
    if (provider === "claude") {
      if (!/\/v1$/.test(url)) url += "/v1";
      req = fetch(url + "/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: "hi" }], max_tokens: 1 })
      });
    } else {
      req = fetch(url + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + key
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 1
        })
      });
    }
    return req.then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          var msg = (data.error && data.error.message) || ("HTTP " + res.status);
          throw { code: "http-" + res.status, message: "测试失败：" + msg };
        });
      }
      return res.json();
    }).then(function () {
      return { ms: Date.now() - t0, model: model };
    });
  }

  /* ---------- JSON 容错解析 ---------- */
  function parseJSON(text) {
    var t = String(text || "").trim();
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    var start = t.indexOf("{");
    var end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      t = t.slice(start, end + 1);
    }
    try {
      return JSON.parse(t);
    } catch (e) {
      return null;
    }
  }

  /* ---------- 写作四维点评 ---------- */
  function reviewWriting(essay, prompt, taskType) {
    var isTask1 = taskType === "t1";
    var sys = [
      isTask1
        ? "你是一位严格的雅思写作考官（Academic Task 1，图表/流程/地图题）。"
        : "你是一位严格的雅思写作考官（Academic Task 2）。",
      isTask1
        ? "请按官方四项标准评分：Task Achievement (TA，概述是否准确、是否抓住主要特征与比较)、Coherence & Cohesion (CC)、Lexical Resource (LR)、Grammatical Range & Accuracy (G)。"
        : "请按官方四项标准评分：Task Achievement (TA)、Coherence & Cohesion (CC)、Lexical Resource (LR)、Grammatical Range & Accuracy (G)。",
      "评分范围 0-9，步长 0.5。",
      "只输出 JSON，不要任何其他文字，格式如下：",
      '{"ta":6.0,"cc":5.5,"lr":6.0,"g":5.5,"overall":6.0,',
      '"strengths":["优点1","优点2"],"weaknesses":["不足1","不足2"],',
      '"suggestions":["具体可执行的改进1","改进2"],',
      '"polish":[{"orig":"我作文里需要改写的原句","revised":"改写后的句子（保留原意、提升用词与句式）"}],"revised":"改写后的关键段落（150字以内）"}',
      "评语用简体中文，要具体到原文的例子，不要空话。",
      "polish 必须给 3 组，orig 必须逐字摘抄我作文中的原句，不能自己编。"
    ].join("\n");
    var user = "题目：\n" + prompt + "\n\n我的作文：\n" + essay;
    return callChat([
      { role: "system", content: sys },
      { role: "user", content: user }
    ], { temperature: 0.3, maxTokens: 2200 }).then(function (text) {
      var data = parseJSON(text);
      if (!data) throw { code: "parse", message: "AI 返回的内容无法解析，请重试。" };
      return data;
    });
  }

  /* ---------- 口语四维点评 ---------- */
  function reviewSpeaking(transcript, card, part) {
    var isPart3 = part === "p3";
    var sys = [
      isPart3
        ? "你是一位严格的雅思口语考官（Part 3 讨论环节）。"
        : "你是一位严格的雅思口语考官（Part 2）。",
      "请按官方四项标准评分：Fluency & Coherence (FC)、Pronunciation (PR)、Lexical Resource (LR)、Grammatical Range & Accuracy (GR)。",
      isPart3 ? "同时评估观点的深度与论证质量。" : "发音维度只能根据文本推断，如无法判断请给中性分并说明。",
      "评分范围 0-9，步长 0.5。",
      "只输出 JSON，不要任何其他文字，格式如下：",
      '{"fc":6.0,"pr":6.0,"lr":5.5,"gr":6.0,"overall":6.0,',
      '"strengths":["优点1"],"weaknesses":["不足1"],',
      '"suggestions":["具体可执行的改进1"],"model_answer":"150字内的示范回答",',
      '"expressions":[{"from":"用户原话里的平淡表达","to":"更地道的替代表达"}],"polish":[{"orig":"用户原句","revised":"同意思更流畅的英文句子"}]}',
      "评语用简体中文，要具体到原句，不要空话。",
      "expressions 给 2-4 条、polish 给 1-2 条，from/orig 必须逐字摘抄用户原话。"
    ].join("\n");
    var user = "话题卡：\n" + card.title + "\n提示点：" + card.points + "\n\n我的陈述转写：\n" + (transcript || "（用户未提供转写文本）");
    return callChat([
      { role: "system", content: sys },
      { role: "user", content: user }
    ], { temperature: 0.3, maxTokens: 2200 }).then(function (text) {
      var data = parseJSON(text);
      if (!data) throw { code: "parse", message: "AI 返回的内容无法解析，请重试。" };
      return data;
    });
  }

  /* ---------- 写作大纲 ---------- */
  function outlineWriting(prompt) {
    var sys = [
      "你是一位雅思写作提分教练（Academic Task 2）。",
      "帮用户先想清楚结构，再动笔。",
      "只输出 JSON，不要任何其他文字，格式如下：",
      '{"position":"一句话英文立场，含明确观点",',
      '"body":[{"point":"主体段观点句（英文）","support":"展开思路（中文，2-3句，提示论据/例子方向）"}],',
      '"conclusion":"结尾总结句（英文）"}',
      "body 给 3 个观点，观点之间角度要不同。"
    ].join("\n");
    var user = "题目：\n" + prompt;
    return callChat([
      { role: "system", content: sys },
      { role: "user", content: user }
    ], { temperature: 0.5, maxTokens: 1200 }).then(function (text) {
      var data = parseJSON(text);
      if (!data || !Array.isArray(data.body) || !data.body.length) {
        throw { code: "parse", message: "AI 返回的内容无法解析，请重试。" };
      }
      return data;
    });
  }

  /* ---------- 弱项分析（基于历史评分摘要） ---------- */
  function analyzeWeakness(summary) {
    var sys = [
      "你是一位雅思备考数据分析师，专门从用户的 AI 评分历史里找弱项。",
      "用户会给你一份评分统计摘要（只含各维度平均分、整体均值与趋势，没有作文全文）。",
      "只输出 JSON，不要任何其他文字，格式如下：",
      '{"weakest_skill":"writing|speaking","weakest_dims":[{"skill":"writing","dim":"lr","avg":5.5,"label":"词汇"}],"trend":"一句趋势判断","advice":["2-3条针对弱项的中文建议，具体可执行"],"drills":["2-3条配套练习，如背哪个词组、练哪种题型"]}',
      "weakest_dims 按薄弱程度排序，最多 3 条；dim 取值 ta/cc/lr/g（写作）、fc/pr/lr/gr（口语），label 给中文名（如 TA→任务完成度、CC→连贯衔接、LR→词汇、G/GR→语法、FC→流利度、PR→发音）。",
      "若某技能没有数据就不列入；整体没有数据时输出 {\"no_data\":true}。",
      "评语用简体中文，不要空话。"
    ].join("\n");
    return callChat([
      { role: "system", content: sys },
      { role: "user", content: "我的评分统计摘要：\n" + summary }
    ], { temperature: 0.3, maxTokens: 1200 }).then(function (text) {
      var data = parseJSON(text);
      if (!data) throw { code: "parse", message: "AI 返回的内容无法解析，请重试。" };
      return data;
    });
  }

  /* ---------- AI 备考教练（带用户投喂的知识库） ---------- */
  // 动作协议：教练可通过输出 JSON 动作直接操作软件（与供应商无关）
  var ACTION_CATALOG = [
    "你可以通过输出动作来直接帮用户操作软件。需要时，在你的回答末尾单独一行输出：\u3010动作\u3011{'op':'...','args':{...}}（可输出多个）",
    "可用动作：",
    "导航类：showView(view=home|words|writing|speaking|settings|wrong)；openCoach；openHealRoom；openKb；openWeakness；openExamDate；openWritingHistory；openSpeakingHistory；openWrongBook；closeCoach",
    "计划类：planAdd(label, task, dot=reading|writing|speaking|mint|cyan|coral)；planDoneByText(text=计划任务原文)；planClearDone()",
    "设置类：setExamDate(date=YYYY-MM-DD)；clearExamDate()；setTtsType(type=0美音|1英音)；bgReset()；bgVeil(value=50-90)",
    "词组类：selectSetByName(name)；hideSetByName(name)；restoreHiddenSets()；openSetManager()",
    "背词类：startReview()；flipCard()；markCurrentWord(done=true|false)；speakCurrentWord()",
    "发音类：speakText(text=要朗读的英文)",
    "统计类：getStats()",
    "危险动作（会弹确认框，用户点确认才执行）：clearAllData()；clearWrongBook()；clearWritingHistory()；clearSpeakingHistory()",
    "规则：只在你确认用户想要该操作时输出；每次输出动作后，等待用户或系统反馈动作结果，再继续回答；不要输出上面未列出的 op。"
  ].join("\n");

  // history: [{role:'user'|'assistant', content}] 本轮之前的对话
  function coachChat(question, summary, knowledge, history) {
    var sys = [
      "你是一位雅思备考教练，会结合用户的历史评分统计和用户自己投喂的学习资料（书籍摘录、笔记等）回答问题。",
      "用户历史评分统计摘要：\n" + summary,
      knowledge
        ? "用户投喂的学习资料（用中文说明资料的来源与用途，若与官方评分标准冲突，以官方标准为准；不要大段照抄资料原文）：\n" + knowledge
        : "用户还没有投喂学习资料。",
      "回答要求：用简体中文；先给结论再给理由；每个建议必须具体可执行（如：每周写 2 篇 Task 2 并逐段润色）；控制在 300 字以内；可以引用用户资料里的方法，但要结合用户的实际分数说人话。",
      ACTION_CATALOG
    ].join("\n");
    var msgs = (history || []).map(function (m) {
      return { role: m.role === "assistant" ? "assistant" : "user", content: m.content };
    });
    msgs.push({ role: "user", content: question });
    return callChat([
      { role: "system", content: sys }
    ].concat(msgs), { temperature: 0.5, maxTokens: 900 });
  }

  XY.AI = {
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    hasKey: hasKey,
    PRESET_MODELS: PRESET_MODELS,
    CLAUDE_MODELS: CLAUDE_MODELS,
    CLAUDE_BASE: CLAUDE_BASE,
    fetchModels: fetchModels,
    cachedModels: cachedModels,
    testLatency: testLatency,
    reviewWriting: reviewWriting,
    reviewSpeaking: reviewSpeaking,
    outlineWriting: outlineWriting,
    analyzeWeakness: analyzeWeakness,
    coachChat: coachChat
  };
})();
