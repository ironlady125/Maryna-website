(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || { contacts: {}, products: [], payments: {}, currency: "$" };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var L = (document.documentElement.lang || "ru").slice(0, 2) === "en" ? "en" : "ru";

  var T = {
    ru: {
      buy: "Купить", other: "Другое / вопрос",
      cats: { all: "Все", training: "Тренировки", consult: "Консультации", video: "Видеотренировки", acl: "Восстановление ACL" },
      required: "Пожалуйста, укажите имя и контакт для связи.",
      reqTitle: "Заявка с сайта Maryna Moroz", service: "Услуга", name: "Имя", contact: "Контакт",
      level: "Уровень", tz: "Часовой пояс / время", goal: "Цель / комментарий",
      thanks: "Спасибо! Заявка принята. Я свяжусь с вами в течение 24 часов.",
      sendVia: "Отправьте заявку в удобный мессенджер (текст уже скопирован):",
      noContacts: "Контакты для приёма заявок ещё не настроены (js/config.js).",
      payTitle: "Выберите способ оплаты", toPay: "К оплате",
      payVia: "Оплатить", copy: "Копировать", copied: "Скопировано",
      recipient: "Получатель", recName: "Имя получателя", amount: "Сумма", note: "Комментарий к платежу",
      network: "Сеть", address: "Адрес кошелька", email: "Email",
      manual: "Реквизиты для этого способа я пришлю лично — напишите мне в мессенджер.",
      afterPay: "После оплаты отправьте скриншот платежа — и я подтвержу время занятия или пришлю доступ.",
      back: "← Изменить заявку", subject: "Заявка на тренировку",
      card: "Карта · Apple Pay · Google Pay",
      cardHint: "Безопасная оплата картой Visa, Mastercard, Amex, а также Apple Pay и Google Pay.",
      zelleHint: "Отправьте платёж в приложении вашего банка через Zelle.",
      wiseHint: "Отправьте перевод через Wise на этот email.",
      cryptoHint: "Отправляйте только в указанной сети.",
    },
    en: {
      buy: "Buy now", other: "Other / question",
      cats: { all: "All", training: "Training", consult: "Consultations", video: "Video workouts", acl: "ACL recovery" },
      required: "Please enter your name and a way to contact you.",
      reqTitle: "Request from Maryna Moroz website", service: "Service", name: "Name", contact: "Contact",
      level: "Level", tz: "Time zone / time", goal: "Goal / comment",
      thanks: "Thank you! Your request has been received. I’ll get back to you within 24 hours.",
      sendVia: "Send your request via messenger (the text is already copied):",
      noContacts: "Contact channels are not configured yet (js/config.js).",
      payTitle: "Choose a payment method", toPay: "Total",
      payVia: "Pay", copy: "Copy", copied: "Copied",
      recipient: "Recipient", recName: "Recipient name", amount: "Amount", note: "Payment note",
      network: "Network", address: "Wallet address", email: "Email",
      manual: "I’ll send you the details for this method personally — message me.",
      afterPay: "After paying, send me a screenshot of the payment — I’ll confirm your session time or send you access.",
      back: "← Edit request", subject: "Training request",
      card: "Card · Apple Pay · Google Pay",
      cardHint: "Secure payment with Visa, Mastercard, Amex, plus Apple Pay and Google Pay.",
      zelleHint: "Send the payment with Zelle from your banking app.",
      wiseHint: "Send a Wise transfer to this email.",
      cryptoHint: "Send only on the network shown.",
    },
  }[L];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function price(p) { return cfg.currency + p; }
  function tx(p) { return p[L] || p.ru; }
  function copyText(v) {
    try {
      var r = navigator.clipboard && navigator.clipboard.writeText(v);
      if (r && r.catch) r.catch(function () { /* clipboard not allowed */ });
    } catch (err) { /* ignore */ }
  }
  function findProduct(id) {
    for (var i = 0; i < cfg.products.length; i++) if (cfg.products[i].id === id) return cfg.products[i];
    return null;
  }

  /* ---------- Header & mobile menu ---------- */
  var header = $(".site-header");
  if (header && !header.classList.contains("solid")) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  var burger = $(".burger"), links = $(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", links).forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); });
    });
  }

  /* ---------- Photos: placeholder until real photos are added ---------- */
  $$(".photo").forEach(function (box) {
    var img = $("img", box);
    var fail = function () { box.classList.add("no-img"); if (img) img.style.display = "none"; };
    if (!img) return fail();
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener("error", fail);
  });
  var heroImg = $(".hero-media img");
  if (heroImg) {
    var hideHero = function () { heroImg.style.display = "none"; };
    if (heroImg.complete && heroImg.naturalWidth === 0) hideHero();
    heroImg.addEventListener("error", hideHero);
  }

  /* ---------- Reveal on scroll ---------- */
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
  }
  function reveal(els) {
    els.forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });
  }
  reveal($$(".reveal"));

  /* ---------- Products with category tabs ---------- */
  var pricing = $("#pricing-grid");
  var tabsBox = $("#pricing-tabs");
  function renderProducts(cat) {
    if (!pricing) return;
    var list = cfg.products.filter(function (p) { return cat === "all" || p.category === cat; });
    pricing.innerHTML = list.map(function (p) {
      var t = tx(p);
      return (
        '<article class="plan reveal in">' +
        (t.tag ? '<span class="plan-tag">' + esc(t.tag) + "</span>" : "") +
        '<span class="plan-cat">' + esc(T.cats[p.category] || "") + "</span>" +
        "<h3>" + esc(t.title) + "</h3>" +
        '<div class="plan-price">' + esc(price(p.price)) + "</div>" +
        '<div class="plan-unit">' + esc(t.unit) + "</div>" +
        "<p>" + esc(t.description) + "</p>" +
        "<ul>" + t.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
        '<button class="btn btn-primary btn-block" data-buy="' + esc(p.id) + '">' + esc(T.buy) + "</button>" +
        "</article>"
      );
    }).join("");
  }
  if (tabsBox) {
    var cats = ["all"];
    cfg.products.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
    var initial = "all";
    var hashCat = (location.hash.match(/^#programs-(\w+)$/) || [])[1];
    if (hashCat && cats.indexOf(hashCat) >= 0) initial = hashCat;
    tabsBox.innerHTML = cats.map(function (c) {
      return '<button type="button" class="tab' + (c === initial ? " active" : "") + '" data-cat="' + c + '">' + esc(T.cats[c] || c) + "</button>";
    }).join("");
    tabsBox.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) return;
      $$(".tab", tabsBox).forEach(function (x) { x.classList.toggle("active", x === b); });
      renderProducts(b.getAttribute("data-cat"));
    });
    renderProducts(initial);
  } else {
    renderProducts("all");
  }
  // Links like #programs-acl open the matching tab
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href*="#programs-"]');
    if (!a || !tabsBox) return;
    var cat = a.getAttribute("href").split("#programs-")[1];
    var b = $('[data-cat="' + cat + '"]', tabsBox);
    if (b) b.click();
  });

  // Product <select> grouped by category
  $$("select[data-products]").forEach(function (sel) {
    var groups = {};
    cfg.products.forEach(function (p) { (groups[p.category] = groups[p.category] || []).push(p); });
    var html = "";
    Object.keys(groups).forEach(function (c) {
      html += '<optgroup label="' + esc(T.cats[c] || c) + '">' + groups[c].map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(tx(p).title) + " — " + esc(price(p.price)) + "</option>";
      }).join("") + "</optgroup>";
    });
    sel.innerHTML = html + '<option value="other">' + esc(T.other) + "</option>";
    var pre = sel.getAttribute("data-default");
    if (pre) sel.value = pre;
  });

  /* ---------- Payment methods ---------- */
  var pay = cfg.payments || {};
  var METHODS = [
    { key: "card", label: T.card },
    { key: "paypal", label: "PayPal" },
    { key: "zelle", label: "Zelle" },
    { key: "venmo", label: "Venmo" },
    { key: "cashapp", label: "Cash App" },
    { key: "wise", label: "Wise" },
    { key: "monobank", label: "Monobank" },
    { key: "crypto", label: "Crypto · USDT" },
  ].filter(function (m) { return pay[m.key] && pay[m.key].enabled !== false; });

  // "We accept" strip
  var strip = $("#pay-methods");
  if (strip) {
    var badges = [];
    METHODS.forEach(function (m) {
      if (m.key === "card") badges.push("Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay");
      else badges.push(m.label);
    });
    strip.innerHTML = badges.map(function (b) { return '<span class="pay-badge">' + esc(b) + "</span>"; }).join("");
  }

  function methodAction(key, p) {
    var c = pay[key] || {};
    var amount = p.price;
    var note = tx(p).title;
    switch (key) {
      case "card":
        return p.paymentLink ? { href: p.paymentLink, hint: T.cardHint } : null;
      case "paypal":
        return c.username ? { href: "https://www.paypal.com/paypalme/" + encodeURIComponent(c.username) + "/" + amount + "USD" } : null;
      case "venmo":
        return c.username ? { href: "https://venmo.com/" + encodeURIComponent(c.username) + "?txn=pay&amount=" + amount + "&note=" + encodeURIComponent(note) } : null;
      case "cashapp":
        return c.cashtag ? { href: "https://cash.app/$" + encodeURIComponent(c.cashtag) + "/" + amount } : null;
      case "monobank":
        return c.jarLink ? { href: c.jarLink } : null;
      case "zelle":
        return c.recipient ? { hint: T.zelleHint, rows: [[T.recipient, c.recipient], [T.recName, c.name], [T.amount, price(amount)], [T.note, note]] } : null;
      case "wise":
        return c.email ? { hint: T.wiseHint, rows: [[T.email, c.email], [T.amount, price(amount)], [T.note, note]] } : null;
      case "crypto":
        return c.address ? { hint: T.cryptoHint, rows: [[T.network, c.network], [T.address, c.address], [T.amount, amount + " USDT"]] } : null;
    }
    return null;
  }

  function renderMethodPanel(panel, key, p, label) {
    var a = methodAction(key, p);
    if (!a) {
      panel.innerHTML = '<p class="form-note">' + esc(T.manual) + "</p>" + channelsHtml(requestTextCache);
      return;
    }
    var html = a.hint ? '<p class="form-note">' + esc(a.hint) + "</p>" : "";
    if (a.href) {
      html += '<a class="btn btn-primary btn-block" target="_blank" rel="noopener" href="' + esc(a.href) + '">' +
        esc(T.payVia) + " " + esc(price(p.price)) + " · " + esc(label) + "</a>";
    }
    if (a.rows) {
      html += '<dl class="pay-details">' + a.rows.filter(function (r) { return r[1]; }).map(function (r) {
        return "<div><dt>" + esc(r[0]) + "</dt><dd><span>" + esc(r[1]) + '</span><button type="button" class="copy" data-copy="' + esc(r[1]) + '">' + esc(T.copy) + "</button></dd></div>";
      }).join("") + "</dl>";
    }
    panel.innerHTML = html;
  }

  var requestTextCache = "";
  function showPaymentStep(form, p, text) {
    requestTextCache = text;
    var step = form.nextElementSibling;
    if (!step || !step.classList.contains("pay-step")) {
      step = document.createElement("div");
      step.className = "pay-step";
      form.parentNode.insertBefore(step, form.nextSibling);
    }
    var t = tx(p);
    var inModal = !!form.closest(".modal");
    step.innerHTML =
      (inModal ? "" : '<div class="modal-product"><span>' + esc(t.title) + '<br><small style="color:var(--muted)">' + esc(t.unit) + "</small></span><b>" + esc(price(p.price)) + "</b></div>") +
      "<h4 class=\"pay-title\">" + esc(T.payTitle) + "</h4>" +
      '<div class="pay-list">' + METHODS.map(function (m) {
        return '<button type="button" class="pay-option" data-method="' + m.key + '">' + esc(m.label) + "</button>";
      }).join("") + "</div>" +
      '<div class="pay-panel"></div>' +
      '<p class="form-note" style="margin-top:16px">' + esc(T.afterPay) + "</p>" +
      channelsHtml(text) +
      '<button type="button" class="link-btn pay-back">' + esc(T.back) + "</button>";
    form.hidden = true;
    step.hidden = false;
    var panel = $(".pay-panel", step);
    $$(".pay-option", step).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".pay-option", step).forEach(function (x) { x.classList.toggle("active", x === b); });
        var m = METHODS.filter(function (x) { return x.key === b.getAttribute("data-method"); })[0];
        renderMethodPanel(panel, m.key, p, m.label);
      });
    });
    $(".pay-back", step).addEventListener("click", function () { step.hidden = true; form.hidden = false; });
    var first = $(".pay-option", step);
    if (first) first.click();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("button.copy");
    if (!b) return;
    var v = b.getAttribute("data-copy");
    copyText(v);
    b.textContent = T.copied;
    setTimeout(function () { b.textContent = T.copy; }, 1500);
  });

  /* ---------- Contacts ---------- */
  var c = cfg.contacts || {};
  var contactUrls = {
    email: c.email ? "mailto:" + c.email : "",
    telegram: c.telegram ? "https://t.me/" + c.telegram : "",
    whatsapp: c.whatsapp ? "https://wa.me/" + c.whatsapp : "",
    instagram: c.instagram ? "https://instagram.com/" + c.instagram : "",
  };
  $$("[data-contact]").forEach(function (el) {
    var key = el.getAttribute("data-contact");
    if (contactUrls[key]) {
      el.href = contactUrls[key];
      var label = $("[data-contact-label]", el);
      if (label) label.textContent = key === "email" ? c.email : key === "whatsapp" ? "+" + c.whatsapp : "@" + c[key];
    } else {
      (el.closest("li") || el).style.display = "none";
    }
  });

  function channelsHtml(text) {
    var out = [];
    var enc = encodeURIComponent(text || "");
    if (c.telegram) out.push('<a class="btn btn-outline" target="_blank" rel="noopener" href="https://t.me/' + esc(c.telegram) + '">Telegram</a>');
    if (c.whatsapp) out.push('<a class="btn btn-outline" target="_blank" rel="noopener" href="https://wa.me/' + esc(c.whatsapp) + "?text=" + enc + '">WhatsApp</a>');
    if (c.instagram) out.push('<a class="btn btn-outline" target="_blank" rel="noopener" href="https://ig.me/m/' + esc(c.instagram) + '">Instagram</a>');
    if (c.email) out.push('<a class="btn btn-outline" href="mailto:' + esc(c.email) + "?subject=" + encodeURIComponent(T.subject) + "&body=" + enc + '">Email</a>');
    return out.length ? '<div class="channels">' + out.join("") + "</div>" : "";
  }

  /* ---------- Booking modal ---------- */
  var modal = $("#buy-modal");
  function resetSteps(scope) {
    $$("form.booking", scope).forEach(function (f) { f.hidden = false; });
    $$(".pay-step", scope).forEach(function (s) { s.hidden = true; });
  }
  function openModal(id) {
    if (!modal) return;
    resetSteps(modal);
    var p = findProduct(id);
    var sel = $("select[name=product]", modal);
    if (sel && p) sel.value = p.id;
    updateModalProduct();
    var st = $(".form-status", modal);
    if (st) st.className = "form-status";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    var first = $("input[name=name]", modal);
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
  function updateModalProduct() {
    if (!modal) return;
    var sel = $("select[name=product]", modal);
    var p = sel && findProduct(sel.value);
    var box = $(".modal-box > .modal-product", modal);
    if (!box) return;
    if (p) {
      var t = tx(p);
      box.style.display = "";
      box.innerHTML = "<span>" + esc(t.title) + '<br><small style="color:var(--muted)">' + esc(t.unit) + "</small></span><b>" + esc(price(p.price)) + "</b>";
    } else {
      box.style.display = "none";
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-buy]");
    if (b) { e.preventDefault(); openModal(b.getAttribute("data-buy")); return; }
    if (e.target === modal || e.target.closest(".modal-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  if (modal) {
    var msel = $("select[name=product]", modal);
    if (msel) msel.addEventListener("change", updateModalProduct);
  }

  /* ---------- Forms ---------- */
  function buildMessage(data) {
    var p = findProduct(data.product);
    var lines = [
      T.reqTitle,
      T.service + ": " + (p ? tx(p).title + " (" + price(p.price) + ")" : T.other),
      T.name + ": " + (data.name || ""),
      T.contact + ": " + (data.contact || ""),
    ];
    if (data.level) lines.push(T.level + ": " + data.level);
    if (data.timezone) lines.push(T.tz + ": " + data.timezone);
    if (data.message) lines.push(T.goal + ": " + data.message);
    return lines.join("\n");
  }

  function showStatus(form, ok, html) {
    var st = $(".form-status", form);
    if (!st) return;
    st.className = "form-status " + (ok ? "ok" : "err");
    st.innerHTML = html;
  }

  $$("form.booking").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (!data.name || !data.contact) { showStatus(form, false, esc(T.required)); return; }
      var p = findProduct(data.product);
      var text = buildMessage(data);
      copyText(text);

      if (cfg.formEndpoint) {
        fetch(cfg.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.assign({ _subject: T.subject + ": " + (p ? tx(p).title : T.other), summary: text, lang: L }, data)),
        }).catch(function () { /* the messenger buttons remain as a fallback */ });
      }

      if (p && METHODS.length) {
        showStatus(form, true, "");
        $(".form-status", form).className = "form-status";
        showPaymentStep(form, p, text);
        return;
      }
      var ch = channelsHtml(text);
      if (cfg.formEndpoint) showStatus(form, true, esc(T.thanks) + ch);
      else if (ch) showStatus(form, true, esc(T.sendVia) + ch);
      else showStatus(form, false, esc(T.noContacts));
    });
  });

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
