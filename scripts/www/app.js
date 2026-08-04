/* 小雅雅思 · 应用逻辑
 * 数据层: localStorage（全部本机）
 * 模块: 路由 / 打卡 / 背词 / 写作 / 口语 / 进度 / 设置 / AI 点评
 */
(function () {
  "use strict";

  /* ================= 工具 ================= */
  var $ = function (id) { return document.getElementById(id); };

  function fmtDay(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  function today() { return fmtDay(new Date()); }
  /* ================= 今日计划 =================
   * 存储: { [date]: { rows: [ {id, label, task, done, dot} ] } }
   * 兼容迁移旧结构 { date: { w: {t,v,done}, wr:..., sp:... } }
   */
  var DOT_OPTIONS = ["reading", "writing", "speaking", "mint", "cyan", "coral"];

  function normalizeRow(r) {
    return {
      id: String(r.id || ("r" + Date.now())),
      label: r.label || "",
      task: r.task || "",
      done: !!r.done,
      dot: DOT_OPTIONS.indexOf(r.dot) >= 0 ? r.dot : "reading"
    };
  }
  function defaultPlanRows() {
    return [
      { id: "w", label: "词汇", task: "", done: false, dot: "reading" },
      { id: "wr", label: "写作", task: "", done: false, dot: "writing" },
      { id: "sp", label: "口语", task: "", done: false, dot: "speaking" }
    ];
  }
  function getPlan() {
    var days = Store.get(K.plan, {});
    var day = days[today()];
    if (day && Array.isArray(day.rows)) {
      return { rows: day.rows.map(normalizeRow) };
    }
    if (day) { // 迁移旧三键结构
      var legacy = [["w", "词汇", "reading"], ["wr", "写作", "writing"], ["sp", "口语", "speaking"]];
      var rows = [];
      legacy.forEach(function (pair) {
        var it = day[pair[0]];
        if (it == null) return;
        if (typeof it === "string") it = { t: "", v: it, done: false };
        rows.push({ id: pair[0], label: it.t || pair[1], task: it.v || "", done: !!it.done, dot: pair[2] });
      });
      if (rows.length) return { rows: rows };
    }
    return { rows: defaultPlanRows() };
  }
  function savePlanRows(rows) {
    var days = Store.get(K.plan, {});
    days[today()] = { rows: rows };
    Store.set(K.plan, days);
  }
  function upsertPlanRow(row) {
    var rows = getPlan().rows.slice();
    var found = false;
    rows = rows.map(function (r) {
      if (r.id === row.id) { found = true; return normalizeRow(Object.assign({}, r, row)); }
      return r;
    });
    if (!found) rows.push(normalizeRow(row));
    savePlanRows(rows);
  }
  function removePlanRow(id) {
    savePlanRows(getPlan().rows.filter(function (r) { return r.id !== id; }));
  }
  function togglePlanRowDone(id, el) {
    var becameDone = false;
    savePlanRows(getPlan().rows.map(function (r) {
      if (r.id === id) {
        becameDone = !r.done;
        return Object.assign({}, r, { done: !r.done });
      }
      return r;
    }));
    if (!becameDone) return;
    if (!el) el = document.querySelector('.plan-item[data-plan-id="' + id + '"]');
    if (el && el.classList.contains("plan-item")) animateRowDone(id, el);
  }
  // 完成动画三段式：对钩描边 → 向左抽走 → FLIP 塌缩
  function animateRowDone(id, el) {
    var pop = document.createElement("span");
    pop.className = "check-pop";
    pop.innerHTML = '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"></circle><path d="M15 27l7.5 7.5L37 19"></path></svg>';
    el.appendChild(pop);
    el.classList.add("is-done");
    setTimeout(function () {
      var dot = el.querySelector(".dot");
      var color = dot ? getComputedStyle(dot).backgroundColor : "rgb(124, 155, 255)";
      var r = el.getBoundingClientRect();
      dustBurst(r.left + r.width / 2, r.top + r.height / 2, color);
      el.classList.add("is-swept");
    }, 340);
    setTimeout(flipPlanList, 620);
    setTimeout(function () {
      toast("任务完成", "撤销", function () { undoPlanRowDone(id); }, 3000);
    }, 620);
  }
  // 撤销完成：行恢复 + 回到列表（带轻微入场动画）
  function undoPlanRowDone(id) {
    var row = planRowById(id);
    if (!row || !row.done) return;
    savePlanRows(getPlan().rows.map(function (r) {
      return r.id === id ? Object.assign({}, r, { done: false }) : r;
    }));
    renderHome();
    var restored = document.querySelector('.plan-item[data-plan-id="' + id + '"]');
    if (restored) {
      restored.classList.add("is-restored");
      setTimeout(function () { restored.classList.remove("is-restored"); }, 320);
    }
  }
  function flipPlanList() {
    var old = {};
    document.querySelectorAll("#planList .plan-item").forEach(function (r) {
      old[r.dataset.planId] = r.getBoundingClientRect();
    });
    renderHome();
    var moved = [];
    document.querySelectorAll("#planList .plan-item").forEach(function (r) {
      var o = old[r.dataset.planId];
      if (!o) return;
      var n = r.getBoundingClientRect();
      var dy = o.top - n.top;
      if (Math.abs(dy) > 1) moved.push({ r: r, dy: dy });
    });
    moved.forEach(function (m) {
      m.r.style.transition = "none";
      m.r.style.transform = "translateY(" + m.dy + "px)";
      void m.r.offsetHeight;
      m.r.style.transition = "transform 260ms var(--ease-out)";
      m.r.style.transform = "";
      setTimeout(function () { m.r.style.transition = ""; }, 320);
    });
  }
  function planDoneCount() {
    return getPlan().rows.filter(function (r) { return r.done; }).length;
  }
  function planRowById(id) {
    var found = null;
    getPlan().rows.forEach(function (r) { if (r.id === id) found = r; });
    return found;
  }
  function dayName(d) {
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
  }
  function greeting() {
    var h = new Date().getHours();
    if (h < 6) return "夜深了";
    if (h < 12) return "早上好";
    if (h < 18) return "下午好";
    return "晚上好";
  }
  function countWords(text) {
    var latin = (text.match(/[A-Za-z]+/g) || []).length;
    var cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    return latin + cjk;
  }
  function dayDiff(from, to) {
    var a = new Date(from + "T00:00:00");
    var b = new Date(to + "T00:00:00");
    return Math.round((b - a) / 86400000);
  }

  var Store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    }
  };

  // IndexedDB：大体积二进制（自定义背景图）不走 localStorage
  var IDB = {
    _db: null,
    _open: function () {
      if (IDB._db) return Promise.resolve(IDB._db);
      if (!("indexedDB" in window)) return Promise.reject(new Error("no-idb"));
      return new Promise(function (resolve, reject) {
        var req = indexedDB.open("xy-media", 1);
        req.onupgradeneeded = function () {
          var d = req.result;
          if (!d.objectStoreNames.contains("bg")) d.createObjectStore("bg");
        };
        req.onsuccess = function () { IDB._db = req.result; resolve(IDB._db); };
        req.onerror = function () { reject(req.error || new Error("idb-open")); };
      });
    },
    _tx: function (mode) {
      return IDB._open().then(function (db) {
        return db.transaction("bg", mode).objectStore("bg");
      });
    },
    put: function (key, value) {
      return IDB._tx("readwrite").then(function (s) {
        return new Promise(function (resolve, reject) {
          var r = s.put(value, key);
          r.onsuccess = function () { resolve(); };
          r.onerror = function () { reject(r.error || new Error("idb-put")); };
        });
      });
    },
    get: function (key) {
      return IDB._tx("readonly").then(function (s) {
        return new Promise(function (resolve, reject) {
          var r = s.get(key);
          r.onsuccess = function () { resolve(r.result); };
          r.onerror = function () { reject(r.error || new Error("idb-get")); };
        });
      });
    },
    del: function (key) {
      return IDB._tx("readwrite").then(function (s) {
        return new Promise(function (resolve, reject) {
          var r = s.delete(key);
          r.onsuccess = function () { resolve(); };
          r.onerror = function () { reject(r.error || new Error("idb-del")); };
        });
      });
    }
  };

  var K = {
    checkins: "xy_checkins",
    words: "xy_words",
    drafts: "xy_writing_drafts",
    wHistory: "xy_writing_history",
    sHistory: "xy_speaking_history",
    plan: "xy_plan",
    custom: "xy_custom_words",
    customSets: "xy_custom_sets",
    setOverrides: "xy_set_overrides",
    hiddenSets: "xy_hidden_sets",
    examDate: "xy_exam_date",
    coachKb: "xy_coach_kb"
  };

  var MOTIVATION = [
    "不积跬步，无以至千里。",
    "今天的辛苦，是明天的分数。",
    "把每一个 0.5 分，都挣回来。",
    "每天 30 分钟，就是最快的捷径。",
    "别怕慢，怕的是停。",
    "单词记得住，好成绩就稳得住。",
    "坚持的人，运气都不差。",
    "睡前的复习，是考场的底气。",
    "多练一道题，少慌一次场。",
    "你负责努力，结果交给时间。",
    "今天的 30 分钟，正变成明天的 7.0。",
    "小步快走，也是向前。",
    "把笔记翻旧，把分数看新。",
    "静下来，学进去，考得上。"
  ];

  var state = {
    view: "home",
    wordSet: XY.WORD_SETS[0].id,
    wordIndex: 0,
    wordFlipped: false,
    wordReview: false,       // 是否处于复习队列
    wordWrong: false,        // 是否处于错词本模式
    wrongIdx: -1,            // 错词本页：-1 列表 | >=0 复习中
    writingPromptId: null,
    writingTaskType: "t2",   // t1 图表题 | t2 议论文
    writingSeg: "t2",
    speakingIndex: 0,
    speakingPart1Index: 0,
    speakingSeg: "p2",       // p1 问答 | p2 卡片 | p3 追问
    speakingStage: "idle",   // idle | prep | speak
    timerEnd: null,
    rec: null,               // MediaRecorder
    recChunks: [],
    recUrl: null,
    recSeconds: 0,
    recAnalyser: null,       // 波形可视化
    recAudioCtx: null,
    recRaf: null,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    planTimers: {},   // 行id -> {kind: "countup"|"pomodoro", start, end}
    planTickId: null,
    pressFired: false, // 长按后抑制点击
    focusOpen: false
  };

  /* ================= 视图路由 ================= */
  var views = document.querySelectorAll(".view");
  var tabs = document.querySelectorAll(".tab");

  function showView(name) {
    state.view = name;
    views.forEach(function (v) {
      v.classList.toggle("is-active", v.id === "view-" + name);
    });
    tabs.forEach(function (t) {
      t.classList.toggle("is-active", t.dataset.view === name);
    });
    slideTabIndicator(name);
    window.scrollTo({ top: 0, behavior: state.reduced ? "auto" : "smooth" });
    if (name === "home") renderHome();
    if (name === "words") renderWords();
    if (name === "wrong") renderWrong();
    if (name === "writing") renderWritingList();
    if (name === "speaking") renderSpeaking();
    if (name === "progress") renderProgress();
    if (name === "settings") renderSettings();
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { showView(t.dataset.view); });
  });

  // 底部 Tab 滑动指示条：平移跟随激活项
  function slideTabIndicator(name) {
    var ind = $("tabbarIndicator");
    if (!ind) return;
    var active = null;
    tabs.forEach(function (t) { if (t.dataset.view === name) active = t; });
    if (!active) return;
    ind.style.transform =
      "translateX(" + (active.offsetLeft + (active.offsetWidth - ind.offsetWidth) / 2) + "px)";
  }
  document.querySelectorAll("[data-view]").forEach(function (el) {
    el.addEventListener("click", function () { showView(el.dataset.view); });
  });

  /* ================= toast / star ================= */
  var toastEl = $("toast");
  var toastTimer = null;
  var toastAction = null;
  function toast(msg, actionLabel, onAction, duration) {
    toastEl.textContent = msg;
    if (toastAction) { toastAction.remove(); toastAction = null; }
    if (actionLabel && typeof onAction === "function") {
      toastAction = document.createElement("button");
      toastAction.type = "button";
      toastAction.className = "toast-action";
      toastAction.textContent = actionLabel;
      toastAction.addEventListener("click", function () {
        var cb = onAction;
        dismissToast();
        cb();
      });
      toastEl.appendChild(toastAction);
    }
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(dismissToast, duration || 2200);
  }
  function dismissToast() {
    toastEl.classList.remove("is-show");
    if (toastAction) { toastAction.remove(); toastAction = null; }
  }

  function burst(x, y) {
    if (state.reduced) return;
    var star = document.createElement("span");
    star.className = "star-burst";
    star.style.left = (x - 12) + "px";
    star.style.top = (y - 12) + "px";
    document.body.appendChild(star);
    setTimeout(function () { star.remove(); }, 500);
  }

  // 任务完成：计划条化为粉尘飘散
  function dustBurst(x, y, color) {
    if (state.reduced) return;
    for (var i = 0; i < 26; i++) {
      var p = document.createElement("span");
      p.className = "dust-particle";
      p.style.background = color;
      var ang = Math.random() * Math.PI * 2;
      var dist = 30 + Math.random() * 75;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
      p.style.setProperty("--dy", (Math.sin(ang) * dist - 25 - Math.random() * 45).toFixed(1) + "px");
      p.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(1) + "deg");
      p.style.animationDelay = (Math.random() * 0.12).toFixed(2) + "s";
      p.style.animationDuration = (0.9 + Math.random() * 0.5).toFixed(2) + "s";
      document.body.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 1700); })(p);
    }
  }

  /* ================= 打卡 ================= */
  function getCheckins() { return Store.get(K.checkins, []); }
  function isChecked(d) { return getCheckins().indexOf(d) >= 0; }

  function calcStreak() {
    var days = {};
    getCheckins().forEach(function (d) { days[d] = true; });
    var d = new Date();
    if (!days[fmtDay(d)]) d.setDate(d.getDate() - 1); // 允许今天还没打
    var n = 0;
    while (days[fmtDay(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function weekDays() {
    var n = 0;
    var d = new Date();
    var start = d.getDay() === 0 ? -6 : 1 - d.getDay(); // 周一起
    for (var i = start; i <= 0; i++) {
      var c = new Date();
      c.setDate(d.getDate() + i);
      if (isChecked(fmtDay(c))) n++;
    }
    return n;
  }

  function doCheckin(btnEl) {
    if (isChecked(today())) {
      toast("今天已经打过卡了");
      return;
    }
    var list = getCheckins();
    list.push(today());
    Store.set(K.checkins, list);
    if (btnEl) {
      var r = btnEl.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + 8);
    }
    var sprout = $("sprout");
    if (sprout) {
      sprout.classList.remove("is-grown");
      void sprout.offsetWidth;
      sprout.classList.add("is-grown");
    }
    toast("打卡成功，连续 " + calcStreak() + " 天");
    refreshHead();
    renderHome();
  }

  /* ================= 头部 ================= */
  function refreshHead() {
    var n = calcStreak();
    var chip = $("streakChip");
    if (chip) chip.querySelector("b").textContent = n;
    var num = $("streakNum");
    if (num) num.textContent = n;
  }

  /* ================= 首页 ================= */
  // 学习记录: { s: "new"|"learning"|"mastered", at: 上次学习日期, n: 连续答对次数, m: 累计错误次数, bad: 是否进过错词本 }
  function wordRec(setId, word) {
    var w = Store.get(K.words, {});
    if (!w[setId]) w[setId] = {};
    var v = w[setId][word];
    if (typeof v === "boolean") { // 迁移旧结构
      var migrated = { s: v ? "mastered" : "learning", at: today(), n: v ? 3 : 0, m: 0, bad: false };
      w[setId][word] = migrated;
      Store.set(K.words, w);
      return migrated;
    }
    if (v && v.s) return { s: v.s, at: v.at || "", n: v.n || 0, m: v.m || 0, bad: !!v.bad };
    return { s: "new", at: "", n: 0, m: 0, bad: false };
  }
  function masteredCount() {
    var w = Store.get(K.words, {});
    var n = 0;
    Object.keys(w).forEach(function (setId) {
      Object.keys(w[setId] || {}).forEach(function (word) {
        var r = w[setId][word];
        if (typeof r === "boolean" ? r : (r && r.s === "mastered")) n++;
      });
    });
    return n;
  }
  function setMastered(setId) {
    var w = Store.get(K.words, {});
    var set = w[setId] || {};
    return Object.keys(set).filter(function (k) {
      var r = set[k];
      return typeof r === "boolean" ? r : (r && r.s === "mastered");
    }).length;
  }
  // 复习调度: learning 次日复习，mastered 每周维护一次
  function isDue(r) {
    return (r.s === "learning" && r.at && dayDiff(r.at, today()) >= 1) ||
           (r.s === "mastered" && r.at && dayDiff(r.at, today()) >= 7);
  }
  function dueWords(setId) {
    var set = currentSet();
    var out = [];
    set.words.forEach(function (wd) {
      var r = wordRec(setId, wd.w);
      if (isDue(r)) out.push(wd);
    });
    return out;
  }
  function dueCount(setId) {
    var w = Store.get(K.words, {});
    var set = w[setId] || {};
    var n = 0;
    Object.keys(set).forEach(function (k) {
      var r = set[k];
      if ((typeof r === "boolean" ? r : (r && r.s)) && r.at && dayDiff(r.at, today()) >= (r.s === "mastered" ? 7 : 1)) n++;
    });
    return n;
  }
  // 错词本：标记过"忘了"的词，跨全部背词
  function badWords() {
    var w = Store.get(K.words, {});
    var out = [];
    XY.WORD_SETS.forEach(function (set) {
      set.words.forEach(function (wd) {
        var r = wordRec(set.id, wd.w);
        if (r.bad) out.push({ set: set.id, wd: wd });
      });
    });
    return out;
  }

  function lastBand(key) {
    var list = Store.get(key, []);
    if (!list.length) return null;
    var last = list[list.length - 1];
    return last.review && last.review.overall != null ? last.review.overall : null;
  }

  function renderHome() {
    var dayIdx = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    $("greetTitle").textContent = MOTIVATION[dayIdx % MOTIVATION.length];

    var plan = getPlan();
    var list = $("planList");
    list.innerHTML = plan.rows.filter(function (r) { return !r.done; }).map(function (r) {
      var badge = planTimerBadge(r.id);
      return '<div class="plan-item' + (r.done ? " is-done" : "") + '" data-plan-id="' + escapeHtml(r.id) + '">' +
        '<span class="dot dot--' + r.dot + '"></span>' +
        '<div class="plan-body">' +
        '<div class="p-name">' + escapeHtml(r.label || "未命名") + "</div>" +
        '<div class="p-meta">' + (r.task ? escapeHtml(r.task) : "点这里写今天的计划") + "</div>" +
        "</div>" +
        badge +
        '<span class="edit-chip">编辑</span>' +
        "</div>";
    }).join("");

    // 今日词汇：按日期确定性轮换（同日稳定、隔天变化）
    var pool = [];
    var seen = {};
    XY.WORD_SETS.forEach(function (s) {
      s.words.forEach(function (wd) {
        var k = wd.w.toLowerCase();
        if (!seen[k]) { seen[k] = true; pool.push(wd); }
      });
    });
    $("homeWordsMeta").textContent = "全词库 · 已掌握 " + masteredCount() + " / " + pool.length + " 词";
    var row = $("homeWordRow");
    row.innerHTML = "";
    if (pool.length) {
      var start = (dayIdx * 3) % pool.length;
      for (var i = 0; i < 3; i++) {
        var wd = pool[(start + i) % pool.length];
        var c = document.createElement("span");
        c.className = "word-card";
        c.innerHTML = "<span style='color:var(--color-ink-2);'>" + escapeHtml(wd.w) + "</span><small>" + escapeHtml(wd.zh) + "</small>";
        row.appendChild(c);
      }
    }

    var bad = badWords();
    $("homeWrongSmall").textContent = bad.length
      ? bad.length + " 个错词 · 最近 " + escapeHtml(bad[0].wd.w)
      : "暂时没翻过车 ✓";
    var dot = $("homeWrongDot");
    if (bad.length) {
      dot.textContent = bad.length > 9 ? "9+" : bad.length;
      dot.style.display = "inline-flex";
    } else {
      dot.style.display = "none";
    }

    var wk = weakestInfo();
    $("homeCoachSmall").textContent = wk
      ? (wk.skill === "writing" ? "写作 " : "口语 ") + wk.label + " " + wk.avg.toFixed(1) + " 最弱"
      : "先完成 2 次 AI 点评";

    var ex = Store.get(K.examDate, "");
    if (!ex) $("homeExamSmall").textContent = "设个考试日吧";
    else {
      var ed = dayDiff(today(), ex);
      $("homeExamSmall").textContent = ed > 30 ? "长跑拼的是耐心"
        : ed > 10 ? "厚积薄发，别停"
        : ed > 3 ? "节奏比速度重要"
        : ed > 0 ? "稳住，就是胜利"
        : ed === 0 ? "今天，放平心态"
        : "辛苦了，去休息吧";
    }
    var dEl = $("homeExamDays");
    if (!ex) dEl.innerHTML = "—";
    else {
      var ed2 = dayDiff(today(), ex);
      dEl.innerHTML = ed2 > 0 ? ed2 + "<small>天</small>" : (ed2 === 0 ? "今<small>天</small>" : "终<small>点</small>");
    }

    $("modProgressSmall").textContent = "连续打卡 " + calcStreak() + " 天";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ================= 错词本（独立页） ================= */
  function setNameOf(id) {
    var ov = Store.get(K.setOverrides, {});
    if (ov[id]) return ov[id];
    for (var i = 0; i < XY.WORD_SETS.length; i++) {
      if (XY.WORD_SETS[i].id === id) return XY.WORD_SETS[i].name;
    }
    return "未知词组";
  }
  function dropBad(setId, word, keep) {
    var w = Store.get(K.words, {});
    if (!w[setId] || !w[setId][word]) return;
    var r = w[setId][word];
    r.bad = false;
    if (keep) {
      r.n = (r.n || 0) + 1;
      if (r.n >= 3) r.s = "mastered";
    } else {
      r.n = 0;
    }
    w[setId][word] = r;
    Store.set(K.words, w);
  }
  function renderWrong() {
    var bad = badWords();
    if (state.wrongIdx >= bad.length) state.wrongIdx = -1;
    var list = $("wrongList");
    var empty = $("wrongEmpty");
    var review = $("wrongReview");
    if (state.wrongIdx < 0) {
      review.classList.add("hidden");
      list.classList.remove("hidden");
      if (!bad.length) {
        list.innerHTML = "";
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");
      list.innerHTML = bad.map(function (b, i) {
        var rec = wordRec(b.set, b.wd.w);
        return '<div class="wrong-item" data-idx="' + i + '">' +
          '<div class="wrong-main">' +
          '<b>' + escapeHtml(b.wd.w) + "</b>" +
          (b.wd.phon ? "<i>" + escapeHtml(b.wd.phon) + "</i>" : "") +
          "</div>" +
          '<div class="wrong-zh">' + escapeHtml(b.wd.zh || b.wd.def || "") + "</div>" +
          '<div class="wrong-meta">' + escapeHtml(setNameOf(b.set)) + (rec.at ? " · " + rec.at : "") + "</div>" +
          '<button class="wrong-rm" data-idx="' + i + '" aria-label="移除">×</button>' +
          "</div>";
      }).join("");
      return;
    }
    empty.classList.add("hidden");
    list.classList.add("hidden");
    review.classList.remove("hidden");
    var b = bad[state.wrongIdx];
    $("wrongProgressLine").innerHTML =
      '<span class="review-tag">错词本 · 第 ' + (state.wrongIdx + 1) + " / " + bad.length + " 个</span>" +
      '<div class="progress"><i style="width:' + Math.round(state.wrongIdx / bad.length * 100) + '%"></i></div>';
    $("wrongW").textContent = b.wd.w;
    $("wrongPhon").textContent = b.wd.phon || "";
    $("wrongDef").textContent = b.wd.def || "";
    $("wrongZh").textContent = b.wd.zh || "";
    $("wrongFront").classList.remove("is-flipped");
    $("wrongFront").setAttribute("aria-pressed", "false");
  }

  /* ================= 背词 ================= */
  function renderWords() {
    if (isSetHidden(state.wordSet)) {
      for (var f = 0; f < XY.WORD_SETS.length; f++) {
        if (!isSetHidden(XY.WORD_SETS[f].id)) {
          state.wordSet = XY.WORD_SETS[f].id;
          state.wordIndex = 0;
          state.wordFlipped = false;
          state.wordReview = false;
          state.wordWrong = false;
          break;
        }
      }
    }
    var chips = $("wordSetChips");
    chips.innerHTML = "";
    XY.WORD_SETS.forEach(function (set) {
      if (isSetHidden(set.id)) return;
      var due = dueCount(set.id);
      var b = document.createElement("button");
      b.className = "chip" + (set.id === state.wordSet && !state.wordWrong ? " is-on" : "");
      b.textContent = setNameOf(set.id) + " · " + setMastered(set.id) + "/" + set.words.length + (due ? " · " + due + " 复习" : "");
      b.setAttribute("aria-pressed", String(set.id === state.wordSet && !state.wordWrong));
      b.addEventListener("click", function () {
        state.wordSet = set.id;
        state.wordIndex = 0;
        state.wordFlipped = false;
        state.wordReview = false;
        state.wordWrong = false;
        renderWords();
      });
      if (set.custom) {
        var x = document.createElement("span");
        x.className = "chip-x";
        x.textContent = "×";
        x.setAttribute("aria-label", "删除词组 " + set.name);
        x.addEventListener("click", function (e) {
          e.stopPropagation();
          if (!window.confirm("删除词组「" + set.name + "」？词组内单词与进度一并删除。")) return;
          deleteCustomSet(set.id);
          renderWords();
          renderHome();
          toast("已删除词组");
        });
        b.appendChild(x);
      }
      chips.appendChild(b);
    });

    var nb = document.createElement("button");
    nb.className = "chip chip--new";
    nb.textContent = "＋ 新建词组";
    nb.addEventListener("click", openNewSetSheet);
    chips.appendChild(nb);

    var due = dueWords(state.wordSet);
    var banner = $("wordReviewBanner");
    if (!state.wordReview && !state.wordWrong && due.length) {
      banner.classList.remove("hidden");
      $("wordReviewBannerText").textContent = due.length + " 个词到了复习时间（次日复习 · 每周巩固）";
    } else {
      banner.classList.add("hidden");
    }

    renderWordCard();
  }

  function currentSet() {
    for (var i = 0; i < XY.WORD_SETS.length; i++) {
      if (XY.WORD_SETS[i].id === state.wordSet) return XY.WORD_SETS[i];
    }
    return XY.WORD_SETS[0];
  }

  function startReview() {
    state.wordReview = true;
    state.wordWrong = false;
    state.wordIndex = 0;
    state.wordFlipped = false;
    renderWords();
  }

  function markWord(setId, word, done) {
    var w = Store.get(K.words, {});
    if (!w[setId]) w[setId] = {};
    var r = wordRec(setId, word);
    var next;
    if (done) {
      var n = r.s === "mastered" ? 3 : (r.n || 0) + 1;
      next = { s: n >= 3 ? "mastered" : "learning", at: today(), n: n, m: r.m || 0, bad: r.bad };
    } else {
      next = { s: "learning", at: today(), n: 0, m: (r.m || 0) + 1, bad: true };
    }
    w[setId][word] = next;
    Store.set(K.words, w);
  }

  function reviewQueueFor(setId) {
    if (!state.wordReview) return null;
    return dueWords(setId);
  }

  // 发音：有道在线音频（type=1 英音 / type=0 美音），失败回退本地 TTS
  function ttsType() {
    var t = localStorage.getItem("xy_tts_type");
    return t === "0" ? "0" : "1";
  }
  function speakText(text) {
    var audio = new Audio("https://dict.youdao.com/dictvoice?type=" + ttsType() + "&audio=" + encodeURIComponent(text));
    var used = false;
    function fb() {
      if (used) return;
      used = true;
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.92;
      var voices = window.speechSynthesis.getVoices() || [];
      var v = voices.filter(function (x) { return /^en/i.test(x.lang); })[0];
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    }
    audio.onerror = fb;
    audio.play().catch(fb);
  }

  var SPEAK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

  function renderWordCard() {
    var set = currentSet();
    var queue = state.wordReview ? dueWords(set.id) : null;
    var wrong = state.wordWrong ? badWords() : null;
    var words;
    if (wrong) words = wrong.map(function (e) { return { set: e.set, wd: e.wd }; });
    else words = (queue || set.words).map(function (wd) { return { set: set.id, wd: wd }; });
    var idx = state.wordIndex;
    var deck = $("wordDeck");
    if (!words.length) {
      if (wrong) {
        deck.innerHTML =
          '<div class="empty-state"><h3>错词本清空了！</h3>' +
          '<p>错的词都记住了，继续保持。</p>' +
          '<button class="btn btn--coral" id="wrongBack">返回背词</button></div>';
        $("wrongBack").addEventListener("click", function () {
          state.wordWrong = false;
          state.wordIndex = 0;
          renderWords();
        });
      } else if (set.custom) {
        deck.innerHTML =
          '<div class="empty-state"><h3>这个词组还是空的</h3>' +
          '<p>点下方「＋ 添加单词」，输入单词即可自动查询音标与释义。</p>' +
          '<button class="btn btn--coral" id="customEmptyAdd">＋ 添加单词</button></div>';
        $("customEmptyAdd").addEventListener("click", openAddWordSheet);
      } else {
        deck.innerHTML = '<div class="empty-state"><h3>这组词背完了！</h3><p>已掌握 ' + setMastered(set.id) + " / " + set.words.length + " 词。</p></div>";
      }
      return;
    }
    if (idx >= words.length) {
      if (queue) {
        state.wordReview = false;
        state.wordIndex = 0;
        state.wordFlipped = false;
        renderWords();
        toast("复习完成，掌握得更牢了");
      } else if (wrong) {
        deck.innerHTML =
          '<div class="empty-state"><h3>错词本清空了！</h3>' +
          '<p>错的词都记住了，继续保持。</p>' +
          '<button class="btn btn--coral" id="wrongBack">返回背词</button></div>';
        $("wrongBack").addEventListener("click", function () {
          state.wordWrong = false;
          state.wordIndex = 0;
          renderWords();
        });
      } else {
        deck.innerHTML =
          '<div class="empty-state"><h3>这组词背完了！</h3>' +
          '<p>已掌握 ' + setMastered(set.id) + " / " + set.words.length + " 词。</p>" +
          '<button class="btn btn--coral" id="wordSetRestart">再背一遍</button></div>';
        var rst = $("wordSetRestart");
        if (rst) rst.addEventListener("click", function () {
          state.wordIndex = 0;
          renderWordCard();
        });
      }
      return;
    }
    var entry = words[idx];
    var wd = entry.wd;
    var rec = wordRec(entry.set, wd.w);
    var days = rec.at ? dayDiff(rec.at, today()) : 0;
    var header;
    if (queue) header = '<span class="review-tag">复习 · 背于 ' + days + " 天前</span>";
    else if (wrong) header = '<span class="review-tag">错词本 · 第 ' + (idx + 1) + " / " + words.length + " 个</span>";
    else header = "<span>" + (idx + 1) + " / " + words.length + "</span>";
    var hasTTS = "speechSynthesis" in window;

    deck.innerHTML =
      '<div class="word-progress-line">' +
      header +
      '<div class="progress"><i style="width:' + Math.round(idx / words.length * 100) + '%"></i></div></div>' +
      '<div class="word-front-wrap">' +
      '<div class="word-front' + (state.wordFlipped ? " is-flipped" : "") + '" id="wordFront" role="button" tabindex="0" aria-label="点击看释义" aria-pressed="' + state.wordFlipped + '">' +
      '<span class="word-face word-face--front">' +
      '<span class="w-word">' + escapeHtml(wd.w) + "</span>" +
      '<span class="w-phon">' + escapeHtml(wd.phon || "") + "</span>" +
      '<span class="w-pos">' + escapeHtml(wd.pos || "") + "</span>" +
      (hasTTS ? '<button class="word-speak" aria-label="播放发音">' + SPEAK_SVG + "</button>" : "") +
      "</span>" +
      '<span class="word-face word-face--back">' +
      '<span class="w-pos">' + escapeHtml(wd.pos || "") + "</span>" +
      '<span class="w-def">' + escapeHtml(wd.def || "") + "</span>" +
      '<span class="w-zh">' + escapeHtml(wd.zh || "") + "</span>" +
      '<span class="w-example">' + escapeHtml(wd.ex || "") + "</span>" +
      '<span class="w-cn">' + escapeHtml(wd.cn || "") + "</span>" +
      '<span class="w-usage">' + escapeHtml(wd.usage || "") + "</span>" +
      (hasTTS ? '<button class="word-speak" aria-label="播放发音">' + SPEAK_SVG + "</button>" : "") +
      (set.custom && !queue && !wrong ? '<span class="w-remove" id="wordRemove">从词组移除</span>' : "") +
      "</span>" +
      "</div>" +
      "</div>" +
      '<div class="deck-actions">' +
      '<button class="btn btn--soft" id="wordAgain">' + (queue || wrong ? "忘了，再学" : "再学一遍") + "</button>" +
      '<button class="btn btn--coral" id="wordMastered">' + (queue || wrong ? "还记得" : "记住了") + "</button>" +
      "</div>";

    var front = $("wordFront");
    function toggleFlip() {
      state.wordFlipped = !state.wordFlipped;
      front.classList.toggle("is-flipped", state.wordFlipped);
      front.setAttribute("aria-pressed", String(state.wordFlipped));
    }
    front.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".word-speak")) return;
      toggleFlip();
    });
    front.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleFlip();
      }
    });

    if (hasTTS) {
      document.querySelectorAll(".word-speak").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          speakText(state.wordFlipped ? (wd.ex || wd.w) : wd.w);
        });
      });
    }

    var wkBtn = $("weaknessBtn");
    if (wkBtn) wkBtn.addEventListener("click", openWeaknessReport);

    var cardGo = function (done) {
      markWord(entry.set, wd.w, done);
      state.wordFlipped = false;
      state.wordIndex++;
      renderWordCard();
      if (!done) renderHome();
    };
    $("wordMastered").addEventListener("click", function () {
      var deckEl = $("wordDeck");
      if (state.reduced || !deckEl) {
        if (!state.reduced) {
          var r = front.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + 20);
        }
        cardGo(true);
        return;
      }
      var r = front.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + 20);
      deckEl.classList.add("is-exit-right");
      setTimeout(function () {
        deckEl.classList.remove("is-exit-right");
        cardGo(true);
        deckEl.classList.add("is-enter");
        setTimeout(function () { deckEl.classList.remove("is-enter"); }, 320);
      }, 230);
    });
    $("wordAgain").addEventListener("click", function () {
      var deckEl = $("wordDeck");
      var go = function () { cardGo(false); };
      if (state.reduced || !deckEl) { go(); return; }
      deckEl.classList.add("is-exit-left");
      setTimeout(function () {
        deckEl.classList.remove("is-exit-left");
        go();
        deckEl.classList.add("is-enter");
        setTimeout(function () { deckEl.classList.remove("is-enter"); }, 320);
      }, 230);
    });

    var rem = $("wordRemove");
    if (rem) {
      rem.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!window.confirm("从「" + set.name + "」移除「" + wd.w + "」？")) return;
        set.words = set.words.filter(function (x) { return x.w !== wd.w; });
        saveCustomSets();
        var w = Store.get(K.words, {});
        if (w[set.id]) { delete w[set.id][wd.w]; Store.set(K.words, w); }
        state.wordFlipped = false;
        renderWords();
        renderHome();
        toast("已移除 " + wd.w);
      });
    }
  }

  /* ================= 写作 ================= */
  var writingTimerId = null;
  var draftTimer = null;

  function writingBank() {
    var bank = [];
    XY.WRITING_PROMPTS.forEach(function (p) {
      bank.push({ id: p.id, title: p.title, task: p.task, prompt: p.prompt, seg: "t2" });
    });
    XY.WRITING_TASK1.forEach(function (p) {
      bank.push({ id: p.id, title: p.title, task: p.task, prompt: p.prompt, seg: "t1", type: p.type, chart: p.chart });
    });
    return bank;
  }

  function writingPrompt(id) {
    var bank = writingBank();
    for (var i = 0; i < bank.length; i++) if (bank[i].id === id) return bank[i];
    return null;
  }

  function renderWritingList() {
    $("writingEditor").classList.add("hidden");
    $("writingList").classList.remove("hidden");
    state.writingPromptId = null;

    var list = $("writingPromptList");
    list.innerHTML = "";
    writingBank().forEach(function (p) {
      if (p.seg !== state.writingSeg) return;
      var drafts = Store.get(K.drafts, {});
      var hist = Store.get(K.wHistory, []).filter(function (h) { return h.id === p.id; });
      var meta = [];
      if (p.seg === "t1") meta.push("图表题 · " + p.type);
      if (drafts[p.id]) meta.push("有草稿");
      if (hist.length) meta.push("上次 " + hist[hist.length - 1].review.overall.toFixed(1));
      var item = document.createElement("button");
      item.className = "list-item";
      item.innerHTML =
        '<div class="li-main"><div class="li-title">' + escapeHtml(p.title) + "</div>" +
        '<div class="li-meta">' + escapeHtml(p.task) + (meta.length ? " · " + meta.join(" · ") : "") + "</div></div>";
      item.addEventListener("click", function () { openWriting(p.id); });
      list.appendChild(item);
    });
  }

  function openWriting(id) {
    state.writingPromptId = id;
    $("writingList").classList.add("hidden");
    $("writingEditor").classList.remove("hidden");
    var p = writingPrompt(id);
    if (!p) return;
    state.writingTaskType = p.seg;

    $("writingTitle").textContent = p.title;
    $("writingTaskTag").textContent = p.task + " · " + (p.seg === "t1" ? "TASK 1 图表" : "TASK 2");
    $("writingPromptText").textContent = p.prompt;
    if (p.seg === "t1") {
      $("writingChart").classList.remove("hidden");
      $("writingChart").innerHTML = p.chart || "";
    } else {
      $("writingChart").classList.add("hidden");
      $("writingChart").innerHTML = "";
    }

    var drafts = Store.get(K.drafts, {});
    var essay = $("writingEssay");
    essay.value = drafts[id] || "";
    updateCount();

    // 计时：Task 1 建议 20 分钟，Task 2 建议 40 分钟
    var minutes = p.seg === "t1" ? 20 : 40;
    var left = minutes * 60;
    clearInterval(writingTimerId);
    writingTimerId = setInterval(function () {
      if (state.view !== "writing" || state.writingPromptId !== id) return;
      left--;
      if (left < 0) { clearInterval(writingTimerId); $("writingTimer").textContent = "时间到"; return; }
      var m = Math.floor(left / 60), s = left % 60;
      $("writingTimer").textContent = m + ":" + String(s).padStart(2, "0");
    }, 1000);
    $("writingTimer").textContent = minutes + ":00";

    $("writingResult").innerHTML = "";
    var submit = $("writingSubmit");
    submit.disabled = false;
    submit.textContent = "提交点评";
    var outline = $("writingOutline");
    if (outline) outline.style.display = p.seg === "t1" ? "none" : "";
  }

  function updateCount() {
    var n = countWords($("writingEssay").value);
    var target = state.writingTaskType === "t1" ? 150 : 250;
    var bar = $("writingRingBar");
    var p = Math.min(n / target, 1);
    bar.style.strokeDashoffset = String(100.53 * (1 - p));
    bar.classList.toggle("is-over", n >= target);
    $("writingCount").textContent = n + (n >= target ? " ✓" : "");
  }

  /* ================= 写作表达库 ================= */
  var EXPR_CATS = ["衔接词", "高分词伙", "万能句式", "自定义"];
  var EXPR_DEFAULT = [
    { cat: "衔接词", text: "Firstly, " },
    { cat: "衔接词", text: "Moreover, " },
    { cat: "衔接词", text: "Furthermore, " },
    { cat: "衔接词", text: "However, " },
    { cat: "衔接词", text: "Therefore, " },
    { cat: "衔接词", text: "In addition, " },
    { cat: "衔接词", text: "On the other hand, " },
    { cat: "衔接词", text: "For example, " },
    { cat: "衔接词", text: "As a result, " },
    { cat: "衔接词", text: "In conclusion, " },
    { cat: "高分词伙", text: "a significant increase" },
    { cat: "高分词伙", text: "a steady decline" },
    { cat: "高分词伙", text: "accounted for " },
    { cat: "高分词伙", text: "plays a vital role in " },
    { cat: "高分词伙", text: "exerts a considerable influence on " },
    { cat: "高分词伙", text: "it is widely acknowledged that " },
    { cat: "高分词伙", text: "a double-edged sword" },
    { cat: "高分词伙", text: "from my perspective, " },
    { cat: "高分词伙", text: "take ... into consideration" },
    { cat: "高分词伙", text: "as far as I am concerned, " },
    { cat: "万能句式", text: "The chart illustrates the changes in ... over the period from ... to ...." },
    { cat: "万能句式", text: "It is evident from the data that ..." },
    { cat: "万能句式", text: "While ..., it is equally true that ..." },
    { cat: "万能句式", text: "Not only ... but also ..." },
    { cat: "万能句式", text: "This is mainly because ..." },
    { cat: "万能句式", text: "To address this issue, ..." },
    { cat: "万能句式", text: "The statistics indicate that ..." },
    { cat: "万能句式", text: "It is worth noting that ..." }
  ];
  function exprLib() {
    return Store.get("xy_expr_lib", []);
  }
  function exprSave(list) {
    Store.set("xy_expr_lib", list);
  }
  function exprAll() {
    return EXPR_DEFAULT.concat(exprLib());
  }
  function openExprLibSheet() {
    var active = "衔接词";
    function render() {
      var custom = exprLib();
      var list = EXPR_DEFAULT.concat(custom).filter(function (e) { return e.cat === active; });
      var items = list.map(function (e, i) {
        var customIdx = custom.indexOf(e);
        return '<div class="expr-item">' +
          '<button class="expr-insert" data-i="' + i + '">' + escapeHtml(e.text) + "</button>" +
          (customIdx >= 0 ? '<button class="expr-del" data-c="' + customIdx + '" aria-label="删除">×</button>' : "") +
          "</div>";
      }).join("") || '<p class="plan-hint">这个分类还没有内容。</p>';
      openSheet("表达库",
        '<p class="plan-hint">点击插入到作文光标处。衔接词控制节奏，词伙与句式直接提升词汇分。</p>' +
        '<div class="chip-row" id="exprCats">' +
        EXPR_CATS.map(function (c) {
          return '<button class="chip' + (c === active ? " is-on" : "") + '" data-cat="' + c + '">' + c + "</button>";
        }).join("") + "</div>" +
        '<div class="expr-list">' + items + "</div>" +
        '<label class="field"><span>添加自定义表达</span>' +
        '<div style="display:flex;gap:var(--space-sm);">' +
        '<input class="input" id="exprNew" maxlength="120" placeholder="如：It is imperative that ..." style="flex:1;">' +
        '<button class="btn btn--coral btn--sm" id="exprAdd" style="flex:none;">添加</button></div></label>');
      $("exprCats").addEventListener("click", function (e) {
        var c = e.target.closest(".chip");
        if (!c) return;
        active = c.dataset.cat;
        render();
      });
      document.querySelectorAll(".expr-insert").forEach(function (b) {
        b.addEventListener("click", function () {
          var i = parseInt(b.dataset.i, 10);
          var item = list[i];
          if (!item) return;
          insertExprToEditor(item.text);
          closeSheet();
          toast("已插入");
        });
      });
      document.querySelectorAll(".expr-del").forEach(function (b) {
        b.addEventListener("click", function () {
          var ci = parseInt(b.dataset.c, 10);
          var list2 = exprLib().slice();
          list2.splice(ci, 1);
          exprSave(list2);
          toast("已删除");
          render();
        });
      });
      $("exprAdd").addEventListener("click", function () {
        var t = $("exprNew").value.trim();
        if (!t) { toast("先输入表达内容"); return; }
        var list3 = exprLib();
        list3.push({ cat: active, text: t });
        exprSave(list3);
        toast("已添加");
        render();
      });
    }
    render();
  }
  function insertExprToEditor(text) {
    var ta = $("writingEssay");
    var start = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
    var end = ta.selectionEnd != null ? ta.selectionEnd : start;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    var pos = start + text.length;
    if (ta.setSelectionRange) ta.setSelectionRange(pos, pos);
    ta.focus();
    updateCount();
  }

  function renderOutline(data) {
    var div = $("writingResult");
    var body = (data.body || []).map(function (b) {
      return "<li style='margin-inline-start:1.2em;margin-bottom:8px;'>" +
        "<b>" + escapeHtml(b.point) + "</b>" +
        (b.support ? "<p style='color:var(--color-ink-2);font-size:0.8125rem;margin-top:2px;'>" + escapeHtml(b.support) + "</p>" : "") +
        "</li>";
    }).join("");
    div.innerHTML =
      '<div class="card card--tint-mint">' +
      '<span class="t-label">AI 出的大纲 · 先想清楚再写</span>' +
      '<p class="hint" style="white-space:pre-wrap;">立场：' + escapeHtml(data.position || "") + "</p>" +
      '<ul class="review-block">' + body + "</ul>" +
      '<p class="hint" style="white-space:pre-wrap;">结尾：' + escapeHtml(data.conclusion || "") + "</p></div>";
  }

  function renderWritingReview(data) {
    var div = $("writingResult");
    var arrows = {
      ta: arrow(data.ta), cc: arrow(data.cc), lr: arrow(data.lr), g: arrow(data.g)
    };
    function arrow(v) {
      return "up"; // 简化: 只展示当前值，不对比历史
    }
    div.innerHTML =
      '<div class="card card--tint-pear" style="margin-top:4px;">' +
      '<span class="t-label">AI 四维点评 · 总分 ' + data.overall + '</span>' +
      scoreRow([
        ["Task Achievement", data.ta],
        ["Coherence", data.cc],
        ["Lexical", data.lr],
        ["Grammar", data.g]
      ]) +
      "</div></div>" +
      '<div class="card">' +
      '<span class="t-label">优点</span>' +
      '<ul class="review-block">' + liList(data.strengths) + "</ul></div>" +
      '<div class="card">' +
      '<span class="t-label">不足</span>' +
      '<ul class="review-block">' + liList(data.weaknesses) + "</ul></div>" +
      '<div class="card">' +
      '<span class="t-label">改进建议</span>' +
      '<ul class="review-block">' + liList(data.suggestions) + "</ul></div>" +
      (data.polish && data.polish.length
        ? '<div class="card card--tint-cyan"><span class="t-label">润色前后对照</span>' +
          data.polish.map(function (p) {
            return '<div class="polish-pair">' +
              '<div class="polish-box polish-box--orig"><span class="polish-tag">原句</span>' + escapeHtml(p.orig || "") + "</div>" +
              '<div class="polish-box polish-box--new"><span class="polish-tag">改写</span>' + escapeHtml(p.revised || "") + "</div></div>";
          }).join("") +
          "</div>"
        : data.revised
          ? '<div class="card card--tint-cyan"><span class="t-label">改写示范</span>' +
            '<div class="review-block" style="white-space:pre-wrap;font-size:0.875rem;line-height:1.65;">' + escapeHtml(data.revised) + "</div></div>"
          : "");
  }

  function scoreCell(name, v, extra) {
    var num = Number(v) || 0;
    var weak = !!(extra && extra.weak);
    var barCls = num >= 6.5 ? "up" : num >= 6 ? "flat" : "down";
    return '<div class="score-cell">' +
      '<span class="s-name">' + name + '</span>' +
      '<span class="s-val ' + barCls + (weak ? " down" : "") + '">' + num.toFixed(1) + "</span>" +
      '<span class="s-bar"><i class="' + barCls + '" style="width:' + Math.round(num / 9 * 100) + '%"></i></span>' +
      (weak ? '<span class="s-flag">弱项 · 优先练</span>' : "") +
      "</div>";
  }
  function weakestOf(items) {
    var min = 9;
    items.forEach(function (it) { min = Math.min(min, Number(it[1]) || 0); });
    return min;
  }
  function scoreRow(items) {
    var min = weakestOf(items);
    return '<div class="score-grid">' +
      items.map(function (it) {
        return scoreCell(it[0], it[1], { weak: (Number(it[1]) || 0) === min });
      }).join("") + "</div>";
  }
  function liList(arr) {
    if (!arr || !arr.length) return "<p>（无）</p>";
    return arr.map(function (t) {
      return "<li style='margin-inline-start:1.2em;'>" + escapeHtml(t) + "</li>";
    }).join("");
  }

  function writingResultToReview(data) {
    // 兼容字段缺失
    return {
      ta: data.ta != null ? data.ta : data.overall,
      cc: data.cc != null ? data.cc : data.overall,
      lr: data.lr != null ? data.lr : data.overall,
      g: data.g != null ? data.g : data.overall,
      overall: data.overall,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      suggestions: data.suggestions || [],
      revised: data.revised || "",
      polish: Array.isArray(data.polish) ? data.polish : []
    };
  }

  /* ================= 口语 ================= */
  var speakTimerId = null;

  function renderSpeaking() {
    var seg = state.speakingSeg;
    var card = XY.SPEAKING_CARDS[state.speakingIndex];
    var p1 = XY.SPEAKING_PART1[state.speakingPart1Index];

    $("part1Box").classList.toggle("hidden", seg !== "p1");
    $("part3Box").classList.toggle("hidden", seg !== "p3");
    $("part2Card").classList.toggle("hidden", seg !== "p2");
    $("speakingTimerRow").classList.toggle("hidden", seg !== "p2");
    $("recArea").classList.toggle("hidden", seg !== "p2");
    $("speakingTimerBtn").style.display = seg === "p2" ? "" : "none";
    $("speakingSubmit").style.display = seg === "p1" ? "none" : "";
    $("speakingTranscriptField").style.display = seg === "p1" ? "none" : "";

    if (seg === "p1") {
      $("part1Q").textContent = p1.q;
      $("part1Tips").innerHTML = p1.tips.map(function (t) {
        return '<span class="tip-chip">' + escapeHtml(t) + "</span>";
      }).join("");
    }
    if (seg === "p2") {
      $("speakingTitle").textContent = card.title;
      $("speakingPoints").textContent = "你应该说：" + card.points;
    }
    if (seg === "p3") {
      var qs = card.questions && card.questions.length ? card.questions : ["考官会围绕这个话题继续追问，准备好展开观点。"];
      $("part3Questions").innerHTML = qs.map(function (q, i) {
        return "<li style='margin-inline-start:1.2em;'>" + (i + 1) + ". " + escapeHtml(q) + "</li>";
      }).join("");
      $("speakingTranscriptField").querySelector("span").textContent = "回答转写文本（可选，把对追问的回答粘进来）";
    } else {
      $("speakingTranscriptField").querySelector("span").textContent = "陈述转写文本（可选，粘贴或输入）";
    }

    $("prepTime").textContent = "1:00";
    $("speakTime").textContent = "2:00";
    $("prepTime").classList.remove("is-running");
    $("speakTime").classList.remove("is-running");
    $("speakingTimerBtn").textContent = "开始准备";
    state.speakingStage = "idle";
    clearInterval(speakTimerId);
    $("speakingResult").innerHTML = "";
    $("speakingSubmit").disabled = false;
    $("speakingSubmit").textContent = "提交点评";
    stopDictation();
    stopRecording();
  }

  function speakingNext() {
    if (state.speakingSeg === "p1") {
      state.speakingPart1Index = (state.speakingPart1Index + 1) % XY.SPEAKING_PART1.length;
    } else {
      state.speakingIndex = (state.speakingIndex + 1) % XY.SPEAKING_CARDS.length;
    }
    renderSpeaking();
  }

  function runSpeakTimers(prep, speak) {
    clearInterval(speakTimerId);
    var t = prep;
    var phase = "prep";
    $("speakingTimerBtn").textContent = "停止";
    function tick() {
      if (phase === "prep") {
        $("prepTime").textContent = "0:" + String(t).padStart(2, "0");
        $("prepTime").classList.add("is-running");
        if (t <= 0) {
          phase = "speak";
          t = speak;
          $("prepTime").classList.remove("is-running");
          $("speakTime").classList.add("is-running");
          $("speakingTimerBtn").textContent = "停止";
          toast("准备结束，开始陈述");
        } else {
          t--;
        }
      } else {
        $("speakTime").textContent = Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
        if (t <= 0) {
          clearInterval(speakTimerId);
          $("speakTime").textContent = "0:00";
          $("speakTime").classList.remove("is-running");
          $("speakingTimerBtn").textContent = "时间到";
          toast("陈述结束");
        } else {
          t--;
        }
      }
    }
    tick();
    speakTimerId = setInterval(tick, 1000);
  }

  /* 录音波形可视化：AnalyserNode 时域数据绘制 */
  function stopWave() {
    if (state.recRaf) { cancelAnimationFrame(state.recRaf); state.recRaf = null; }
    if (state.recAudioCtx) {
      try { state.recAudioCtx.close(); } catch (e) {}
      state.recAudioCtx = null;
    }
    state.recAnalyser = null;
    var c = $("recWave");
    if (c) {
      var ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
    }
  }
  function drawWaveLoop() {
    var analyser = state.recAnalyser;
    if (!analyser) return;
    var buf = new Uint8Array(analyser.fftSize);
    var c = $("recWave").getContext("2d");
    var w = c.canvas.width, h = c.canvas.height;
    var strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-accent-2").trim() || "#8a8fa3";
    function frame() {
      if (!state.rec || state.rec.state === "inactive" || !state.recAnalyser) { stopWave(); return; }
      analyser.getByteTimeDomainData(buf);
      c.clearRect(0, 0, w, h);
      c.strokeStyle = strokeStyle;
      c.lineWidth = 2;
      c.beginPath();
      var n = buf.length;
      for (var x = 0; x < w; x++) {
        var v = (buf[Math.floor(x / w * n)] - 128) / 128;
        var y = h / 2 + v * (h / 2 - 8);
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
      state.recRaf = requestAnimationFrame(frame);
    }
    state.recRaf = requestAnimationFrame(frame);
  }

  /* 录音：仅本机，用于回放 */
  function stopRecording() {
    if (state.rec && state.rec.state !== "inactive") {
      try { state.rec.stop(); } catch (e) {}
    }
  }

  function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast("此浏览器不支持录音");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var mime = "audio/mp4";
      if (!window.MediaRecorder.isTypeSupported(mime)) mime = "audio/webm";
      var rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      state.rec = rec;
      state.recChunks = [];
      state.recSeconds = 0;
      rec.ondataavailable = function (e) {
        if (e.data && e.data.size) state.recChunks.push(e.data);
      };
      rec.onstop = function () {
        stream.getTracks().forEach(function (tr) { tr.stop(); });
        if (state.recUrl) URL.revokeObjectURL(state.recUrl);
        state.recUrl = URL.createObjectURL(new Blob(state.recChunks, { type: mime }));
        var au = $("recPlayback");
        au.src = state.recUrl;
        au.classList.remove("hidden");
        $("recBtn").classList.remove("is-recording");
        $("recStatus").textContent = "已录 " + state.recSeconds + " 秒 · 可回放";
      };
      rec.start(500);
      // 波形可视化
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          state.recAudioCtx = new AC();
          var src = state.recAudioCtx.createMediaStreamSource(stream);
          var analyser = state.recAudioCtx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.8;
          src.connect(analyser);
          state.recAnalyser = analyser;
          drawWaveLoop();
        }
      } catch (e) {}
      $("recBtn").classList.add("is-recording");
      $("recStatus").textContent = "录音中 · 0 秒";
      var t0 = Date.now();
      state.recMax = setInterval(function () {
        state.recSeconds = Math.round((Date.now() - t0) / 1000);
        $("recStatus").textContent = "录音中 · " + state.recSeconds + " 秒";
        if (state.recSeconds >= 120) stopRecording();
      }, 500);
    }).catch(function () {
      toast("无法访问麦克风，请检查权限");
    });
  }

  /* 实时听写：Web Speech API（不支持时按钮隐藏，回退手动粘贴） */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var srRec = null;
  var srActive = false;

  function stopDictation() {
    srActive = false;
    if (srRec) {
      try { srRec.stop(); } catch (e) {}
      srRec = null;
    }
    var b = $("dictateBtn");
    if (b) {
      b.textContent = "开始听写";
      b.classList.remove("is-on");
    }
  }

  function startDictation() {
    if (!SR) {
      toast("此浏览器不支持实时听写");
      return;
    }
    var rec;
    try {
      rec = new SR();
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = false;
    } catch (e) {
      toast("无法启动听写");
      return;
    }
    srRec = rec;
    rec.onresult = function (e) {
      var t = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) t += e.results[i][0].transcript + " ";
      }
      if (t) {
        var ta = $("speakTranscript");
        if (ta) {
          var prev = ta.value.replace(/\s+$/, "");
          ta.value = (prev ? prev + " " : "") + t.trim();
          ta.scrollTop = ta.scrollHeight;
        }
      }
    };
    rec.onend = function () {
      if (srActive && srRec) { // 连续模式：意外中断自动重启
        try { srRec.start(); } catch (e) { stopDictation(); }
        return;
      }
      stopDictation();
    };
    rec.onerror = function (e) {
      stopDictation();
      if (e.error === "not-allowed" || e.error === "service-not-allowed") toast("麦克风权限被拒绝，可手动粘贴转写");
      else if (e.error === "no-speech") toast("没有听到声音，再试一次");
      else if (e.error === "network") toast("听写需要联网，可手动粘贴转写");
      else toast("听写中断，可手动粘贴转写");
    };
    try {
      rec.start();
    } catch (e) {
      toast("听写启动失败");
      return;
    }
    srActive = true;
    var b = $("dictateBtn");
    if (b) {
      b.textContent = "停止听写";
      b.classList.add("is-on");
    }
  }

  function speakingSubmit() {
    var card = XY.SPEAKING_CARDS[state.speakingIndex];
    stopDictation();
    var transcript = $("speakTranscript").value.trim();
    var resultEl = $("speakingResult");
    var submitBtn = $("speakingSubmit");
    var seg = state.speakingSeg;
    var title = seg === "p3" ? "Part 3 追问（" + card.title + "）" : card.title;
    var points = seg === "p3" ? (card.questions || []).join("；") : card.points;

    if (!XY.AI.hasKey()) {
      resultEl.innerHTML =
        '<div class="empty-state"><h3>还没有配置 AI Key</h3>' +
        '<p>去「我的」页面填写 OpenAI 兼容接口的 Key，即可获得四维点评。</p>' +
        '<button class="btn btn--cyan" id="goSettingsBtn">去配置</button></div>';
      $("goSettingsBtn").addEventListener("click", function () { showView("settings"); });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "点评中…";
    resultEl.innerHTML = '<div class="loading-block"><span class="spinner"></span>AI 正在按官方四维评分…</div>';

    XY.AI.reviewSpeaking(transcript, { title: title, points: points }, seg).then(function (data) {
      var r = {
        fc: data.fc, pr: data.pr, lr: data.lr, gr: data.gr,
        overall: data.overall,
        strengths: data.strengths || [], weaknesses: data.weaknesses || [],
        suggestions: data.suggestions || [], model_answer: data.model_answer || "",
        expressions: Array.isArray(data.expressions) ? data.expressions : [],
        polish: Array.isArray(data.polish) ? data.polish : []
      };
      var hist = Store.get(K.sHistory, []);
      hist.push({ id: card.id, seg: seg, title: title, transcript: transcript, date: today(), review: r });
      Store.set(K.sHistory, hist);

      resultEl.innerHTML =
        '<div class="card card--tint-pear">' +
        '<span class="t-label">AI 四维点评 · 总分 ' + r.overall + '</span>' +
        scoreRow([
          ["流利与连贯", r.fc], ["发音", r.pr],
          ["词汇", r.lr], ["语法", r.gr]
        ]) +
        "</div>" +
        '<div class="card"><span class="t-label">优点</span><ul class="review-block">' + liList(r.strengths) + "</ul></div>" +
        '<div class="card"><span class="t-label">不足</span><ul class="review-block">' + liList(r.weaknesses) + "</ul></div>" +
        '<div class="card"><span class="t-label">改进建议</span><ul class="review-block">' + liList(r.suggestions) + "</ul></div>" +
        (r.expressions.length
          ? '<div class="card card--tint-lav"><span class="t-label">表达升级</span>' +
            r.expressions.map(function (e) {
              return '<div class="expr-pair"><span class="expr-from">' + escapeHtml(e.from || "") + "</span>" +
                '<span class="expr-arrow">→</span><span class="expr-to">' + escapeHtml(e.to || "") + "</span></div>";
            }).join("") +
            "</div>"
          : "") +
        (r.polish.length
          ? '<div class="card card--tint-cyan"><span class="t-label">句子润色</span>' +
            r.polish.map(function (p) {
              return '<div class="polish-pair">' +
                '<div class="polish-box polish-box--orig"><span class="polish-tag">原句</span>' + escapeHtml(p.orig || "") + "</div>" +
                '<div class="polish-box polish-box--new"><span class="polish-tag">改写</span>' + escapeHtml(p.revised || "") + "</div></div>";
            }).join("") +
            "</div>"
          : "") +
        (r.model_answer
          ? '<div class="card card--tint-cyan"><span class="t-label">示范回答</span>' +
            '<div class="review-block" style="white-space:pre-wrap;font-size:0.875rem;line-height:1.65;">' + escapeHtml(r.model_answer) + "</div></div>"
          : "");
      submitBtn.disabled = false;
      submitBtn.textContent = "重新点评";
      toast("口语点评完成，已存进度");
    }).catch(function (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "提交点评";
      resultEl.innerHTML = '<div class="empty-state"><h3>' + (err.code === "no-key" ? "未配置 Key" : "点评失败") + "</h3><p>" + escapeHtml(err.message || "请稍后重试") + "</p></div>";
    });
  }

  function openWritingHistory() {
    var hist = Store.get(K.wHistory, []);
    var body = hist.length
      ? hist.slice().reverse().map(function (h) {
        var score = h.review && h.review.overall != null ? h.review.overall.toFixed(1) : "-";
        return '<div class="mg-row hist-row" data-id="' + escapeHtml(h.id || "") + '">' +
          '<div class="mg-info"><b>' + escapeHtml(h.title || "写作") + "</b>" +
          '<i>' + escapeHtml(h.date || "") + " · 总分 " + score + "</i></div>" +
          '<span class="mg-go">重写 →</span></div>';
      }).join("")
      : '<div class="empty-state"><h3>还没有记录</h3><p>提交一次写作点评后，会保存在这里。</p></div>';
    openSheet("写作历史", '<div class="mg-list">' + body + "</div>");
    var list = document.querySelector(".mg-list");
    if (list) list.addEventListener("click", function (e) {
      var row = e.target.closest(".hist-row");
      if (!row) return;
      closeSheet();
      openWriting(row.dataset.id);
    });
  }

  function openSpeakingHistory() {
    var hist = Store.get(K.sHistory, []);
    var body = hist.length
      ? hist.slice().reverse().map(function (h) {
        var score = h.review && h.review.overall != null ? h.review.overall.toFixed(1) : "-";
        var snippet = String(h.transcript || "").replace(/\s+/g, " ").slice(0, 42);
        return '<div class="mg-row"><div class="mg-info">' +
          "<b>" + escapeHtml(h.title || "口语") + "</b>" +
          '<i>' + escapeHtml(h.date || "") + " · 总分 " + score + "</i>" +
          (snippet ? "<span style='display:block;font-size:0.75rem;color:var(--color-ink-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:22em;'>" + escapeHtml(snippet) + "…</span>" : "") +
          "</div></div>";
      }).join("")
      : '<div class="empty-state"><h3>还没有记录</h3><p>提交一次口语点评后，会保存在这里。</p></div>';
    openSheet("口语历史", '<div class="mg-list">' + body + "</div>");
  }

  /* ================= 进度 ================= */
  function renderProgress() {
    var n = calcStreak();
    $("progressStreak").textContent = n;
    $("progressTodayDone").textContent = isChecked(today()) ? "已" : "还没有";
    $("progressCheckinBtn").textContent = isChecked(today()) ? "已打卡" : "打卡";
    $("progressCheckinBtn").disabled = isChecked(today());

    $("statWords").textContent = masteredCount();
    $("statWriting").textContent = Store.get(K.wHistory, []).length;
    $("statSpeaking").textContent = Store.get(K.sHistory, []).length;

    // 月历
    var now = new Date();
    var y = now.getFullYear(), mo = now.getMonth();
    var first = new Date(y, mo, 1);
    var daysInMonth = new Date(y, mo + 1, 0).getDate();
    var startPad = first.getDay() === 0 ? 6 : first.getDay() - 1; // 周一开头
    var grid = $("calGrid");
    grid.innerHTML = "";
    ["一", "二", "三", "四", "五", "六", "日"].forEach(function (w) {
      var h = document.createElement("span");
      h.className = "cal-dot";
      h.style.background = "transparent";
      h.style.color = "var(--color-ink-3)";
      h.textContent = w;
      h.setAttribute("aria-hidden", "true");
      grid.appendChild(h);
    });
    for (var i = 0; i < startPad; i++) {
      var pad = document.createElement("span");
      pad.className = "cal-dot";
      pad.style.visibility = "hidden";
      grid.appendChild(pad);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(y, mo, d);
      var cell = document.createElement("span");
      cell.className = "cal-dot";
      cell.textContent = d;
      var key = fmtDay(date);
      if (isChecked(key)) cell.classList.add("is-done");
      if (key === today()) cell.classList.add("is-today");
      if (date.getTime() > now.getTime()) cell.classList.add("is-future");
      cell.setAttribute("aria-label", (mo + 1) + "月" + d + "日" + (isChecked(key) ? "，已打卡" : ""));
      grid.appendChild(cell);
    }

    // 最近评分
    var wb = lastBand(K.wHistory);
    $("bandWritingVal").textContent = wb != null ? wb.toFixed(1) : "—";
    $("bandWritingBar").style.width = (wb != null ? wb / 9 * 100 : 0) + "%";
    var sb = lastBand(K.sHistory);
    $("bandSpeakingVal").textContent = sb != null ? sb.toFixed(1) : "—";
    $("bandSpeakingBar").style.width = (sb != null ? sb / 9 * 100 : 0) + "%";

    // 历史
    var hist = [];
    Store.get(K.wHistory, []).forEach(function (h) {
      hist.push({ type: "写作", title: h.title, band: h.review.overall, date: h.date });
    });
    Store.get(K.sHistory, []).forEach(function (h) {
      hist.push({ type: "口语", title: h.title, band: h.review.overall, date: h.date });
    });
    hist.sort(function (a, b) { return b.date < a.date ? -1 : 1; });
    hist = hist.slice(0, 8);
    var hList = $("historyList");
    if (!hist.length) {
      hList.innerHTML = '<div class="empty-state"><p>还没有点评记录。写完一篇作文或说一段口语，AI 点评会自动出现在这里。</p></div>';
      return;
    }
    hList.innerHTML = "";
    hist.forEach(function (h) {
      var item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML =
        '<div class="li-main"><div class="li-title">' + escapeHtml(h.title) + "</div>" +
        '<div class="li-meta">' + h.type + " · " + escapeHtml(h.date) + "</div></div>" +
        '<span class="li-go">' + h.band.toFixed(1) + "</span>";
      hList.appendChild(item);
    });
  }

  /* ================= 设置 ================= */
  /* ================= 自定义背景 ================= */
  var bgObjectUrl = null;
  var BG_MAX_EDGE = 1280;
  var BG_MAX_BYTES = 400 * 1024;

  function applyBackground() {
    return IDB.get("bgBlob").then(function (blob) {
      if (!blob) { clearBackground(); return; }
      if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
      bgObjectUrl = URL.createObjectURL(blob);
      document.body.classList.add("has-bg");
      document.body.style.setProperty("--bg-image", "url(" + bgObjectUrl + ")");
      document.body.style.setProperty("--bg-veil", bgVeilValue() / 100);
    }).catch(function () {});
  }
  function clearBackground() {
    if (bgObjectUrl) { URL.revokeObjectURL(bgObjectUrl); bgObjectUrl = null; }
    document.body.classList.remove("has-bg");
    document.body.style.removeProperty("--bg-image");
  }
  function bgVeilValue() {
    var v = parseInt(Store.get("xy_bg_veil", 72), 10);
    if (!(v >= 50 && v <= 90)) v = 72;
    return v;
  }
  function syncBgUi() {
    var veil = bgVeilValue();
    var range = $("bgVeilRange");
    if (range) {
      range.value = veil;
      $("bgVeilVal").textContent = veil + "%";
    }
    var preview = $("bgPreview");
    if (preview) {
      if (document.body.classList.contains("has-bg")) {
        preview.classList.add("has-img");
        preview.style.backgroundImage = "var(--bg-image)";
        preview.textContent = "";
      } else {
        preview.classList.remove("has-img");
        preview.style.backgroundImage = "";
        preview.textContent = "暂无背景 · 当前为默认纸色";
      }
    }
  }
  function processBgFile(file, cb) {
    function draw(bmp) {
      var w = bmp.width, h = bmp.height;
      if (!w || !h) { cb(null); return; }
      var scale = Math.min(1, BG_MAX_EDGE / Math.max(w, h));
      var canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
      if (bmp.close) bmp.close();
      var q = 0.82;
      function encode() {
        canvas.toBlob(function (blob) {
          if (blob && blob.size > BG_MAX_BYTES && q > 0.58) { q -= 0.12; encode(); }
          else cb(blob);
        }, "image/jpeg", q);
      }
      encode();
    }
    function fallback() {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); draw(img); };
      img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
      img.src = url;
    }
    if ("createImageBitmap" in window && file.type !== "image/svg+xml") {
      createImageBitmap(file, { imageOrientation: "from-image" })
        .then(draw, fallback);
    } else fallback();
  }
  function onBgFileChange() {
    var input = $("bgFileInput");
    var file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      toast("请选择图片文件"); return;
    }
    if (file.size > 12 * 1024 * 1024) { toast("图片过大，请选择 12MB 以内"); return; }
    toast("正在压缩并保存…");
    processBgFile(file, function (blob) {
      if (!blob) { toast("无法读取这张图片"); return; }
      IDB.put("bgBlob", blob).then(function () {
        return applyBackground();
      }).then(function () {
        syncBgUi();
        toast("背景已更换");
      }).catch(function () {
        toast("保存失败，当前浏览器不支持本地存储");
      });
    });
  }
  function onBgReset() {
    IDB.del("bgBlob").then(function () {
      clearBackground();
      syncBgUi();
      toast("已恢复默认背景");
    }).catch(function () {
      toast("没有已保存的背景");
    });
  }
  function onBgVeilInput() {
    var v = parseInt($("bgVeilRange").value, 10);
    Store.set("xy_bg_veil", v);
    $("bgVeilVal").textContent = v + "%";
    if (document.body.classList.contains("has-bg")) {
      document.body.style.setProperty("--bg-veil", v / 100);
    }
  }

  /* ---------- 背景裁剪 ---------- */
  var crop = null;
  var CROP_MAX_ZOOM = 5;

  function openCropOverlay(file, onDone) {
    var stage = $("cropStage");
    var box = $("cropBox");
    var img = $("cropImg");
    var o = $("cropOverlay");
    var url = URL.createObjectURL(file);
    o.classList.add("is-open");
    o.setAttribute("aria-hidden", "false");
    // 先显示再量尺寸：隐藏时 rect 为 0，会导致裁剪框与缩放失效
    var rect = stage.getBoundingClientRect();
    crop = {
      file: file,
      onDone: onDone,
      stageW: rect.width,
      stageH: rect.height,
      zoom: 1,
      tx: 0,
      ty: 0,
      ratio: "9:16",
      freeW: 0,
      freeH: 0,
      pointers: {},
      mode: null, // pan | pinch | resize
      start: {},
      img: img,
      box: box
    };
    img.onload = function () {
      URL.revokeObjectURL(url);
      crop.imgW = img.naturalWidth;
      crop.imgH = img.naturalHeight;
      crop.scale0 = Math.max(crop.stageW / crop.imgW, crop.stageH / crop.imgH);
      crop.zoom = 1;
      crop.tx = 0;
      crop.ty = 0;
      setCropRatio("9:16");
      applyCropTransform();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      toast("无法读取这张图片");
      closeCropOverlay();
    };
    img.src = url;
    // 裁剪框默认固定居中，比例模式框不随内容滚动
    bindCropOnce();
  }
  function closeCropOverlay() {
    var o = $("cropOverlay");
    o.classList.remove("is-open");
    o.setAttribute("aria-hidden", "true");
    crop = null;
  }
  function setCropRatio(ratio) {
    if (!crop) return;
    crop.ratio = ratio;
    document.querySelectorAll("#cropRatio .chip").forEach(function (c) {
      c.classList.toggle("is-on", c.dataset.ratio === ratio);
    });
    var box = $("cropBox");
    var sw = crop.stageW, sh = crop.stageH;
    if (ratio === "9:16") {
      var w = sw * 0.45;
      var h = w * 16 / 9;
      if (h > sh * 0.92) { h = sh * 0.92; w = h * 9 / 16; }
      box.style.width = w + "px";
      box.style.height = h + "px";
      box.classList.remove("is-free");
    } else if (ratio === "1:1") {
      var s = Math.min(sw, sh) * 0.62;
      box.style.width = s + "px";
      box.style.height = s + "px";
      box.classList.remove("is-free");
    } else {
      if (!crop.freeW) {
        var curW = parseFloat(box.style.width) || Math.min(sw, sh) * 0.62;
        var curH = parseFloat(box.style.height) || curW * 0.8;
        crop.freeW = curW;
        crop.freeH = curH;
      }
      box.style.width = crop.freeW + "px";
      box.style.height = crop.freeH + "px";
      box.classList.add("is-free");
    }
  }
  function applyCropTransform() {
    var img = crop.img;
    img.style.transform = "translate(-50%, -50%) translate(" + crop.tx + "px, " + crop.ty + "px) scale(" + (crop.scale0 * crop.zoom) + ")";
    img.style.width = crop.imgW + "px";
    img.style.height = crop.imgH + "px";
  }
  function cropResetView() {
    crop.zoom = 1;
    crop.tx = 0;
    crop.ty = 0;
    applyCropTransform();
  }

  var cropBound = false;
  function bindCropOnce() {
    if (cropBound) return;
    cropBound = true;
    var stage = $("cropStage");
    var box = $("cropBox");

    stage.addEventListener("pointerdown", function (e) {
      if (!crop) return;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      crop.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(crop.pointers).length;
      if (n === 2) {
        crop.mode = "pinch";
        var ps = Object.values(crop.pointers);
        crop.start.dist = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
        crop.start.zoom = crop.zoom;
      } else if (n === 1) {
        if (e.target.closest && e.target.closest("#cropHandle") && crop.ratio === "free") {
          crop.mode = "resize";
        } else {
          crop.mode = "pan";
          crop.start.x = e.clientX;
          crop.start.y = e.clientY;
          crop.start.tx = crop.tx;
          crop.start.ty = crop.ty;
        }
      }
    });
    stage.addEventListener("pointermove", function (e) {
      if (!crop || !crop.mode) return;
      var cur = crop.pointers[e.pointerId];
      if (!cur) return;
      var dx = e.clientX - cur.x;
      var dy = e.clientY - cur.y;
      cur.x = e.clientX;
      cur.y = e.clientY;
      if (crop.mode === "pan") {
        crop.tx = crop.start.tx + (e.clientX - crop.start.x);
        crop.ty = crop.start.ty + (e.clientY - crop.start.y);
        applyCropTransform();
      } else if (crop.mode === "pinch") {
        var ps = Object.values(crop.pointers);
        if (ps.length === 2) {
          var dist = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
          crop.zoom = Math.min(CROP_MAX_ZOOM, Math.max(1, crop.start.zoom * dist / Math.max(1, crop.start.dist)));
          applyCropTransform();
        }
      } else if (crop.mode === "resize") {
        var nw = Math.max(60, parseFloat(box.style.width) + dx);
        var nh = Math.max(60, parseFloat(box.style.height) + dy);
        crop.freeW = nw;
        crop.freeH = nh;
        box.style.width = nw + "px";
        box.style.height = nh + "px";
      }
    });
    function endPointer(e) {
      delete crop.pointers[e.pointerId];
      var n = Object.keys(crop.pointers).length;
      if (n < 2) crop.mode = n === 1 ? "pan" : null;
    }
    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);

    stage.addEventListener("wheel", function (e) {
      if (!crop) return;
      e.preventDefault();
      var f = e.deltaY < 0 ? 1.12 : 0.89;
      crop.zoom = Math.min(CROP_MAX_ZOOM, Math.max(1, crop.zoom * f));
      applyCropTransform();
    }, { passive: false });

    stage.addEventListener("dblclick", function (e) {
      if (!crop) return;
      e.preventDefault();
      cropResetView();
    });

    document.querySelectorAll("#cropRatio .chip").forEach(function (c) {
      c.addEventListener("click", function () { if (crop) setCropRatio(c.dataset.ratio); });
    });
    $("cropReset").addEventListener("click", function () {
      if (!crop) return;
      cropResetView();
      setCropRatio(crop.ratio);
    });
    $("cropCancel").addEventListener("click", closeCropOverlay);
    $("cropConfirm").addEventListener("click", function () {
      if (!crop || !crop.onDone) return;
      cropConfirmApply();
    });
  }

  // 按裁剪框在原图上取区域，走压缩管线
  function cropConfirmApply() {
    var img = crop.img;
    var scale = crop.scale0 * crop.zoom;
    var sw = crop.stageW, sh = crop.stageH;
    var imgCX = sw / 2 + crop.tx;
    var imgCY = sh / 2 + crop.ty;
    var box = crop.box;
    var bw = parseFloat(box.style.width) || sw * 0.45;
    var bh = parseFloat(box.style.height) || bw * 16 / 9;
    var sx = (sw / 2 - bw / 2 - imgCX) / scale + crop.imgW / 2;
    var sy = (sh / 2 - bh / 2 - imgCY) / scale + crop.imgH / 2;
    var cw = bw / scale;
    var ch = bh / scale;
    if (sx < 0) { cw += sx; sx = 0; }
    if (sy < 0) { ch += sy; sy = 0; }
    cw = Math.min(cw, crop.imgW - sx);
    ch = Math.min(ch, crop.imgH - sy);
    if (cw <= 4 || ch <= 4) {
      toast("裁剪区域超出图片，请拖动或缩小图片");
      return;
    }
    var canvas = document.createElement("canvas");
    canvas.width = Math.round(cw);
    canvas.height = Math.round(ch);
    canvas.getContext("2d").drawImage(img, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
    var onDone = crop.onDone;
    canvas.toBlob(function (blob) {
      if (!blob) { toast("裁剪失败，请重试"); return; }
      closeCropOverlay();
      onDone(blob);
    }, "image/jpeg", 0.92);
  }

  // 上传 → 裁剪 → 压缩 → 保存
  function onBgFileChange() {
    var input = $("bgFileInput");
    var file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      toast("请选择图片文件"); return;
    }
    if (file.size > 12 * 1024 * 1024) { toast("图片过大，请选择 12MB 以内"); return; }
    openCropOverlay(file, function (croppedBlob) {
      toast("正在压缩并保存…");
      processBgFile(croppedBlob, function (blob) {
        if (!blob) { toast("无法处理这张图片"); return; }
        IDB.put("bgBlob", blob).then(function () {
          return applyBackground();
        }).then(function () {
          syncBgUi();
          toast("背景已更换");
        }).catch(function () {
          toast("保存失败，当前浏览器不支持本地存储");
        });
      });
    });
  }

  function renderSettings() {
    var cfg = XY.AI.loadConfig();
    renderCfgProvider(cfg.provider || "openai");
    $("cfgBaseUrl").value = cfg.baseUrl;
    $("cfgKey").value = cfg.key;
    var sel = $("cfgModel");
    sel.innerHTML = "";
    var models = cfg.provider === "claude"
      ? XY.AI.CLAUDE_MODELS.slice()
      : XY.AI.PRESET_MODELS.slice();
    if (cfg.provider !== "claude") {
      XY.AI.cachedModels(cfg.baseUrl).forEach(function (m) {
        if (models.indexOf(m) < 0) models.push(m);
      });
    }
    if (models.indexOf(cfg.model) < 0) models.push(cfg.model);
    models.forEach(function (m) {
      var o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      if (m === cfg.model) o.selected = true;
      sel.appendChild(o);
    });

    var chip = $("keyStatusChip");
    if (cfg.key) {
      chip.textContent = "已配置 · " + maskKey(cfg.key);
      chip.className = "key-chip";
    } else {
      chip.textContent = "未配置";
      chip.className = "key-chip key-chip--none";
    }
    syncTtsSeg();
    syncBgUi();
  }

  // 同步接口类型 segment、hint 与模型下拉；switchByUser=true 时不重置输入值
  function renderCfgProvider(provider, switchByUser) {
    provider = provider === "claude" ? "claude" : "openai";
    document.querySelectorAll("[data-provider]").forEach(function (btn) {
      var on = btn.dataset.provider === provider;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-checked", String(on));
    });
    var baseUrl = $("cfgBaseUrl");
    if (switchByUser) {
      if (provider === "claude" && (!baseUrl.value || /openai|deepseek|moonshot|qwen/i.test(baseUrl.value))) {
        baseUrl.value = XY.AI.CLAUDE_BASE;
      }
    } else {
      baseUrl.value = XY.AI.loadConfig().baseUrl;
    }
    $("cfgBaseUrlHint").textContent = provider === "claude"
      ? "Claude 官方：https://api.anthropic.com；也可填任意 Anthropic 兼容网关（/v1 会自动补全）。"
      : "OpenAI 兼容接口均可，如 DeepSeek：https://api.deepseek.com（/v1 亦可）。";
    $("cfgKeyHint").textContent = provider === "claude"
      ? "只存本机。用于 Anthropic Messages API（x-api-key）。"
      : "只存本机。随请求直接发送给对应接口。";
    var sel = $("cfgModel");
    var current = sel && sel.value;
    sel.innerHTML = "";
    var models = provider === "claude" ? XY.AI.CLAUDE_MODELS.slice() : XY.AI.PRESET_MODELS.slice();
    models.forEach(function (m) {
      var o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      sel.appendChild(o);
    });
    if (current && models.indexOf(current) < 0) {
      var o = document.createElement("option");
      o.value = current;
      o.textContent = current;
      o.selected = true;
      sel.appendChild(o);
    } else if (current) {
      sel.value = current;
    }
  }
  function currentProvider() {
    var on = document.querySelector(".seg-btn[data-provider].is-on");
    return on ? on.dataset.provider : "openai";
  }

  function syncTtsSeg() {
    var cur = ttsType();
    document.querySelectorAll(".seg-btn").forEach(function (btn) {
      var on = btn.dataset.tts === cur;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-checked", String(on));
    });
  }

  function maskKey(k) {
    if (k.length <= 10) return "••••";
    return k.slice(0, 6) + "••••" + k.slice(-4);
  }

  /* ================= 事件绑定 ================= */
  function bind() {
    // 首页三张特色卡
    $("homeWrongTile").addEventListener("click", function () {
      state.wrongIdx = -1;
      showView("wrong");
    });
    $("homeCoachTile").addEventListener("click", openCoachSheet);
    $("homeExamTile").addEventListener("click", openExamDateSheet);

    // 错词本页
    $("wrongList").addEventListener("click", function (e) {
      var item = e.target.closest(".wrong-item");
      if (!item) return;
      var i = parseInt(item.dataset.idx, 10);
      if (e.target.closest(".wrong-rm")) {
        var bad = badWords();
        if (!bad[i]) return;
        dropBad(bad[i].set, bad[i].wd.w, false);
        renderWrong();
        renderHome();
        toast("已移出错词本");
        return;
      }
      state.wrongIdx = i;
      renderWrong();
    });
    $("wrongFront").addEventListener("click", function () {
      var on = $("wrongFront").classList.toggle("is-flipped");
      $("wrongFront").setAttribute("aria-pressed", String(on));
    });
    $("wrongAgain").addEventListener("click", function () {
      var bad = badWords();
      var b = bad[state.wrongIdx];
      if (b) dropBad(b.set, b.wd.w, false);
      state.wrongIdx = -1;
      renderWrong();
      renderHome();
      toast("这轮先放着，下一轮再来");
    });
    $("wrongKeep").addEventListener("click", function () {
      var bad = badWords();
      var b = bad[state.wrongIdx];
      if (b) dropBad(b.set, b.wd.w, true);
      state.wrongIdx++;
      renderWrong();
      renderHome();
      toast("记住了，移出错词本");
    });
    $("wrongClearBtn").addEventListener("click", function () {
      if (!badWords().length) { toast("错词本本来就是空的"); return; }
      badWords().forEach(function (b) { dropBad(b.set, b.wd.w, false); });
      state.wrongIdx = -1;
      renderWrong();
      renderHome();
      toast("错词本已清空");
    });
    $("wrongWeaknessBtn").addEventListener("click", openWeaknessReport);
    $("wrongGoWords").addEventListener("click", function () { showView("words"); });

    // 自定义背景
    $("bgFileInput").addEventListener("change", onBgFileChange);
    $("bgResetBtn").addEventListener("click", onBgReset);
    $("bgVeilRange").addEventListener("input", onBgVeilInput);

    // 设置页折叠面板
    document.querySelectorAll(".setting-fold .fold-head").forEach(function (head) {
      head.addEventListener("click", function () {
        var card = head.closest(".setting-fold");
        var open = card.classList.toggle("is-open");
        head.setAttribute("aria-expanded", String(open));
      });
    });

    // 发音音色切换
    document.querySelectorAll(".seg-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        localStorage.setItem("xy_tts_type", btn.dataset.tts);
        syncTtsSeg();
        toast(btn.dataset.tts === "0" ? "已切换为美音" : "已切换为英音");
      });
    });

    // 今日计划：点击行 = 完成切换；编辑 chip = 编辑；长按/右键 = 菜单
    var planListEl = $("planList");
    var pressTimer = null;
    function cancelPress() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    }
    planListEl.addEventListener("click", function (e) {
      if (state.pressFired) { state.pressFired = false; return; }
      var row = e.target.closest(".plan-item");
      if (!row) return;
      var id = row.dataset.planId;
      if (e.target.closest(".edit-chip")) { openPlanEditor(id); return; }
      togglePlanRowDone(id);
    });
    planListEl.addEventListener("pointerdown", function (e) {
      var row = e.target.closest(".plan-item");
      if (!row || e.target.closest(".edit-chip")) return;
      cancelPress();
      pressTimer = setTimeout(function () {
        pressTimer = null;
        state.pressFired = true;
        openPlanMenu(row.dataset.planId);
      }, 400);
    });
    ["pointermove", "pointerup", "pointercancel"].forEach(function (evt) {
      planListEl.addEventListener(evt, cancelPress);
    });
    planListEl.addEventListener("contextmenu", function (e) {
      var row = e.target.closest(".plan-item");
      if (!row) return;
      e.preventDefault();
      state.pressFired = true;
      openPlanMenu(row.dataset.planId);
    });
    $("planAddBtn").addEventListener("click", function () { openPlanEditor(null); });
    $("planFocusBtn").addEventListener("click", enterFocus);
    $("focusClose").addEventListener("click", exitFocus);
    $("focusList").addEventListener("click", function (e) {
      var row = e.target.closest(".focus-row");
      if (!row) return;
      togglePlanRowDone(row.dataset.fid);
      renderFocus();
    });
    $("focusPomo").addEventListener("click", function () {
      var id = focusTargetId();
      if (!id) return;
      togglePlanTimer(id, "pomodoro");
    });
    $("focusCountup").addEventListener("click", function () {
      var id = focusTargetId();
      if (!id) return;
      togglePlanTimer(id, "countup");
    });

    // 进度页打卡
    $("progressCheckinBtn").addEventListener("click", function () {
      doCheckin(null);
    });

    // 背词复习
    $("wordReviewStart").addEventListener("click", startReview);
    $("wordImportBtn").addEventListener("click", openWordImport);
    $("wordManageBtn").addEventListener("click", openManageSheet);
    $("wordAddWordBtn").addEventListener("click", openAddWordSheet);

    // 写作
    $("writingBack").addEventListener("click", function () {
      clearInterval(writingTimerId);      renderWritingList();
    });
    document.querySelectorAll("[data-wseg]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.writingSeg = chip.dataset.wseg;
        document.querySelectorAll("[data-wseg]").forEach(function (c) {
          c.classList.toggle("is-on", c === chip);
        });
        renderWritingList();
      });
    });
    $("writingHistBtn").addEventListener("click", openWritingHistory);
    $("writingSave").addEventListener("click", function () {
      if (!state.writingPromptId) return;
      var drafts = Store.get(K.drafts, {});
      drafts[state.writingPromptId] = $("writingEssay").value;
      Store.set(K.drafts, drafts);
      toast("草稿已保存");
    });
    $("writingEssay").addEventListener("input", function () {
      updateCount();
      clearTimeout(draftTimer);
      draftTimer = setTimeout(function () {
        if (!state.writingPromptId) return;
        var drafts = Store.get(K.drafts, {});
        drafts[state.writingPromptId] = $("writingEssay").value;
        Store.set(K.drafts, drafts);
      }, 800);
    });
    $("writingSubmit").addEventListener("click", function () {
      var id = state.writingPromptId;
      if (!id) return;
      var p = writingPrompt(id);
      if (!p) return;
      var essay = $("writingEssay").value.trim();
      if (countWords(essay) < 50) {
        toast("再写一点吧，至少 50 词再点评");
        return;
      }
      var resultEl = $("writingResult");
      if (!XY.AI.hasKey()) {
        resultEl.innerHTML =
          '<div class="empty-state"><h3>还没有配置 AI Key</h3>' +
          '<p>去「我的」页面填写 OpenAI 兼容接口的 Key，即可获得四维点评。</p>' +
          '<button class="btn btn--cyan" id="goSettingsBtn2">去配置</button></div>';
        $("goSettingsBtn2").addEventListener("click", function () { showView("settings"); });
        return;
      }
      var btn = this;
      btn.disabled = true;
      btn.textContent = "点评中…";
      resultEl.innerHTML = '<div class="loading-block"><span class="spinner"></span>AI 正在按官方四维评分…</div>';
      XY.AI.reviewWriting(essay, p.prompt, p.seg).then(function (data) {
        var r = writingResultToReview(data);
        var hist = Store.get(K.wHistory, []);
        hist.push({ id: p.id, title: p.title, prompt: p.prompt, task: p.seg, essay: essay, date: today(), review: r });
        Store.set(K.wHistory, hist);
        renderWritingReview(r);
        btn.disabled = false;
        btn.textContent = "重新点评";
        toast("写作点评完成，已存进度");
      }).catch(function (err) {
        btn.disabled = false;
        btn.textContent = "提交点评";
        resultEl.innerHTML = '<div class="empty-state"><h3>' + (err.code === "no-key" ? "未配置 Key" : "点评失败") + "</h3><p>" + escapeHtml(err.message || "请稍后重试") + "</p></div>";
      });
    });

    // 表达库
    $("writingExpr").addEventListener("click", openExprLibSheet);

    // 写作大纲
    $("writingOutline").addEventListener("click", function () {
      var id = state.writingPromptId;
      if (!id) return;
      var p = writingPrompt(id);
      if (!p) return;
      var resultEl = $("writingResult");
      if (!XY.AI.hasKey()) {
        toast("先在「我的 → AI 设置」配置 Key");
        showView("settings");
        return;
      }
      var btn = this;
      btn.disabled = true;
      btn.textContent = "生成中…";
      resultEl.innerHTML = '<div class="loading-block"><span class="spinner"></span>AI 正在想结构…</div>';
      XY.AI.outlineWriting(p.prompt).then(function (data) {
        renderOutline(data);
        btn.disabled = false;
        btn.textContent = "重新出大纲";
      }).catch(function (err) {
        btn.disabled = false;
        btn.textContent = "出大纲";
        resultEl.innerHTML = '<div class="empty-state"><h3>出大纲失败</h3><p>' + escapeHtml(err.message || "请稍后重试") + "</p></div>";
      });
    });

    // 口语
    document.querySelectorAll("[data-sseg]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.speakingSeg = chip.dataset.sseg;
        document.querySelectorAll("[data-sseg]").forEach(function (c) {
          c.classList.toggle("is-on", c === chip);
        });
        $("speakTranscript").value = "";
        $("recPlayback").classList.add("hidden");
        clearInterval(speakTimerId);
        if (state.recMax) clearInterval(state.recMax);
        stopRecording();
        renderSpeaking();
      });
    });
    $("speakingNext").addEventListener("click", function () {
      clearInterval(speakTimerId);
      if (state.recMax) clearInterval(state.recMax);
      stopRecording();
      speakingNext();
      $("speakTranscript").value = "";
      $("recPlayback").classList.add("hidden");
      renderSpeaking();
    });
    $("speakingHistBtn").addEventListener("click", openSpeakingHistory);
    $("speakingTimerBtn").addEventListener("click", function () {
      if (state.speakingStage === "idle") {
        state.speakingStage = "prep";
        runSpeakTimers(60, 120);
      } else {
        clearInterval(speakTimerId);
        state.speakingStage = "idle";
        $("prepTime").textContent = "1:00";
        $("speakTime").textContent = "2:00";
        $("prepTime").classList.remove("is-running");
        $("speakTime").classList.remove("is-running");
        $("speakingTimerBtn").textContent = "开始准备";
      }
    });
    $("recBtn").addEventListener("click", function () {
      if (state.rec && state.rec.state === "recording") {
        stopRecording();
        if (state.recMax) clearInterval(state.recMax);
      } else {
        startRecording();
      }
    });
    var dt = $("dictateBtn");
    if (dt) {
      if (!SR) {
        dt.remove();
      } else {
        dt.style.display = "";
        dt.addEventListener("click", function () {
          if (srActive) stopDictation();
          else startDictation();
        });
      }
    }
    $("speakingSubmit").addEventListener("click", speakingSubmit);

    // 设置
    document.querySelectorAll(".seg-btn[data-provider]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        renderCfgProvider(btn.dataset.provider, true);
      });
    });
    $("cfgFetchModels").addEventListener("click", function () {
      var btn = this, st = $("cfgAiStatus");
      var baseUrl = $("cfgBaseUrl").value.trim().replace(/\/+$/, "");
      var key = $("cfgKey").value.trim();
      var provider = currentProvider();
      btn.disabled = true;
      st.textContent = "正在拉取模型列表…";
      XY.AI.fetchModels(baseUrl, key, provider).then(function (ids) {
        var sel = $("cfgModel");
        var current = sel.value;
        XY.AI.cachedModels(baseUrl).forEach(function (m) {
          var exists = false;
          for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === m) { exists = true; break; }
          }
          if (!exists) {
            var o = document.createElement("option");
            o.value = m;
            o.textContent = m;
            sel.appendChild(o);
          }
        });
        if (sel.options.length) sel.value = current || sel.options[0].value;
        st.textContent = "已拉取 " + ids.length + " 个模型并合并进列表。";
        toast("模型列表已更新");
      }).catch(function (err) {
        st.textContent = err.message || "拉取失败，请检查地址与 Key";
      }).then(function () { btn.disabled = false; });
    });
    $("cfgTestLatency").addEventListener("click", function () {
      var btn = this, st = $("cfgAiStatus");
      var baseUrl = $("cfgBaseUrl").value.trim().replace(/\/+$/, "");
      var key = $("cfgKey").value.trim();
      var model = $("cfgModel").value;
      var provider = currentProvider();
      btn.disabled = true;
      btn.textContent = "测试中…";
      st.textContent = "正在请求 " + model + " …";
      XY.AI.testLatency(baseUrl, model, key, provider).then(function (r) {
        st.textContent = model + " · 延迟 " + r.ms + " ms · 可用";
        toast("连接正常，" + r.ms + " ms");
      }).catch(function (err) {
        st.textContent = err.message || "测试失败";
      }).then(function () {
        btn.disabled = false;
        btn.textContent = "测试连接";
      });
    });
    $("cfgSave").addEventListener("click", function () {
      var cfg = XY.AI.loadConfig();
      cfg.provider = currentProvider();
      cfg.baseUrl = $("cfgBaseUrl").value.trim().replace(/\/+$/, "");
      cfg.model = $("cfgModel").value;
      cfg.key = $("cfgKey").value.trim();
      if (!cfg.baseUrl) { toast("请填写 API Base URL"); return; }
      XY.AI.saveConfig(cfg);
      renderSettings();
      toast("配置已保存（仅存本机）");
    });
    $("clearDataBtn").addEventListener("click", function () {
      openSheet("清除全部数据", '<p style="color:var(--color-ink-2);font-size:0.875rem;">将清空打卡记录、背词进度、作文与口语历史，且不可恢复。确认继续吗？</p>' +
        '<button class="btn btn--coral btn--block" id="confirmClear">确认清除</button>');
      $("confirmClear").addEventListener("click", function () {
        Object.keys(K).forEach(function (k) { localStorage.removeItem(K[k]); });
        localStorage.removeItem("xy_ai_config");
        closeSheet();
        toast("已清除");
        setTimeout(function () { location.reload(); }, 400);
      });
    });

    // 彩蛋：点「不息」5 次进入心理疗愈室
    var eggCount = 0;
    $("eggWord").addEventListener("click", function () {
      eggCount++;
      if (eggCount >= 5) {
        eggCount = 0;
        openHealRoom();
      }
    });
    $("healClose").addEventListener("click", closeHealRoom);
    $("healQuote").addEventListener("click", healSetQuote);
    document.querySelectorAll(".heal-mood-btn").forEach(function (b) {
      b.addEventListener("click", function () { healStartMode(b.dataset.mood); });
    });
    $("healMoodBtn").addEventListener("click", healBackToMood);
    $("healVoiceBtn").addEventListener("click", function () {
      healVoiceOn = !healVoiceOn;
      this.textContent = healVoiceOn ? "语音引导 · 开" : "语音引导 · 关";
      this.classList.toggle("is-on", healVoiceOn);
      if (healVoiceOn) healSpeak("跟着呼吸，慢慢来");
    });
    document.querySelectorAll("#healSounds .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        healSetSound(c.dataset.sound, HEAL_MODES[healMode].sleep);
      });
    });
    $("healVolRange").addEventListener("input", function () {
      var v = parseInt(this.value, 10);
      $("healVolVal").textContent = v + "%";
      healVolSet(v);
    });
    document.querySelectorAll("[data-sleep]").forEach(function (b) {
      b.addEventListener("click", function () {
        healSleepStart(parseInt(b.dataset.sleep, 10));
      });
    });
    $("healSleepStop").addEventListener("click", healStopSleepTimer);

    // 底部弹层
    $("sheetClose").addEventListener("click", closeSheet);
    $("sheetBackdrop").addEventListener("click", function (e) {
      if (e.target === $("sheetBackdrop")) closeSheet();
    });
  }

  /* ================= sheet ================= */
  function openSheet(title, html) {
    $("sheetTitle").textContent = title;
    $("sheetBody").innerHTML = html;
    $("sheetBackdrop").classList.add("is-open");
    $("sheetBackdrop").setAttribute("aria-hidden", "false");
  }
  function closeSheet() {
    $("sheetBackdrop").classList.remove("is-open");
    $("sheetBackdrop").setAttribute("aria-hidden", "true");
  }

  /* ================= 彩蛋 · 心理疗愈室 ================= */
  var healTimerId = null;
  var healSleepTimerId = null;
  var healRound = 0;
  var healPhaseIdx = 0;
  var healMode = "calm";
  var healQuotePool = [];
  var healQuoteUsed = [];
  var healAudio = null; // { ctx, master, layers, current, vol }
  var healVoiceOn = false;
  var healSleepLeft = 0;
  var HEAL_RING_LEN = 553;
  var HEAL_ROUNDS = 3;
  var HEAL_MODES = {
    calm: {
      name: "平静",
      phases: [
        { t: "吸气 · 6 秒", ms: 6000, v: "吸气" },
        { t: "屏息 · 4 秒", ms: 4000, v: "屏息" },
        { t: "呼气 · 6 秒", ms: 6000, v: "呼气" }
      ],
      sound: "stream", quotes: "calm"
    },
    anxious: {
      name: "焦虑",
      phases: [
        { t: "吸气 · 4 秒", ms: 4000, v: "吸气" },
        { t: "屏息 · 7 秒", ms: 7000, v: "屏息" },
        { t: "呼气 · 8 秒", ms: 8000, v: "呼气" }
      ],
      sound: "noise", quotes: "anxious"
    },
    tired: {
      name: "疲劳",
      phases: [
        { t: "吸气 · 4 秒", ms: 4000, v: "吸气" },
        { t: "屏息 · 4 秒", ms: 4000, v: "屏息" },
        { t: "呼气 · 4 秒", ms: 4000, v: "呼气" },
        { t: "屏息 · 4 秒", ms: 4000, v: "屏息" }
      ],
      sound: "rain", quotes: "tired"
    },
    sleep: {
      name: "助眠",
      phases: [
        { t: "吸气 · 5 秒", ms: 5000, v: "吸气" },
        { t: "屏息 · 10 秒", ms: 10000, v: "屏息" },
        { t: "呼气 · 6 秒", ms: 6000, v: "呼气" }
      ],
      sound: "wave", quotes: "sleep", sleep: true
    }
  };
  var HEAL_QUOTES = {
    calm: [
      "天行健，君子以自强不息。",
      "行到水穷处，坐看云起时。",
      "此刻的呼吸，就是全部的答案。",
      "星光不问赶路人，时光不负有心人。",
      "把自己照顾好，才是最好的自律。"
    ],
    anxious: [
      "万事从来风过耳，一生只是梦游身。",
      "你并不孤单，慢慢来，比较快。",
      "心里有光，就不怕路长。",
      "山重水复疑无路，柳暗花明又一村。",
      "每一次跌倒，都是大地在拥抱你。"
    ],
    tired: [
      "长风破浪会有时，直挂云帆济沧海。",
      "风雨过后，你会更清楚地看见自己。",
      "专注当下，路会自己展开。",
      "休息不是偷懒，是给明天蓄力。"
    ],
    sleep: [
      "愿今晚的呼吸，都变成明天的力气。",
      "把今天放下，明天自会到来。",
      "夜晚是世界的休息，也是你的。",
      "闭上眼睛，让月光帮你收好今天。"
    ]
  };
  function healPhases() {
    return HEAL_MODES[healMode].phases;
  }
  function healSetQuote() {
    var pool = HEAL_QUOTES[HEAL_MODES[healMode].quotes];
    if (!pool.length) return;
    if (healQuoteUsed.length >= pool.length) healQuoteUsed = [];
    var pick;
    var guard = 0;
    do {
      pick = pool[Math.floor(Math.random() * pool.length)];
      guard++;
    } while (healQuoteUsed.indexOf(pick) >= 0 && guard < 20);
    healQuoteUsed.push(pick);
    $("healQuote").textContent = pick;
  }
  function healAdvanceRing(ms) {
    var bar = $("healRingBar");
    bar.style.transition = "none";
    bar.style.strokeDashoffset = HEAL_RING_LEN;
    void bar.getBoundingClientRect();
    bar.style.transition = "stroke-dashoffset " + ms + "ms linear";
    bar.style.strokeDashoffset = 0;
  }
  function healCycle() {
    var phases = healPhases();
    if (healPhaseIdx >= phases.length) {
      healRound++;
      healPhaseIdx = 0;
      $("healRoundNum").textContent = healRound;
      if (healRound >= HEAL_ROUNDS) {
        $("healLabel").textContent = "完成 · 给自己鼓个掌";
        $("healQuote").textContent = HEAL_MODES[healMode].sleep
          ? "愿今晚的呼吸，都变成明天的力气。"
          : "愿今天的练习，都变成明天的底气。";
        healSpeak(HEAL_MODES[healMode].sleep ? "完成，晚安" : "完成，很好");
        return;
      }
    }
    var ph = phases[healPhaseIdx];
    $("healLabel").textContent = ph.t;
    healAdvanceRing(ph.ms);
    if (ph.v) healSpeak(ph.v);
    healTimerId = setTimeout(function () {
      healPhaseIdx++;
      healCycle();
    }, ph.ms);
  }
  function healStop() {
    if (healTimerId) { clearTimeout(healTimerId); healTimerId = null; }
    var bar = $("healRingBar");
    bar.style.transition = "none";
    bar.style.strokeDashoffset = HEAL_RING_LEN;
  }
  function healBuildDots() {
    var box = $("healDots");
    if (box.children.length) return;
    for (var i = 0; i < 9; i++) {
      var d = document.createElement("i");
      d.className = "heal-dot";
      var s = 6 + Math.random() * 10;
      d.style.left = (Math.random() * 100) + "%";
      d.style.width = s + "px";
      d.style.height = s + "px";
      d.style.animationDuration = (9 + Math.random() * 9) + "s";
      d.style.animationDelay = (-Math.random() * 12) + "s";
      box.appendChild(d);
    }
  }

  /* ---------- 音景引擎（Web Audio 实时合成） ---------- */
  function ensureHealAudio() {
    if (healAudio) return healAudio;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var ctx = new AC();
    var master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    healAudio = { ctx: ctx, master: master, layers: {}, current: null, vol: 60 };
    return healAudio;
  }
  function healNoiseBuf(ctx, brown) {
    var len = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
      else d[i] = w;
    }
    return buf;
  }
  function healBuildLayer(id) {
    var a = healAudio;
    var ctx = a.ctx;
    var g = ctx.createGain();
    g.gain.value = 0;
    g.connect(a.master);
    var stops = [];
    var layer = { gain: g, nodes: [], stops: stops };
    function noiseSrc(buf, filter, gainVal) {
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      var fg = ctx.createGain();
      fg.gain.value = gainVal;
      src.connect(filter || fg);
      if (filter) filter.connect(fg);
      fg.connect(g);
      src.start();
      layer.nodes.push(src, fg);
      if (filter) layer.nodes.push(filter);
      stops.push(function () { try { src.stop(); } catch (e) {} });
    }
    function burst(periodMin, periodMax, fLow, fHigh, ampMin, ampMax, durMin, durMax) {
      var timer = setInterval(function () {
        var b = ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * (durMin + Math.random() * (durMax - durMin)))), ctx.sampleRate);
        var d = b.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        var src = ctx.createBufferSource();
        src.buffer = b;
        var f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = fLow + Math.random() * (fHigh - fLow);
        f.Q.value = 1.2;
        var eg = ctx.createGain();
        var amp = ampMin + Math.random() * (ampMax - ampMin);
        eg.gain.setValueAtTime(0, ctx.currentTime);
        eg.gain.linearRampToValueAtTime(amp, ctx.currentTime + 0.008);
        eg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        src.connect(f); f.connect(eg); eg.connect(g);
        src.start();
        stops.push(function () { try { src.stop(); } catch (e) {} });
      }, periodMin + Math.random() * (periodMax - periodMin));
      stops.push(function () { clearInterval(timer); });
    }
    var white = function () { return healNoiseBuf(ctx, false); };
    var brown = function () { return healNoiseBuf(ctx, true); };
    if (id === "rain") {
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 3200;
      noiseSrc(white(), lp, 0.5);
      burst(60, 220, 1700, 3800, 0.05, 0.22, 0.02, 0.05);
    } else if (id === "stream") {
      var bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 0.7;
      noiseSrc(brown(), bp, 0.6);
    } else if (id === "fire") {
      var lpf = ctx.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = 420;
      noiseSrc(brown(), lpf, 0.5);
      burst(120, 400, 1200, 3200, 0.04, 0.18, 0.015, 0.04);
    } else if (id === "wave") {
      var wlp = ctx.createBiquadFilter();
      wlp.type = "lowpass";
      wlp.frequency.value = 700;
      var wg = ctx.createGain();
      wg.gain.value = 0.5;
      var src = ctx.createBufferSource();
      src.buffer = white();
      src.loop = true;
      src.connect(wlp); wlp.connect(wg); wg.connect(g);
      src.start();
      layer.nodes.push(src, wlp, wg);
      var lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      var lfoG = ctx.createGain();
      lfoG.gain.value = 0.32;
      lfo.connect(lfoG); lfoG.connect(wg.gain);
      lfo.start();
      layer.nodes.push(lfo, lfoG);
      stops.push(function () { try { src.stop(); lfo.stop(); } catch (e) {} });
      var rumble = ctx.createBiquadFilter();
      rumble.type = "lowpass";
      rumble.frequency.value = 160;
      noiseSrc(white(), rumble, 0.16);
    } else { // noise 白噪
      noiseSrc(white(), null, 0.4);
    }
    return layer;
  }
  function healSetSound(id, soft) {
    var a = ensureHealAudio();
    if (!a) return;
    if (a.current === id) return;
    if (a.layers[id]) {
      if (a.layers[id].gain) a.layers[id].gain.gain.cancelScheduledValues(a.ctx.currentTime);
    }
    if (a.current && a.layers[a.current]) {
      var old = a.layers[a.current];
      try {
        old.gain.gain.linearRampToValueAtTime(0, a.ctx.currentTime + 0.5);
        setTimeout(function () {
          old.stops.forEach(function (s) { try { s(); } catch (e) {} });
          old.nodes.forEach(function (n) { try { n.disconnect(); } catch (e) {} });
          a.layers[a.current] = null;
          delete a.layers[a.current];
        }, 550);
      } catch (e) {}
    }
    if (a.ctx.state === "suspended") a.ctx.resume();
    var layer = healBuildLayer(id);
    a.layers[id] = layer;
    a.current = id;
    var base = soft ? 0.18 : 1;
    layer.gain.gain.linearRampToValueAtTime(base * (a.vol / 100) * 0.55, a.ctx.currentTime + 0.8);
    document.querySelectorAll("#healSounds .chip").forEach(function (c) {
      c.classList.toggle("is-on", c.dataset.sound === id);
    });
  }
  function healStopSound() {
    if (!healAudio) return;
    var a = healAudio;
    if (a.current && a.layers[a.current]) {
      var old = a.layers[a.current];
      try {
        old.gain.gain.linearRampToValueAtTime(0, a.ctx.currentTime + 0.5);
        setTimeout(function () {
          old.stops.forEach(function (s) { try { s(); } catch (e) {} });
          old.nodes.forEach(function (n) { try { n.disconnect(); } catch (e) {} });
        }, 550);
      } catch (e) {}
    }
    a.layers = {};
    a.current = null;
    document.querySelectorAll("#healSounds .chip").forEach(function (c) {
      c.classList.remove("is-on");
    });
  }
  function healVolSet(v) {
    if (!healAudio) return;
    healAudio.vol = v;
    if (healAudio.current && healAudio.layers[healAudio.current]) {
      var base = HEAL_MODES[healMode].sleep ? 0.18 : 1;
      healAudio.layers[healAudio.current].gain.gain.setTargetAtTime(base * (v / 100) * 0.55, healAudio.ctx.currentTime, 0.15);
    }
    $("healVolVal").textContent = v + "%";
  }

  /* ---------- 呼吸语音引导 ---------- */
  function healSpeak(txt) {
    if (!healVoiceOn) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(txt);
    u.lang = "zh-CN";
    u.rate = 0.8;
    u.pitch = 1;
    var voices = window.speechSynthesis.getVoices() || [];
    var v = voices.filter(function (x) { return /^zh/i.test(x.lang); })[0];
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }

  /* ---------- 进入 / 退出 ---------- */
  function openHealRoom() {
    healBuildDots();
    var o = $("healOverlay");
    o.classList.add("is-open");
    o.setAttribute("aria-hidden", "false");
    $("healMood").classList.remove("hidden");
  }
  function healStartMode(mood) {
    if (!HEAL_MODES[mood]) mood = "calm";
    healMode = mood;
    var m = HEAL_MODES[mood];
    healRound = 1;
    healPhaseIdx = 0;
    healQuoteUsed = [];
    $("healMood").classList.add("hidden");
    $("healRoundNum").textContent = 1;
    var o = $("healOverlay");
    if (m.sleep) o.classList.add("heal-sleep");
    else o.classList.remove("heal-sleep");
    $("healSleepBar").classList.toggle("hidden", !m.sleep);
    healStopSleepTimer();
    healSetQuote();
    healCycle();
    healSetSound(m.sound, !!m.sleep);
  }
  function healBackToMood() {
    healStop();
    healStopSleepTimer();
    var o = $("healOverlay");
    o.classList.remove("heal-sleep");
    $("healSleepBar").classList.add("hidden");
    $("healMood").classList.remove("hidden");
    healStopSound();
  }
  function closeHealRoom() {
    healStop();
    healStopSleepTimer();
    healStopSound();
    healVoiceOn = false;
    var vb = $("healVoiceBtn");
    if (vb) { vb.textContent = "语音引导 · 关"; vb.classList.remove("is-on"); }
    var o = $("healOverlay");
    o.classList.remove("heal-sleep");
    $("healSleepBar").classList.add("hidden");
    $("healMood").classList.remove("hidden");
    o.classList.remove("is-open");
    o.setAttribute("aria-hidden", "true");
  }

  /* ---------- 睡眠计时 ---------- */
  function healSleepStart(min) {
    healSleepLeft = min * 60;
    healSleepTick();
    if (healSleepTimerId) clearInterval(healSleepTimerId);
    healSleepTimerId = setInterval(healSleepTick, 1000);
    toast("已设定 " + min + " 分钟后自动淡出");
  }
  function healSleepTick() {
    var el = $("healSleepTimer");
    if (healSleepLeft <= 0) {
      healSleepDone();
      return;
    }
    if (el) {
      var m = Math.floor(healSleepLeft / 60);
      var s = healSleepLeft % 60;
      el.textContent = "自动淡出 · " + m + ":" + String(s).padStart(2, "0");
    }
    healSleepLeft--;
  }
  function healSleepDone() {
    healStopSleepTimer();
    var el = $("healSleepTimer");
    if (el) el.textContent = "";
    $("healLabel").textContent = "该睡了 · 剩下的交给夜晚";
    healStopSound();
    var o = $("healOverlay");
    o.classList.add("heal-sleep-finish");
    setTimeout(function () {
      o.classList.remove("heal-sleep-finish");
    }, 3200);
  }
  function healStopSleepTimer() {
    if (healSleepTimerId) { clearInterval(healSleepTimerId); healSleepTimerId = null; }
    var el = $("healSleepTimer");
    if (el) el.textContent = "";
    healSleepLeft = 0;
  }

  /* ================= 评分摘要 / 弱项 ================= */
  var DIM_LABELS = {
    ta: "任务完成度", cc: "连贯衔接", lr: "词汇", g: "语法",
    fc: "流利度", pr: "发音", gr: "语法"
  };
  var DIM_KEYS = {
    writing: ["ta", "cc", "lr", "g"],
    speaking: ["fc", "pr", "lr", "gr"]
  };

  function buildScoreSummary() {
    var wh = Store.get(K.wHistory, []);
    var sh = Store.get(K.sHistory, []);
    var dims = { writing: {}, speaking: {} };
    DIM_KEYS.writing.forEach(function (k) { dims.writing[k] = []; });
    DIM_KEYS.speaking.forEach(function (k) { dims.speaking[k] = []; });
    wh.forEach(function (h) {
      var r = h.review || {};
      DIM_KEYS.writing.forEach(function (k) { if (r[k] != null) dims.writing[k].push(r[k]); });
    });
    sh.forEach(function (h) {
      var r = h.review || {};
      DIM_KEYS.speaking.forEach(function (k) { if (r[k] != null) dims.speaking[k].push(r[k]); });
    });
    var avg = function (arr) {
      return arr.length ? arr.reduce(function (a, b) { return a + b; }, 0) / arr.length : null;
    };
    var dimAvg = function (skill, k) { return avg(dims[skill][k]); };
    var skillAvg = function (skill) {
      var vals = DIM_KEYS[skill].map(function (k) { return dimAvg(skill, k); }).filter(function (x) { return x != null; });
      return avg(vals);
    };
    var all = [];
    ["writing", "speaking"].forEach(function (skill) {
      DIM_KEYS[skill].forEach(function (k) {
        var v = dimAvg(skill, k);
        if (v != null) all.push({ skill: skill, dim: k, avg: v, label: DIM_LABELS[k] });
      });
    });
    all.sort(function (a, b) { return a.avg - b.avg; });
    var overalls = [];
    wh.concat(sh).forEach(function (h) {
      if (h.review && h.review.overall != null) overalls.push(h.review.overall);
    });
    var line = function (skill, label) {
      var a = skillAvg(skill);
      if (a == null) return "";
      var cnt = skill === "writing" ? wh.length : sh.length;
      return label + "点评 " + cnt + " 次："
        + DIM_KEYS[skill].map(function (k) { return DIM_LABELS[k] + " " + (dimAvg(skill, k) || 0).toFixed(1); }).join(" / ")
        + "，均分 " + a.toFixed(1);
    };
    var first = overalls[0], last = overalls[overalls.length - 1];
    var trend = "";
    if (overalls.length >= 2 && first != null && last != null) {
      var diff = last - first;
      trend = "整体均分趋势：从 " + first.toFixed(1) + " → " + last.toFixed(1) + "（" + (diff > 0.1 ? "上升" : diff < -0.1 ? "下降" : "持平") + "）";
    }
    var summary = [
      line("writing", "写作") || "写作暂无点评",
      line("speaking", "口语") || "口语暂无点评",
      trend
    ].join("\n");
    return {
      summary: summary,
      total: wh.length + sh.length,
      weakest: all.length ? all[0] : null,
      writingAvg: skillAvg("writing"),
      speakingAvg: skillAvg("speaking"),
      overalls: overalls
    };
  }

  function weakestInfo() {
    var w = buildScoreSummary();
    if (!w.weakest) return null;
    return { skill: w.weakest.skill, dim: w.weakest.dim, avg: w.weakest.avg, label: w.weakest.label };
  }

  /* ================= AI 弱项分析 ================= */
  function openWeaknessReport() {
    var w = buildScoreSummary();
    if (w.total < 2) {
      openSheet("AI 弱项分析",
        '<div class="empty-state"><h3>数据还不够</h3>' +
        '<p>先完成至少 2 次 AI 点评（写作或口语），教练才能从你的评分历史里找出弱项。</p></div>');
      return;
    }
    if (!XY.AI.hasKey()) {
      openSheet("AI 弱项分析",
        '<div class="empty-state"><h3>还没配置 AI Key</h3>' +
        '<p>去「我的 → AI 设置」填入 Key 和模型，就可以生成弱项报告了。</p></div>');
      return;
    }
    openSheet("AI 弱项分析", '<div class="ai-loading">正在分析你的评分历史…</div>');
    XY.AI.analyzeWeakness(w.summary).then(function (data) {
      if (data.no_data) {
        $("sheetBody").innerHTML = '<div class="empty-state"><h3>没有可分析的评分</h3><p>先完成几次 AI 点评吧。</p></div>';
        return;
      }
      var dimsHtml = (data.weakest_dims || []).map(function (d, i) {
        return '<div class="weak-dim-row"><span class="weak-rank">' + (i + 1) + "</span>" +
          '<span class="weak-name">' + escapeHtml(d.label || d.dim) +
          (d.skill === "writing" ? "（写作）" : "（口语）") + "</span>" +
          '<span class="weak-bar"><i style="width:' + Math.round(d.avg / 9 * 100) + '%"></i></span>' +
          '<span class="weak-val">' + d.avg.toFixed(1) + "</span></div>";
      }).join("") || '<p style="color:var(--color-ink-3);font-size:0.8125rem;">暂无维度数据。</p>';
      var list = function (arr) {
        return (arr || []).map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("");
      };
      $("sheetBody").innerHTML =
        '<div class="weak-head"><span class="weak-skill">' + escapeHtml(data.weakest_skill === "speaking" ? "口语" : "写作") + " 最弱</span>" +
        "<span>" + escapeHtml(data.trend || "") + "</span></div>" +
        '<div class="weak-dims">' + dimsHtml + "</div>" +
        (data.advice && data.advice.length ? '<h4 class="weak-title">建议</h4><ul class="weak-list">' + list(data.advice) + "</ul>" : "") +
        (data.drills && data.drills.length ? '<h4 class="weak-title">配套练习</h4><ul class="weak-list">' + list(data.drills) + "</ul>" : "") +
        '<p class="plan-hint">分析基于你的 AI 点评历史，越练越准。</p>';
    }).catch(function (err) {
      $("sheetBody").innerHTML = '<div class="empty-state"><h3>分析失败</h3><p>' + escapeHtml(err.message || "请重试") + "</p></div>";
    });
  }

  /* ================= 知识库 ================= */
  var KB_MAX_ENTRY = 30000;
  var KB_MAX_TOTAL = 150000;
  function kbList() {
    return Store.get(K.coachKb, []);
  }
  function kbSave(list) {
    Store.set(K.coachKb, list);
  }
  function kbText() {
    var list = kbList();
    var parts = list.slice().sort(function (a, b) { return (a.added || "") < (b.added || "") ? 1 : -1; })
      .map(function (it) {
        return "【" + (it.title || "未命名资料") + "】\n" + it.text;
      });
    var all = parts.join("\n\n");
    return all.length > 12000 ? all.slice(0, 12000) + "\n……（资料过长已截断）" : all;
  }

  function openKbSheet() {
    var list = kbList();
    var items = list.map(function (it) {
      return '<div class="kb-item"><div class="kb-info"><span class="kb-title">' + escapeHtml(it.title) + "</span>" +
        '<span class="kb-meta">' + it.text.length + " 字</span></div>" +
        '<button class="kb-del" data-kb-id="' + escapeHtml(it.id) + '" aria-label="删除资料">×</button></div>';
    }).join("");
    var total = list.reduce(function (a, b) { return a + b.text.length; }, 0);
    openSheet("教练知识库",
      '<p class="plan-hint">把雅思备考的书籍摘录、笔记、范文贴进来，教练问答时会参考它，回答更懂你。资料只存在本机。</p>' +
      '<label class="field"><span>资料标题</span><input class="input" id="kbTitle" placeholder="如：慎小嶷十天突破 · 词汇章" maxlength="40"></label>' +
      '<label class="field"><span>内容（粘贴书籍/笔记文字）</span>' +
      '<textarea class="input kb-input" id="kbTextArea" maxlength="' + KB_MAX_ENTRY + '" placeholder="粘贴文字内容…"></textarea></label>' +
      '<button class="btn btn--coral btn--block" id="kbAdd" style="margin-top:var(--space-sm);">添加到知识库</button>' +
      '<div class="kb-total">共 ' + list.length + " 条 · " + total + " 字（上限 " + KB_MAX_TOTAL + " 字）</div>" +
      '<div class="kb-list">' + (items || '<p class="plan-hint">还没有资料。</p>') + "</div>");
    $("kbAdd").addEventListener("click", function () {
      var title = $("kbTitle").value.trim() || "未命名资料";
      var text = $("kbTextArea").value.trim();
      if (!text) { toast("先粘贴一些内容"); return; }
      var cur = kbList();
      var used = cur.reduce(function (a, b) { return a + b.text.length; }, 0);
      if (used + text.length > KB_MAX_TOTAL) { toast("知识库超出总字数上限（" + KB_MAX_TOTAL + " 字）"); return; }
      cur.push({ id: "kb" + Date.now(), title: title, text: text, added: today() });
      kbSave(cur);
      toast("已加入知识库");
      openKbSheet();
    });
    var delBtns = document.querySelectorAll(".kb-del");
    delBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-kb-id");
        kbSave(kbList().filter(function (it) { return it.id !== id; }));
        openKbSheet();
        toast("已删除");
      });
    });
  }

  /* ================= AI 备考教练 ================= */
  function coachRuleAnswer(w, question) {
    var lines = [];
    if (w.weakest) {
      var name = (w.weakest.skill === "writing" ? "写作" : "口语") + " " + w.weakest.label;
      lines.push("从你的历史评分看，最弱的是" + name + "（" + w.weakest.avg.toFixed(1) + " 分）。");
      if (w.weakest.dim === "lr") lines.push("词汇是提分杠杆：每天过 1 组词（12 个），写作时练习同义替换，口语里刻意用 2-3 个新词。");
      else if (w.weakest.dim === "ta") lines.push("任务完成度：先列要点再动笔，写完核对是否回应了题目的每个部分。");
      else if (w.weakest.dim === "cc") lines.push("连贯衔接：每段用主题句开头，段内按「观点→理由→例子」展开。");
      else if (w.weakest.dim === "g" || w.weakest.dim === "gr") lines.push("语法：每次写完把谓语动词和从句各检查一遍，把错句记进错题本。");
      else if (w.weakest.dim === "fc") lines.push("流利度：每天跟读口语示范 10 分钟，练固定句式减少卡顿。");
      else if (w.weakest.dim === "pr") lines.push("发音：用单词卡的发音功能跟读，重音和连读逐词纠。");
    } else {
      lines.push("先完成 2 次 AI 点评（写作或口语），我才能诊断你的弱项。");
    }
    lines.push("配置 AI Key 后，教练会用你的真实评分回答更具体的计划。");
    return lines.join("\n");
  }

  function openCoachSheet() {
    var w = buildScoreSummary();
    coachHistory = [];
    openSheet("AI 备考教练",
      '<div class="coach-meta">' + (w.weakest
        ? (w.weakest.skill === "writing" ? "写作" : "口语") + " " + w.weakest.label + " " + w.weakest.avg.toFixed(1) + " 分 · 当前最弱"
        : "还没有评分数据，先去写一篇作文或练一段口语") + "</div>" +
      '<div class="chip-row" id="coachQuick">' +
      '<button class="chip" data-q="我 6.0 想冲 6.5，怎么练？">冲 6.5 怎么练</button>' +
      '<button class="chip" data-q="我的弱项是什么？">弱项在哪</button>' +
      '<button class="chip" data-q="这周怎么安排？">本周安排</button>' +
      "</div>" +
      '<div class="coach-chat" id="coachChat"></div>' +
      '<label class="field"><span>问教练（也可以让我直接操作软件，如：把明天设为考试日、打开错词本）</span>' +
      '<div style="display:flex;gap:var(--space-sm);">' +
      '<input class="input" id="coachInput" placeholder="如：口语怎么上 6.5？" autocomplete="off">' +
      '<button class="btn btn--coral btn--sm" id="coachSend" style="flex:none;">问</button></div></label>' +
      '<button class="btn btn--outline btn--sm btn--block" id="coachKbBtn" style="margin-top:var(--space-sm);">知识库：' + kbList().length + " 条资料</button>");
    $("coachQuick").addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (chip) coachAsk(chip.getAttribute("data-q"));
    });
    var send = function () {
      var q = $("coachInput").value.trim();
      if (!q) return;
      $("coachInput").value = "";
      coachAsk(q);
    };
    $("coachSend").addEventListener("click", send);
    $("coachInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") send();
    });
    $("coachKbBtn").addEventListener("click", openKbSheet);
  }

  var coachHistory = [];

  function coachAsk(question) {
    var chat = $("coachChat");
    if (!chat) return;
    chat.insertAdjacentHTML("beforeend",
      '<div class="msg msg--user">' + escapeHtml(question) + "</div>" +
      '<div class="msg msg--ai msg--loading">教练思考中…</div>');
    chat.scrollTop = chat.scrollHeight;
    var w = buildScoreSummary();
    if (!XY.AI.hasKey()) {
      var rule = coachRuleAnswer(w, question);
      setTimeout(function () {
        var ld = chat.querySelector(".msg--loading");
        if (ld) {
          ld.classList.remove("msg--loading");
          ld.textContent = rule;
        }
      }, 300);
      return;
    }
    coachTurn(question, w, false);
  }

  // 一轮教练问答：渲染回复；若含动作 JSON 则执行并把结果回注给 AI 再答一轮
  function coachTurn(question, w, isFollowup) {
    var chat = $("coachChat");
    XY.AI.coachChat(question, w.summary, kbText(), coachHistory).then(function (text) {
      var ld = chat.querySelector(".msg--loading");
      var display = stripCoachActions(text);
      if (ld) {
        ld.classList.remove("msg--loading");
        ld.textContent = display;
      } else {
        chat.insertAdjacentHTML("beforeend", '<div class="msg msg--ai">' + escapeHtml(display) + "</div>");
      }
      coachHistory.push({ role: "user", content: question });
      coachHistory.push({ role: "assistant", content: display });
      chat.scrollTop = chat.scrollHeight;
      if (!isFollowup) {
        var acts = extractCoachActions(text);
        if (acts.length) {
          runCoachActions(acts).then(function (results) {
            var sum = results.join("\n");
            chat.insertAdjacentHTML("beforeend",
              '<div class="msg msg--sys">已执行 ' + results.length + " 个操作：<br>" + escapeHtml(sum) + "</div>");
            chat.scrollTop = chat.scrollHeight;
            coachTurn("（系统反馈）刚才已执行这些操作：\n" + sum + "\n请用一两句话告知用户操作结果，并继续完成用户原本的请求。", w, true);
          });
        }
      }
    }).catch(function (err) {
      var ld = chat.querySelector(".msg--loading");
      if (ld) { ld.classList.remove("msg--loading"); ld.textContent = "出错了：" + (err.message || "请重试"); }
    });
  }

  // 提取「【动作】{...}」块（容错解析）
  function extractCoachActions(text) {
    var out = [];
    var re = /\u3010动作\u3011/g;
    var m;
    var guard = 0;
    while ((m = re.exec(text)) !== null && guard++ < 5) {
      var rest = text.slice(m.index + m[0].length);
      var s = rest.indexOf("{");
      var e = rest.lastIndexOf("}");
      if (s < 0 || e <= s) continue;
      try {
        var obj = JSON.parse(rest.slice(s, e + 1));
        if (obj && obj.op) out.push(obj);
      } catch (err) {}
    }
    return out;
  }
  // 从显示文本里去掉动作块
  function stripCoachActions(text) {
    return String(text || "").replace(/\u3010动作\u3011\s*\{[\s\S]*?\}/g, "");
  }

  // 危险操作清单：执行前必须用户确认
  var COACH_DANGEROUS = {
    clearAllData: "清除全部本地数据（打卡、进度、历史）",
    clearWrongBook: "清空错词本",
    clearWritingHistory: "清空全部写作历史",
    clearSpeakingHistory: "清空全部口语历史"
  };

  function runCoachActions(actions) {
    return actions.reduce(function (p, a) {
      return p.then(function (results) {
        return execCoachAction(a).then(function (r) {
          results.push(r);
          return results;
        }, function (err) {
          results.push("「" + a.op + "」失败：" + (err && err.message || "未知错误"));
          return results;
        });
      });
    }, Promise.resolve([]));
  }

  function coachFail(msg) {
    return Promise.reject({ message: msg });
  }

  function execCoachAction(action) {
    var op = action.op;
    var args = action.args || {};
    if (COACH_DANGEROUS[op]) {
      if (!window.confirm("AI 教练请求执行：「" + COACH_DANGEROUS[op] + "」\n是否允许？")) {
        return Promise.resolve("已取消（等你确认）");
      }
    }
    var curWord = function () {
      var set = currentSet();
      var words = state.wordReview ? dueWords(set.id) : set.words;
      var idx = state.wordIndex;
      return words[idx] ? words[idx] : null;
    };
    switch (op) {
      case "showView": {
        var views = ["home", "words", "writing", "speaking", "settings", "wrong"];
        if (views.indexOf(args.view) < 0) return coachFail("未知页面：" + args.view);
        showView(args.view);
        return Promise.resolve("已切换到「" + args.view + "」");
      }
      case "openCoach": openCoachSheet(); return Promise.resolve("已打开 AI 备考教练");
      case "closeCoach": closeSheet(); return Promise.resolve("已关闭当前弹层");
      case "openHealRoom": openHealRoom(); return Promise.resolve("已打开心理疗愈室");
      case "openKb": openKbSheet(); return Promise.resolve("已打开教练知识库");
      case "openWeakness": openWeaknessReport(); return Promise.resolve("已生成弱项分析");
      case "openExamDate": openExamDateSheet(); return Promise.resolve("已打开考试日期设置");
      case "openWritingHistory": openWritingHistory(); return Promise.resolve("已打开写作历史");
      case "openSpeakingHistory": openSpeakingHistory(); return Promise.resolve("已打开口语历史");
      case "openWrongBook": showView("wrong"); return Promise.resolve("已打开错词本");
      case "planAdd": {
        var dot = ["reading", "writing", "speaking", "mint", "cyan", "coral"].indexOf(args.dot) >= 0 ? args.dot : "reading";
        if (!args.label && !args.task) return coachFail("缺少计划内容");
        upsertPlanRow({ id: "r" + Date.now(), label: args.label || args.task.slice(0, 12), task: args.task || "", dot: dot });
        renderHome();
        return Promise.resolve("已添加计划行");
      }
      case "planDoneByText": {
        var rows = getPlan().rows;
        var hit = null;
        for (var i = 0; i < rows.length; i++) {
          if (!rows[i].done && (rows[i].task || "").indexOf(args.text) >= 0 || !rows[i].done && (rows[i].label || "").indexOf(args.text) >= 0) {
            hit = rows[i]; break;
          }
        }
        if (!hit) return coachFail("没有找到匹配的计划行");
        togglePlanRowDone(hit.id);
        return Promise.resolve("已完成「" + (hit.task || hit.label) + "」");
      }
      case "planClearDone": {
        var rows = getPlan().rows;
        if (!rows.some(function (r) { return r.done; })) return Promise.resolve("没有已完成的行");
        savePlanRows(rows.filter(function (r) { return !r.done; }));
        renderHome();
        return Promise.resolve("已清除全部已完成行");
      }
      case "setExamDate": {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date || "")) return coachFail("日期格式应为 YYYY-MM-DD");
        Store.set(K.examDate, args.date);
        renderHome();
        return Promise.resolve("考试日已设为 " + args.date);
      }
      case "clearExamDate": Store.set(K.examDate, ""); renderHome(); return Promise.resolve("已清除考试日");
      case "setTtsType": {
        localStorage.setItem("xy_tts_type", String(args.type === 0 ? "0" : "1"));
        syncTtsSeg();
        return Promise.resolve("发音音色已切换为" + (args.type === 0 ? "美音" : "英音"));
      }
      case "bgReset": onBgReset(); return Promise.resolve("已恢复默认背景");
      case "bgVeil": {
        var v = parseInt(args.value, 10);
        if (!(v >= 50 && v <= 90)) return coachFail("遮罩强度需在 50-90 之间");
        Store.set("xy_bg_veil", v);
        if (document.body.classList.contains("has-bg")) document.body.style.setProperty("--bg-veil", v / 100);
        return Promise.resolve("遮罩强度已设为 " + v + "%");
      }
      case "selectSetByName": {
        var name = String(args.name || "").trim();
        for (var i = 0; i < XY.WORD_SETS.length; i++) {
          if (XY.WORD_SETS[i].id === name || XY.WORD_SETS[i].name === name) {
            state.wordSet = XY.WORD_SETS[i].id;
            state.wordIndex = 0;
            state.wordFlipped = false;
            state.wordReview = false;
            state.wordWrong = false;
            renderWords();
            return Promise.resolve("已切换到词组「" + XY.WORD_SETS[i].name + "」");
          }
        }
        return coachFail("没有找到词组「" + name + "」");
      }
      case "hideSetByName": {
        var hid = String(args.name || "").trim();
        for (var j = 0; j < XY.WORD_SETS.length; j++) {
          if (XY.WORD_SETS[j].id === hid || XY.WORD_SETS[j].name === hid) {
            setHidden(XY.WORD_SETS[j].id, true);
            renderWords();
            return Promise.resolve("已隐藏词组「" + XY.WORD_SETS[j].name + "」");
          }
        }
        return coachFail("没有找到词组「" + hid + "」");
      }
      case "restoreHiddenSets": {
        var hs = hiddenSetIds();
        if (!hs.length) return Promise.resolve("没有隐藏的词组");
        hs.forEach(function (id) { setHidden(id, false); });
        renderWords();
        return Promise.resolve("已恢复全部隐藏词组");
      }
      case "openSetManager": openManageSheet(); return Promise.resolve("已打开词组管理");
      case "startReview": startReview(); return Promise.resolve("已开始复习到期单词");
      case "flipCard": {
        var f = $("wordFront");
        if (f) { f.click(); return Promise.resolve("已翻转单词卡"); }
        return coachFail("当前不在背词页");
      }
      case "markCurrentWord": {
        var cw = curWord();
        if (!cw) return coachFail("当前没有单词");
        markWord(currentSet().id, cw.w, !!args.done);
        state.wordFlipped = false;
        state.wordIndex++;
        renderWordCard();
        renderHome();
        return Promise.resolve("已标记「" + cw.w + "」为" + (args.done ? "掌握" : "再学一遍"));
      }
      case "speakCurrentWord": {
        var sw = curWord();
        if (!sw) return coachFail("当前没有单词");
        speakText(sw.w);
        return Promise.resolve("已朗读「" + sw.w + "」");
      }
      case "speakText": {
        var txt = String(args.text || "").trim();
        if (!txt) return coachFail("缺少要朗读的文本");
        speakText(txt);
        return Promise.resolve("已朗读");
      }
      case "getStats": {
        var st = buildScoreSummary();
        return Promise.resolve("当前统计：" + (st.summary || "还没有评分数据"));
      }
      case "clearAllData": {
        Object.keys(K).forEach(function (k) { localStorage.removeItem(K[k]); });
        localStorage.removeItem("xy_ai_config");
        toast("已清除");
        setTimeout(function () { location.reload(); }, 400);
        return Promise.resolve("已清除全部本地数据，页面即将刷新");
      }
      case "clearWrongBook": {
        var w2 = Store.get(K.words, {});
        Object.keys(w2).forEach(function (sid) {
          Object.keys(w2[sid]).forEach(function (word) {
            if (w2[sid][word].bad) w2[sid][word].bad = false;
          });
        });
        Store.set(K.words, w2);
        renderWords();
        renderHome();
        return Promise.resolve("错词本已清空");
      }
      case "clearWritingHistory": {
        Store.set(K.wHistory, []);
        renderProgress();
        return Promise.resolve("写作历史已清空");
      }
      case "clearSpeakingHistory": {
        Store.set(K.sHistory, []);
        renderProgress();
        return Promise.resolve("口语历史已清空");
      }
      default:
        return coachFail("未知操作：" + op);
    }
  }

  /* ================= 考试倒计时 ================= */
  function openExamDateSheet() {
    var cur = Store.get(K.examDate, "");
    openSheet("考试倒计时",
      '<label class="field"><span>考试日期</span>' +
      '<input class="input" type="date" id="examDateInput" value="' + cur + '"></label>' +
      '<p class="plan-hint">设定后首页显示「距考试 X 天」。日期只存在本机。</p>' +
      '<button class="btn btn--coral btn--block" id="examDateSave" style="margin-top:var(--space-md);">保存</button>' +
      (cur ? '<button class="btn btn--soft btn--block" id="examDateClear" style="margin-top:var(--space-sm);">清除日期</button>' : ""));
    $("examDateSave").addEventListener("click", function () {
      var v = $("examDateInput").value;
      if (!v) { toast("请选择日期"); return; }
      Store.set(K.examDate, v);
      closeSheet();
      renderHome();
      toast("已设置考试日，冲！");
    });
    var cl = $("examDateClear");
    if (cl) cl.addEventListener("click", function () {
      Store.set(K.examDate, "");
      closeSheet();
      renderHome();
      toast("已清除考试日");
    });
  }

  function openPlanEditor(id) {
    var isNew = id == null;
    var it = isNew ? { label: "", task: "", dot: "reading" } : planRowById(id);
    if (!it) return;
    var title = isNew ? "添加一行计划" : "编辑计划";
    var selected = it.dot || "reading";
    var dots = DOT_OPTIONS.map(function (d) {
      return '<button class="dot-opt' + (d === selected ? " is-on" : "") + '" data-dot="' + d + '" aria-label="颜色">' +
        '<span class="dot dot--' + d + '"></span></button>';
    }).join("");
    openSheet(title,
      '<label class="field"><span>标题</span>' +
      '<input class="input" id="planTitle" maxlength="12" placeholder="如：背单词" value="' + escapeHtml(it.label) + '"></label>' +
      '<label class="field"><span>具体任务</span>' +
      '<input class="input plan-input" id="planInput" maxlength="60" placeholder="写一句今天要做的，如：背 transport 组 12 词" value="' + escapeHtml(it.task) + '"></label>' +
      '<div class="field"><span>标记颜色</span><div class="dot-picker" id="dotPicker">' + dots + "</div></div>" +
      '<p class="plan-hint">每天的计划只保存当天，次日自动清空。</p>' +
      '<button class="btn btn--coral btn--block" id="planSave" style="margin-top:var(--space-md);">' + (isNew ? "添加" : "保存") + "</button>");
    var picker = $("dotPicker");
    picker.addEventListener("click", function (e) {
      var opt = e.target.closest(".dot-opt");
      if (!opt) return;
      picker.querySelectorAll(".dot-opt").forEach(function (o) { o.classList.remove("is-on"); });
      opt.classList.add("is-on");
      selected = opt.dataset.dot;
    });
    var save = function () {
      var label = $("planTitle").value.trim();
      var task = $("planInput").value.trim();
      if (!label) { toast("标题不能为空"); return; }
      upsertPlanRow({ id: isNew ? ("r" + Date.now()) : id, label: label, task: task, dot: selected });
      closeSheet();
      renderHome();
      toast(isNew ? "已添加一行计划" : "今日计划已保存");
    };
    $("planSave").addEventListener("click", save);
    $("planInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") save();
    });
    $("planTitle").focus();
  }

  /* ================= 计划计时 ================= */
  function fmtClock(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }
  function planTimerBadge(id) {
    var t = state.planTimers[id];
    if (!t) return "";
    if (t.kind === "pomodoro") {
      return '<span class="plan-badge is-hot">番茄 ' + fmtClock(Math.max(0, Math.ceil((t.end - Date.now()) / 1000))) + "</span>";
    }
    return '<span class="plan-badge">正计时 ' + fmtClock(Math.floor((Date.now() - t.start) / 1000)) + "</span>";
  }
  function togglePlanTimer(id, kind) {
    var t = state.planTimers[id];
    if (t && t.kind === kind) {
      delete state.planTimers[id];
      toast(kind === "pomodoro" ? "番茄钟已停止" : "正计时已停止");
    } else {
      state.planTimers[id] = kind === "pomodoro"
        ? { kind: "pomodoro", end: Date.now() + 25 * 60000 }
        : { kind: "countup", start: Date.now() };
      toast(kind === "pomodoro" ? "番茄钟开始 · 25:00，专心做这一件" : "正计时开始");
    }
    syncPlanTick();
    renderHome();
    if (state.focusOpen) renderFocus();
  }
  function syncPlanTick() {
    var active = Object.keys(state.planTimers).length > 0;
    if (active && !state.planTickId) {
      state.planTickId = setInterval(planTick, 1000);
    } else if (!active && state.planTickId) {
      clearInterval(state.planTickId);
      state.planTickId = null;
    }
  }
  function planTick() {
    var now = Date.now();
    var finished = [];
    Object.keys(state.planTimers).forEach(function (id) {
      var t = state.planTimers[id];
      if (t.kind === "pomodoro" && now >= t.end) {
        delete state.planTimers[id];
        togglePlanRowDone(id);
        finished.push(id);
      }
    });
    document.querySelectorAll(".plan-item").forEach(function (rowEl) {
      var t = state.planTimers[rowEl.dataset.planId];
      var badge = rowEl.querySelector(".plan-badge");
      var chip = rowEl.querySelector(".edit-chip");
      if (t) {
        var text = t.kind === "pomodoro"
          ? "番茄 " + fmtClock(Math.max(0, Math.ceil((t.end - now) / 1000)))
          : "正计时 " + fmtClock(Math.floor((now - t.start) / 1000));
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "plan-badge" + (t.kind === "pomodoro" ? " is-hot" : "");
          rowEl.insertBefore(badge, chip);
        }
        badge.textContent = text;
        badge.classList.toggle("is-hot", t.kind === "pomodoro");
      } else if (badge) {
        badge.remove();
      }
    });
    if (state.focusOpen) renderFocusClock();
    if (finished.length) {
      finished.forEach(function (id) { toast("「" + (planRowById(id) ? planRowById(id).label : "") + "」番茄钟完成，休息一下吧"); });
      syncPlanTick();
      renderHome();
    }
  }

  /* ================= 长按菜单 ================= */
  function openPlanMenu(id) {
    var row = planRowById(id);
    if (!row) return;
    var timer = state.planTimers[id];
    var hasCount = timer && timer.kind === "countup";
    var hasPomo = timer && timer.kind === "pomodoro";
    openSheet("「" + (row.label || "计划行") + "」",
      '<button class="btn ' + (row.done ? "btn--soft" : "") + ' btn--block" id="pmDone">' + (row.done ? "取消完成" : "标记完成") + "</button>" +
      '<button class="btn btn--outline btn--block" id="pmCountup">' + (hasCount ? "停止正计时" : "开始正计时") + "</button>" +
      '<button class="btn btn--outline btn--block" id="pmPomo">' + (hasPomo ? "停止番茄钟" : "开始番茄钟 · 25:00") + "</button>" +
      '<button class="btn btn--coral btn--block" id="pmDelete" style="margin-top:4px;">删除这一行</button>');
    $("pmDone").addEventListener("click", function () { closeSheet(); togglePlanRowDone(id); renderHome(); });
    $("pmCountup").addEventListener("click", function () { closeSheet(); togglePlanTimer(id, "countup"); });
    $("pmPomo").addEventListener("click", function () { closeSheet(); togglePlanTimer(id, "pomodoro"); });
    $("pmDelete").addEventListener("click", function () {
      closeSheet();
      removePlanRow(id);
      delete state.planTimers[id];
      syncPlanTick();
      renderHome();
      toast("已删除这一行");
    });
  }

  /* ================= 专注模式 ================= */
  function focusTargetId() {
    var plan = getPlan();
    for (var i = 0; i < plan.rows.length; i++) {
      if (!plan.rows[i].done) return plan.rows[i].id;
    }
    return plan.rows.length ? plan.rows[0].id : null;
  }
  function enterFocus() {
    state.focusOpen = true;
    $("focusOverlay").classList.add("is-open");
    $("focusOverlay").setAttribute("aria-hidden", "false");
    renderFocus();
  }
  function exitFocus() {
    state.focusOpen = false;
    $("focusOverlay").classList.remove("is-open");
    $("focusOverlay").setAttribute("aria-hidden", "true");
  }
  function renderFocus() {
    var now = new Date();
    $("focusDate").textContent = fmtDay(now) + " · " + dayName(now);
    var plan = getPlan();
    $("focusList").innerHTML = plan.rows.map(function (r) {
      return '<div class="focus-row' + (r.done ? " is-done" : "") + '" data-fid="' + escapeHtml(r.id) + '">' +
        '<span class="dot dot--' + r.dot + '"></span>' +
        '<div><div class="p-name">' + escapeHtml(r.label || "未命名") + "</div>" +
        '<div class="p-meta">' + escapeHtml(r.task || "点这里写今天的计划") + "</div></div>" +
        '<span class="check">✓</span></div>';
    }).join("");
    $("focusProgress").textContent = planDoneCount() + " / " + plan.rows.length + " 完成";
    renderFocusClock();
  }
  function latestTimer() {
    var ids = Object.keys(state.planTimers);
    if (!ids.length) return null;
    return state.planTimers[ids[ids.length - 1]];
  }
  function renderFocusClock() {
    var t = latestTimer();
    var clock = $("focusClock"), label = $("focusClockLabel");
    var pomo = $("focusPomo"), cnt = $("focusCountup");
    if (t && t.kind === "pomodoro") {
      clock.textContent = fmtClock(Math.max(0, Math.ceil((t.end - Date.now()) / 1000)));
      label.textContent = "番茄钟 · 专注中";
      pomo.textContent = "停止番茄";
      cnt.textContent = "开始正计时";
    } else if (t && t.kind === "countup") {
      clock.textContent = fmtClock(Math.floor((Date.now() - t.start) / 1000));
      label.textContent = "正计时 · 进行中";
      pomo.textContent = "开始番茄 · 25:00";
      cnt.textContent = "停止正计时";
    } else {
      clock.textContent = "00:00";
      label.textContent = "未开始 · 选择下方任务开始计时";
      pomo.textContent = "开始番茄 · 25:00";
      cnt.textContent = "开始正计时";
    }
  }

  /* ================= 自定义词组 ================= */
  function loadCustomSet() {
    XY.WORD_SETS = XY.WORD_SETS.filter(function (s) { return !s.custom; });
    var sets = Store.get(K.customSets, null);
    if (!Array.isArray(sets)) {
      var old = Store.get(K.custom, []);
      sets = [];
      if (Array.isArray(old) && old.length) {
        sets.push({ id: "c" + Date.now(), name: "我的词库", words: old });
      }
      Store.set(K.customSets, sets);
    }
    sets.forEach(function (s) {
      s.words = Array.isArray(s.words) ? s.words : [];
      XY.WORD_SETS.push({
        id: s.id,
        name: s.name || "我的词库",
        icon: "+",
        color: "var(--color-lavender)",
        words: s.words,
        custom: true
      });
    });
  }
  function customSets() {
    return XY.WORD_SETS.filter(function (s) { return s.custom; });
  }
  function saveCustomSets() {
    Store.set(K.customSets, customSets().map(function (s) {
      return { id: s.id, name: s.name, words: s.words };
    }));
  }
  function activeCustomSet() {
    var cur = currentSet();
    return cur && cur.custom ? cur : null;
  }
  function ensureCustomSet() {
    var cur = activeCustomSet();
    if (cur) return cur;
    var set = { id: "c" + Date.now(), name: "我的词库", words: [] };
    XY.WORD_SETS.push({
      id: set.id, name: set.name, icon: "+", color: "var(--color-lavender)",
      words: set.words, custom: true
    });
    saveCustomSets();
    state.wordSet = set.id;
    state.wordIndex = 0;
    state.wordFlipped = false;
    state.wordReview = false;
    state.wordWrong = false;
    return set;
  }
  function deleteCustomSet(id) {
    XY.WORD_SETS = XY.WORD_SETS.filter(function (s) { return s.id !== id; });
    saveCustomSets();
    var w = Store.get(K.words, {});
    delete w[id];
    Store.set(K.words, w);
    if (state.wordSet === id) {
      state.wordSet = XY.WORD_SETS[0].id;
      state.wordIndex = 0;
      state.wordFlipped = false;
      state.wordReview = false;
      state.wordWrong = false;
    }
  }
  function hiddenSetIds() {
    return Store.get(K.hiddenSets, []);
  }
  function isSetHidden(id) {
    return hiddenSetIds().indexOf(id) >= 0;
  }
  function setHidden(id, hide) {
    var arr = hiddenSetIds();
    var i = arr.indexOf(id);
    if (hide && i < 0) arr.push(id);
    if (!hide && i >= 0) arr.splice(i, 1);
    Store.set(K.hiddenSets, arr);
  }
  function renameSet(id, name) {
    var s = null;
    for (var i = 0; i < XY.WORD_SETS.length; i++) {
      if (XY.WORD_SETS[i].id === id) { s = XY.WORD_SETS[i]; break; }
    }
    if (!s) return;
    if (s.custom) {
      s.name = name;
      saveCustomSets();
    } else {
      var ov = Store.get(K.setOverrides, {});
      ov[id] = name;
      Store.set(K.setOverrides, ov);
    }
  }
  function clearCustomSet(id) {
    for (var i = 0; i < XY.WORD_SETS.length; i++) {
      if (XY.WORD_SETS[i].id === id) { XY.WORD_SETS[i].words.length = 0; break; }
    }
    saveCustomSets();
    var w = Store.get(K.words, {});
    delete w[id];
    Store.set(K.words, w);
  }
  function openManageSheet() {
    var rows = XY.WORD_SETS.map(function (s) {
      var hidden = isSetHidden(s.id);
      var name = escapeHtml(s.name);
      var count = s.words.length;
      var btns =
        '<button class="btn btn--soft btn--sm m-rename" data-id="' + s.id + '">重命名</button>' +
        (s.custom
          ? '<button class="btn btn--soft btn--sm m-clear" data-id="' + s.id + '">清空</button>'
          : (hidden
            ? '<button class="btn btn--soft btn--sm m-restore" data-id="' + s.id + '">恢复</button>'
            : '<button class="btn btn--soft btn--sm m-hide" data-id="' + s.id + '">隐藏</button>')) +
        (s.custom
          ? '<button class="btn btn--soft btn--sm m-del" data-id="' + s.id + '">删除</button>'
          : "");
      return '<div class="mg-row">' +
        '<div class="mg-info"><b>' + name + '</b>' +
        (s.custom ? '<span class="mg-tag">自定义</span>' : "") +
        (hidden ? '<span class="mg-tag mg-tag--dim">已隐藏</span>' : "") +
        '<i>' + count + " 词</i></div>" +
        '<div class="mg-actions">' + btns + "</div>" +
        "</div>";
    }).join("");
    openSheet("词组管理",
      '<div class="mg-list">' + rows + "</div>" +
      '<span class="hint-text">内置词组可改名或隐藏（隐藏后随时可恢复）；自定义词组可改名、清空或删除。</span>');
    var list = document.querySelector(".mg-list");
    if (!list) return;
    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.dataset.id;
      var s = null;
      for (var i = 0; i < XY.WORD_SETS.length; i++) {
        if (XY.WORD_SETS[i].id === id) { s = XY.WORD_SETS[i]; break; }
      }
      if (!s) return;
      if (btn.classList.contains("m-rename")) {
        var nm = window.prompt("新名字（12 字以内）", s.name);
        if (!nm) return;
        nm = nm.trim().slice(0, 12);
        if (!nm) return;
        renameSet(id, nm);
        toast("已重命名");
      } else if (btn.classList.contains("m-clear")) {
        if (!window.confirm("清空「" + s.name + "」的所有单词？组本身会保留。")) return;
        clearCustomSet(id);
        toast("已清空");
      } else if (btn.classList.contains("m-del")) {
        if (!window.confirm("删除词组「" + s.name + "」？单词与进度一并删除。")) return;
        deleteCustomSet(id);
        toast("已删除");
      } else if (btn.classList.contains("m-hide")) {
        setHidden(id, true);
        toast("已隐藏，可随时恢复");
      } else if (btn.classList.contains("m-restore")) {
        setHidden(id, false);
        toast("已恢复");
      }
      if (state.wordSet === id && !s.custom && isSetHidden(id)) {
        state.wordSet = XY.WORD_SETS[0].id;
        state.wordIndex = 0;
        state.wordFlipped = false;
        state.wordReview = false;
        state.wordWrong = false;
      }
      closeSheet();
      renderWords();
      renderHome();
    });
  }

  function parseCustomWords(text) {
    var out = [];
    String(text || "").split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      if (line.indexOf(",") >= 0) {
        var f = line.split(",").map(function (s) { return s.trim(); });
        if (!f[0]) return;
        out.push({ w: f[0], zh: f[1] || "", pos: f[2] || "", phon: f[3] || "", ex: f[4] || "", cn: f[5] || "", usage: f[6] || "" });
      } else {
        var m = line.match(/^([A-Za-z][A-Za-z\-\' ]*)\s+(.+)$/);
        if (!m) return;
        out.push({ w: m[1].trim(), zh: m[2].trim(), pos: "", phon: "", ex: "", cn: "", usage: "" });
      }
    });
    var seen = {};
    return out.filter(function (w) {
      var k = w.w.toLowerCase();
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }
  function openNewSetSheet() {
    openSheet("新建词组",
      '<label class="field"><span>词组名称</span>' +
      '<input class="input" id="newSetName" maxlength="12" placeholder="如：雅思高频词 · 交通"></label>' +
      '<button class="btn btn--coral" id="newSetSave">创建词组</button>' +
      '<span class="hint-text">创建后可点「＋ 添加单词」逐个加词，支持自动查询音标与释义。</span>');
    $("newSetSave").addEventListener("click", function () {
      var name = $("newSetName").value.trim();
      if (!name) { toast("给词组起个名字吧"); return; }
      var set = { id: "c" + Date.now(), name: name, words: [] };
      XY.WORD_SETS.push({
        id: set.id, name: set.name, icon: "+", color: "var(--color-lavender)",
        words: set.words, custom: true
      });
      saveCustomSets();
      state.wordSet = set.id;
      state.wordIndex = 0;
      state.wordFlipped = false;
      state.wordReview = false;
      state.wordWrong = false;
      closeSheet();
      renderWords();
      renderHome();
      toast("已创建词组「" + name + "」");
    });
  }

  // 免费词典 API：音标 / 词性 / 英文释义 / 例句（dictionaryapi.dev 偶发不稳定，自动降级 datamuse）
  function fetchWordInfo(word) {
    return fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(word), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("not-found");
        return res.json();
      })
      .then(function (data) {
        var e = data[0];
        var info = { phon: "", pos: "", def: "", ex: "" };
        if (e) {
          if (e.phonetic) info.phon = e.phonetic;
          var ph = (e.phonetics || []).filter(function (p) { return p.text; })[0];
          if (!info.phon && ph) info.phon = ph.text;
          var m = (e.meanings || [])[0];
          if (m) {
            info.pos = m.partOfSpeech || "";
            var d = (m.definitions || [])[0];
            if (d) { info.def = d.definition || ""; info.ex = d.example || ""; }
          }
        }
        if (!info.def) throw new Error("no-def");
        return info;
      })
      .catch(function () {
        return fetch("https://api.datamuse.com/words?sp=" + encodeURIComponent(word) + "&md=df", { cache: "no-store" })
          .then(function (r) { if (!r.ok) throw new Error("datamuse " + r.status); return r.json(); })
          .then(function (j) {
            var it = j && j[0];
            var def = "", pos = "";
            if (it && it.defs && it.defs.length) {
              var p = it.defs[0].split("\t");
              pos = p[0] || "";
              def = p.slice(1).join(" ").trim() || "";
            }
            if (!def) throw new Error("no-def");
            return { phon: "", pos: pos, def: def, ex: "" };
          });
      });
  }

  // MyMemory 免费翻译（CORS 友好，匿名 5000 字符/天）
  function translateZh(text) {
    if (!text) return Promise.resolve("");
    return fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text.slice(0, 300)) + "&langpair=en|zh-CN")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var t = j && j.responseData && j.responseData.translatedText;
        if (!t || String(t).indexOf("MYMEMORY") === 0) return "";
        return String(t);
      })
      .catch(function () { return ""; });
  }

  function openAddWordSheet() {
    var set = ensureCustomSet();
    openSheet("添加到「" + set.name + "」",
      '<label class="field"><span>单词</span>' +
      '<div style="display:flex;gap:var(--space-sm);">' +
      '<input class="input" id="wAddWord" style="flex:2;" placeholder="如：sustainable" autocomplete="off" spellcheck="false">' +
      '<button class="btn btn--outline btn--sm" id="wAddLookup" style="flex:1;">自动查询</button></div></label>' +
      '<label class="field"><span>音标</span><input class="input" id="wAddPhon" placeholder="/səˈsteɪnəbl/"></label>' +
      '<label class="field"><span>词性</span><input class="input" id="wAddPos" placeholder="adj."></label>' +
      '<label class="field"><span>中文释义</span><input class="input" id="wAddZh" placeholder="可持续的"></label>' +
      '<label class="field"><span>英文释义</span><input class="input" id="wAddDef" placeholder="able to continue over time"></label>' +
      '<label class="field"><span>例句</span><input class="input" id="wAddEx" placeholder="Sustainable transport is clean."></label>' +
      '<label class="field"><span>例句中文</span><input class="input" id="wAddCn" placeholder="可持续交通更清洁。"></label>' +
      '<span class="hint-text" id="wAddStatus">自动查询：免费词典 API 填充音标/词性/释义/例句，再自动翻译成中文（MyMemory）。也可全部手动填写。</span>' +
      '<button class="btn btn--coral" id="wAddSave">添加到词组</button>');
    var btn = $("wAddLookup");
    btn.addEventListener("click", function () {
      var word = $("wAddWord").value.trim();
      if (!/^[A-Za-z][A-Za-z\-\' ]{0,39}$/.test(word)) { toast("请输入英文单词"); return; }
      var st = $("wAddStatus");
      btn.disabled = true;
      btn.textContent = "查询中…";
      st.textContent = "正在查询词典与翻译…";
      fetchWordInfo(word).then(function (info) {
        $("wAddPhon").value = info.phon;
        $("wAddPos").value = info.pos;
        $("wAddDef").value = info.def;
        $("wAddEx").value = info.ex;
        return translateZh(info.def);
      }).then(function (zh) {
        if (zh) $("wAddZh").value = zh;
        st.textContent = "查询完成，字段可修改后保存。";
      }).catch(function () {
        st.textContent = "词典里没查到这个词，请手动填写后保存。";
      }).then(function () {
        btn.disabled = false;
        btn.textContent = "自动查询";
      });
    });
    $("wAddSave").addEventListener("click", function () {
      var w = $("wAddWord").value.trim();
      if (!w) { toast("请先输入单词"); return; }
      var exists = set.words.some(function (x) { return x.w.toLowerCase() === w.toLowerCase(); });
      if (exists) { toast("这个词已在词组里了"); return; }
      set.words.push({
        w: w,
        zh: $("wAddZh").value.trim(),
        pos: $("wAddPos").value.trim(),
        phon: $("wAddPhon").value.trim(),
        def: $("wAddDef").value.trim(),
        ex: $("wAddEx").value.trim(),
        cn: $("wAddCn").value.trim(),
        usage: ""
      });
      saveCustomSets();
      closeSheet();
      renderWords();
      renderHome();
      toast("已添加 " + w);
    });
  }

  function openWordImport() {
    var set = ensureCustomSet();
    openSheet("批量导入到「" + set.name + "」",
      '<label class="field"><span>每行一个词（两种格式自动识别）</span>' +
      '<textarea class="textarea" id="customInput" rows="8" placeholder="简式：单词 空格 释义&#10;sustainable 可持续的&#10;&#10;完整 CSV：单词,释义,词性,音标,例句,例句中文,搭配&#10;sustainable,可持续的,adj.,/səˈsteɪnəbl/,Sustainable transport is clean.,可持续交通更清洁,搭配: sustainable development"></textarea></label>' +
      '<div style="display:flex;gap:var(--space-sm);">' +
      '<button class="btn btn--soft" id="customClear" style="flex:1;">清空当前词组</button>' +
      '<button class="btn btn--coral" id="customImport" style="flex:2;">导入</button></div>');
    $("customImport").addEventListener("click", function () {
      var parsed = parseCustomWords($("customInput").value);
      if (!parsed.length) { toast("没有识别到有效单词"); return; }
      var added = 0;
      parsed.forEach(function (w) {
        var dup = set.words.some(function (x) { return x.w.toLowerCase() === w.w.toLowerCase(); });
        if (!dup) { set.words.push(w); added++; }
      });
      saveCustomSets();
      closeSheet();
      toast("已导入 " + added + " 个词 · " + set.name + " 共 " + set.words.length + " 个");
      if (state.view === "words") renderWords();
      renderHome();
    });
    $("customClear").addEventListener("click", function () {
      if (!set.words.length) { toast("这个词组本来就是空的"); return; }
      set.words = [];
      saveCustomSets();
      closeSheet();
      toast("「" + set.name + "」已清空");
      if (state.view === "words") renderWords();
      renderHome();
    });
  }

  /* ================= 启动 ================= */
  function boot() {
    loadCustomSet();
    // 预载 TTS 语音列表（异步加载）
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = function () {
        window.speechSynthesis.getVoices();
      };
    }
    bind();
    refreshHead();
    slideTabIndicator("home");
    renderHome();
    applyBackground();

    // 首页计数 tick（打卡模块已移除，此段兼容保留）
    var num = $("streakNum");
    if (num) {
      var target = calcStreak();
      if (state.reduced) {
        num.textContent = target;
        num.classList.remove("counter");
        num.style.opacity = 1;
      } else {
        var start = null, dur = 900;
        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          num.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
          else num.classList.add("is-counted");
        }
        requestAnimationFrame(tick);
      }
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
