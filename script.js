/* =========================================================
   EDIT YOUR DETAILS HERE
   Everything marked with data-bind="..." in index.html is
   filled from this object. Other text (story, entourage,
   venues, FAQ) is edited directly in index.html.
   ========================================================= */
const WEDDING = {
  partner1: "Monic",
  partner2: "Justin",
  dateISO: "2027-02-14T15:00:00+08:00",   // ceremony start (with timezone)
  dateText: "February 14, 2027",
  dayText: "Sunday",
  city: "Tagaytay City",
  hashtag: "#MonicAndJustin",
  rsvpDeadline: "January 10, 2027",

  // RSVP delivery (pick one; leave the other blank):
  // 1) Formspree / Getform / Google Apps Script endpoint that accepts POST form data
  rsvpEndpoint: "",
  // 2) Fallback: opens the guest's email app addressed to you
  rsvpEmail: "",
};

/* ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Data binding ---------- */
  WEDDING.initials = `${WEDDING.partner1[0]}&${WEDDING.partner2[0]}`;
  $$("[data-bind]").forEach(el => {
    const v = WEDDING[el.dataset.bind];
    if (v != null) el.textContent = v;
  });
  document.title = `${WEDDING.partner1} & ${WEDDING.partner2} · ${WEDDING.dateText}`;

  /* ---------- Envelope intro ---------- */
  const intro = $("#intro");
  const openInvite = () => {
    intro.classList.add("opened");
    document.body.classList.remove("locked");
    setTimeout(() => document.body.classList.add("ready"), reduceMotion ? 0 : 1700);
    setTimeout(() => intro.remove(), 3000);
    startPetals();
  };
  $("#openInvite").addEventListener("click", openInvite);
  // Skip the envelope when linking directly to a section (e.g. site.com/#rsvp)
  if (location.hash && location.hash !== "#home") {
    intro.remove();
    document.body.classList.remove("locked");
    document.body.classList.add("ready");
    startPetals();
  }

  /* ---------- Nav ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  const onScroll = () => {
    nav.classList.toggle("show", scrollY > innerHeight * 0.6);
    updateTimeline();
  };
  addEventListener("scroll", onScroll, { passive: true });
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  $$("a", links).forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  // Active link highlighting
  const navMap = new Map($$("a[href^='#']", links).map(a => [a.getAttribute("href").slice(1), a]));
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && navMap.has(e.target.id)) {
        navMap.forEach(a => a.classList.remove("active"));
        navMap.get(e.target.id).classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach(s => sectionObserver.observe(s));

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------- Timeline progress line ---------- */
  const timeline = $(".timeline");
  function updateTimeline() {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
    timeline.style.setProperty("--progress", p.toFixed(3));
  }

  /* ---------- Story photos (use image if it exists) ---------- */
  $$(".tl-photo").forEach(el => {
    const m = el.style.getPropertyValue("--img").match(/url\(['"]?(.*?)['"]?\)/);
    if (!m) return;
    const img = new Image();
    img.onload = () => el.classList.add("has-img");
    img.src = m[1];
  });

  /* ---------- Countdown ---------- */
  const target = new Date(WEDDING.dateISO).getTime();
  const cd = { d: $("#cd-days"), h: $("#cd-hours"), m: $("#cd-mins"), s: $("#cd-secs") };
  const setNum = (el, v) => {
    v = String(v).padStart(2, "0");
    if (el.textContent !== v) {
      el.textContent = v;
      if (!reduceMotion) { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
    }
  };
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    if (diff === 0) {
      $("#countdown").innerHTML = `<p class="hero-married">We're married! Thank you for celebrating with us.</p>`;
      return clearInterval(timer);
    }
    const d = Math.floor(diff / 864e5); diff %= 864e5;
    const h = Math.floor(diff / 36e5); diff %= 36e5;
    const m = Math.floor(diff / 6e4);
    const s = Math.floor((diff % 6e4) / 1e3);
    setNum(cd.d, d); setNum(cd.h, h); setNum(cd.m, m); setNum(cd.s, s);
  };
  const timer = setInterval(tick, 1000);
  tick();

  /* ---------- Gallery + lightbox ---------- */
  const lb = $("#lightbox");
  const lbImg = $("img", lb);
  let shots = [];
  let current = 0;
  $$(".g-item img").forEach(img => {
    const fail = () => { img.closest(".g-item").classList.add("empty"); img.remove(); };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener("error", fail);
  });
  const refreshShots = () => (shots = $$(".g-item img").filter(i => i.naturalWidth > 0));
  const show = i => {
    current = (i + shots.length) % shots.length;
    lbImg.src = shots[current].src;
    lbImg.alt = shots[current].alt;
  };
  const closeLb = () => { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); };
  $(".gallery").addEventListener("click", e => {
    const img = e.target.closest(".g-item")?.querySelector("img");
    if (!img) return;
    refreshShots();
    show(shots.indexOf(img));
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
  });
  $(".lb-close", lb).addEventListener("click", closeLb);
  $(".lb-prev", lb).addEventListener("click", e => { e.stopPropagation(); show(current - 1); });
  $(".lb-next", lb).addEventListener("click", e => { e.stopPropagation(); show(current + 1); });
  lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  // Swipe on touch
  let sx = null;
  lb.addEventListener("touchstart", e => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    sx = null;
  });

  /* ---------- RSVP ---------- */
  const form = $("#rsvpForm");
  const note = $("#formNote");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    let ok = true;
    $$("[required]", form).forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = "Please fill in your name and contact."; return; }

    const data = new FormData(form);
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    note.textContent = "Sending…";

    try {
      if (WEDDING.rsvpEndpoint) {
        const res = await fetch(WEDDING.rsvpEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(res.status);
      } else if (WEDDING.rsvpEmail) {
        const body = [...data].map(([k, v]) => `${k}: ${v}`).join("\n");
        location.href = `mailto:${WEDDING.rsvpEmail}?subject=${encodeURIComponent("Wedding RSVP – " + data.get("name"))}&body=${encodeURIComponent(body)}`;
      } else {
        console.warn("RSVP not delivered: set WEDDING.rsvpEndpoint or WEDDING.rsvpEmail in script.js", Object.fromEntries(data));
      }
      const yes = data.get("attending").startsWith("Joyfully");
      note.textContent = yes ? "Thank you! We can't wait to celebrate with you." : "Thank you for letting us know. You'll be missed!";
      form.reset();
    } catch {
      note.textContent = "Something went wrong. Please try again or message us directly.";
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Falling feathers & sparkles ---------- */
  function startPetals() {
    if (reduceMotion || startPetals.started) return;
    startPetals.started = true;
    const c = $("#petals");
    const ctx = c.getContext("2d");
    let W, H, dpr;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = c.width = innerWidth * dpr;
      H = c.height = innerHeight * dpr;
      c.style.width = innerWidth + "px";
      c.style.height = innerHeight + "px";
    };
    resize();
    addEventListener("resize", resize);

    const small = innerWidth < 600;
    const makeFeather = (initial) => ({
      x: Math.random() * W,
      y: initial ? Math.random() * H : -40 * dpr,
      len: (16 + Math.random() * 16) * dpr,
      vy: (0.25 + Math.random() * 0.45) * dpr,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.006 + Math.random() * 0.01,
      swayAmp: (0.6 + Math.random() * 0.9) * dpr,
      tilt: (Math.random() - 0.5) * 0.8,
      alpha: 0.55 + Math.random() * 0.4,
    });
    const makeSpark = () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (0.8 + Math.random() * 1.6) * dpr,
      t: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
    });
    const feathers = Array.from({ length: small ? 9 : 16 }, () => makeFeather(true));
    const sparks = Array.from({ length: small ? 14 : 28 }, makeSpark);

    const drawFeather = f => {
      const L = f.len, w = L * 0.28;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.tilt + Math.sin(f.sway) * 0.45);
      ctx.globalAlpha = f.alpha;
      // vane
      const g = ctx.createLinearGradient(0, -L / 2, 0, L / 2);
      g.addColorStop(0, "rgba(255,255,255,.95)");
      g.addColorStop(1, "rgba(214,232,248,.85)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -L / 2);
      ctx.bezierCurveTo(w, -L / 3, w * 0.9, L / 4, 0, L / 2.4);
      ctx.bezierCurveTo(-w * 0.8, L / 4, -w, -L / 3, 0, -L / 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(127,168,209,.35)";
      ctx.lineWidth = 0.6 * dpr;
      ctx.stroke();
      // quill
      ctx.strokeStyle = "rgba(91,130,173,.55)";
      ctx.lineWidth = 0.8 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, -L / 2.2);
      ctx.quadraticCurveTo(w * 0.15, 0, 0, L / 2);
      ctx.stroke();
      ctx.restore();
    };

    let visible = true;
    document.addEventListener("visibilitychange", () => (visible = !document.hidden));
    const draw = () => {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        for (const s of sparks) {
          s.t += s.speed;
          const a = (Math.sin(s.t) + 1) / 2;
          ctx.globalAlpha = a * 0.8;
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = "rgba(191,220,242,.9)";
          ctx.shadowBlur = 8 * dpr;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * (0.6 + a * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        for (const f of feathers) {
          f.sway += f.swaySpeed;
          f.x += Math.sin(f.sway) * f.swayAmp;
          f.y += f.vy * (1 + Math.cos(f.sway) * 0.35);
          if (f.y > H + 40 * dpr) Object.assign(f, makeFeather(false));
          drawFeather(f);
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------- Sky parallax ---------- */
  if (!reduceMotion) {
    const far = $(".hero .clouds-layer.far");
    const mid = $(".hero .clouds-layer.mid");
    const floor = $(".hero .clouds-layer.floor");
    const heroInner = $(".hero-inner");
    addEventListener("scroll", () => {
      const y = scrollY;
      if (y > innerHeight) return;
      far.style.translate = `0 ${y * 0.15}px`;
      mid.style.translate = `0 ${y * 0.3}px`;
      floor.style.translate = `0 ${y * -0.12}px`;
      heroInner.style.translate = `0 ${y * 0.35}px`;
      heroInner.style.opacity = 1 - y / (innerHeight * 0.85);
    }, { passive: true });
  }

  onScroll();
})();
