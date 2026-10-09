(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || { contacts: {}, products: [], currency: "$" };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function price(p) { return cfg.currency + p; }

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

  /* ---------- Photos: show a styled placeholder until real photos are added ---------- */
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
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Products ---------- */
  var pricing = $("#pricing-grid");
  if (pricing) {
    pricing.innerHTML = cfg.products.map(function (p) {
      return (
        '<article class="plan reveal">' +
        (p.tag ? '<span class="plan-tag">' + esc(p.tag) + "</span>" : "") +
        "<h3>" + esc(p.title) + "</h3>" +
        '<div class="plan-price">' + esc(price(p.price)) + "</div>" +
        '<div class="plan-unit">' + esc(p.unit) + "</div>" +
        "<p>" + esc(p.description) + "</p>" +
        "<ul>" + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
        '<button class="btn btn-primary btn-block" data-buy="' + esc(p.id) + '">Купить</button>' +
        "</article>"
      );
    }).join("");
    $$(".plan.reveal", pricing).forEach(function (el) {
      if (typeof io !== "undefined") io.observe(el); else el.classList.add("in");
    });
  }

  // Fill <select> with products
  $$("select[data-products]").forEach(function (sel) {
    sel.innerHTML = cfg.products.map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.title) + " — " + esc(price(p.price)) + "</option>";
    }).join("") + '<option value="other">Другое / вопрос</option>';
  });

  function findProduct(id) {
    for (var i = 0; i < cfg.products.length; i++) if (cfg.products[i].id === id) return cfg.products[i];
    return null;
  }

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
      if (label) label.textContent = key === "email" ? c.email : "@" + (c[key] || "");
      if (key === "whatsapp" && label) label.textContent = "+" + c.whatsapp;
    } else {
      var li = el.closest("li");
      (li || el).style.display = "none";
    }
  });

  /* ---------- Booking modal ---------- */
  var modal = $("#buy-modal");
  function openModal(id) {
    if (!modal) return;
    var p = findProduct(id);
    var sel = $("select[name=product]", modal);
    if (sel && p) sel.value = p.id;
    updateModalProduct();
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
    var box = $(".modal-product", modal);
    if (!box) return;
    if (p) {
      box.style.display = "";
      box.innerHTML = "<span>" + esc(p.title) + "<br><small style=\"color:var(--muted)\">" + esc(p.unit) + "</small></span><b>" + esc(price(p.price)) + "</b>";
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
      "Заявка с сайта Maryna Moroz",
      "Услуга: " + (p ? p.title + " (" + price(p.price) + ")" : "Другое / вопрос"),
      "Имя: " + (data.name || ""),
      "Контакт: " + (data.contact || ""),
    ];
    if (data.level) lines.push("Уровень: " + data.level);
    if (data.timezone) lines.push("Часовой пояс / время: " + data.timezone);
    if (data.message) lines.push("Цель / комментарий: " + data.message);
    return lines.join("\n");
  }

  function showStatus(form, ok, html) {
    var st = $(".form-status", form);
    if (!st) return;
    st.className = "form-status " + (ok ? "ok" : "err");
    st.innerHTML = html;
  }

  function fallbackChannels(text) {
    var out = [];
    var enc = encodeURIComponent(text);
    if (c.telegram) out.push('<a class="btn btn-outline" target="_blank" rel="noopener" href="https://t.me/' + esc(c.telegram) + '">Telegram</a>');
    if (c.whatsapp) out.push('<a class="btn btn-outline" target="_blank" rel="noopener" href="https://wa.me/' + esc(c.whatsapp) + "?text=" + enc + '">WhatsApp</a>');
    if (c.email) out.push('<a class="btn btn-outline" href="mailto:' + esc(c.email) + "?subject=" + encodeURIComponent("Заявка на тренировку") + "&body=" + enc + '">Email</a>');
    return out;
  }

  $$("form.booking").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (!data.name || !data.contact) {
        showStatus(form, false, "Пожалуйста, укажите имя и контакт для связи.");
        return;
      }
      var p = findProduct(data.product);
      var text = buildMessage(data);
      var btn = $("button[type=submit]", form);
      if (btn) btn.disabled = true;

      var done = function (sent) {
        if (btn) btn.disabled = false;
        if (p && p.paymentLink) {
          showStatus(form, true, "Заявка принята! Перенаправляем на оплату…");
          setTimeout(function () { window.location.href = p.paymentLink; }, 900);
          return;
        }
        if (sent) {
          showStatus(form, true, "Спасибо! Заявка отправлена. Я свяжусь с вами в течение 24 часов, чтобы согласовать время и оплату.");
          form.reset();
          return;
        }
        var ch = fallbackChannels(text);
        if (ch.length) {
          try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (err) { /* ignore */ }
          showStatus(form, true,
            "Почти готово! Отправьте заявку в удобный мессенджер (текст заявки уже скопирован):" +
            '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px">' + ch.join("") + "</div>");
        } else {
          showStatus(form, false, "Контакты для приёма заявок ещё не настроены. Заполните их в файле js/config.js.");
        }
      };

      if (cfg.formEndpoint) {
        fetch(cfg.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.assign({ _subject: "Заявка: " + (p ? p.title : "вопрос"), summary: text }, data)),
        }).then(function (r) { done(r.ok); }).catch(function () { done(false); });
      } else {
        done(false);
      }
    });
  });

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
