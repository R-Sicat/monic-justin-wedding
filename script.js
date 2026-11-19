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

  /* ---------- Falling petals ---------- */
  function startPetals() {
    if (reduceMotion || startPetals.started) return;
    startPetals.started = true;
    const c = $("#petals");
    const ctx = c.getContext("2d");
    const colors = ["#E8C9BC", "#D8B4A6", "#EFE3D1", "#C9D3BC"];
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
    const count = innerWidth < 600 ? 14 : 26;
    const make = (initial) => ({
      x: Math.random() * W,
      y: initial ? Math.random() * H : -20 * dpr,
      r: (5 + Math.random() * 7) * dpr,
      vy: (0.35 + Math.random() * 0.6) * dpr,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.012,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.02,
      flip: Math.random() * Math.PI,
      color: colors[(Math.random() * colors.length) | 0],
      alpha: 0.45 + Math.random() * 0.4,
    });
    const petals = Array.from({ length: count }, () => make(true));
    let visible = true;
    document.addEventListener("visibilitychange", () => (visible = !document.hidden));
    const draw = () => {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        for (const p of petals) {
          p.sway += p.swaySpeed;
          p.flip += 0.03;
          p.x += Math.sin(p.sway) * 0.6 * dpr;
          p.y += p.vy;
          p.rot += p.vr;
          if (p.y > H + 20 * dpr) Object.assign(p, make(false));
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.6 + 0.4);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.bezierCurveTo(p.r, -p.r * 0.6, p.r * 0.7, p.r * 0.7, 0, p.r);
          ctx.bezierCurveTo(-p.r * 0.7, p.r * 0.7, -p.r, -p.r * 0.6, 0, -p.r);
          ctx.fill();
          ctx.restore();
        }
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------- Subtle hero parallax ---------- */
  if (!reduceMotion) {
    const branches = $$(".branch");
    const heroInner = $(".hero-inner");
    addEventListener("scroll", () => {
      const y = scrollY;
      if (y > innerHeight) return;
      branches[0].style.translate = `0 ${y * 0.25}px`;
      branches[1].style.translate = `0 ${y * -0.15}px`;
      heroInner.style.translate = `0 ${y * 0.3}px`;
      heroInner.style.opacity = 1 - y / (innerHeight * 0.9);
    }, { passive: true });
  }

  onScroll();
})();
