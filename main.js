(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Theme ---------- */
  const themeBtn = $('#theme');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const syncTheme = () => themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    syncTheme();
    stream && stream.recolor();
  });
  syncTheme();

  /* ---------- Hero name, split into letters ---------- */
  let i = 0;
  $$('.split').forEach(line => {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach(ch => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch;
      s.style.setProperty('--i', i++);
      line.appendChild(s);
    });
  });

  /* ---------- Rotating words ---------- */
  const rot = $('#rotator');
  const words = ['agentic AI workflows', 'event pipelines', 'data platforms', 'compliance systems'];
  let w = 0;
  if (!reduced) {
    setInterval(() => {
      const cur = rot.firstElementChild;
      w = (w + 1) % words.length;
      const out = cur.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      out.onfinish = () => {
        cur.textContent = words[w];
        cur.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'forwards' });
      };
    }, 3200);
  }

  /* ---------- Hero event stream ---------- */
  const stream = (() => {
    const canvas = $('#stream');
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    const hero = $('.hero');
    const countEl = $('#stream-count');
    let W = 0, H = 0, dpr = 1, lanes = [], dots = [], ink = '#000', accent = '#00f';
    let pointer = { x: -9999, y: -9999, active: false };
    let processed = 0, running = false, last = 0, visible = true;
    const LANES = 7;

    const recolor = () => {
      const cs = getComputedStyle(root);
      ink = cs.getPropertyValue('--ink').trim() || '#000';
      accent = cs.getPropertyValue('--accent').trim() || '#00f';
      if (reduced) draw(0);
    };
    const laneY = (l, x, t) => lanes[l] + Math.sin(x * 0.0035 + t * 0.0005 + l * 1.7) * 10;
    const makeDot = (x) => {
      const r = Math.random();
      const size = r < 0.05 ? 4.6 : r < 0.25 ? 3 : 1.8;
      return { x: x ?? Math.random() * W, lane: (Math.random() * LANES) | 0, size, v: (0.55 + Math.random() * 0.5) * (size > 4 ? 0.55 : size > 2.5 ? 0.8 : 1), boost: 0 };
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lanes = Array.from({ length: LANES }, (_, k) => H * (0.2 + (k / (LANES - 1)) * 0.66));
      const target = Math.min(150, Math.round(W / 10));
      while (dots.length < target) dots.push(makeDot());
      dots.length = target;
      if (reduced) draw(0);
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.07;
      for (let l = 0; l < LANES; l++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 24) { const y = laneY(l, x, t); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
      for (const d of dots) {
        const y = laneY(d.lane, d.x, t);
        const hot = d.boost > 0.05;
        ctx.globalAlpha = hot ? 0.35 + d.boost * 0.6 : 0.22;
        ctx.fillStyle = hot ? accent : ink;
        ctx.beginPath();
        ctx.arc(d.x, y, d.size + d.boost * 1.5, 0, Math.PI * 2);
        ctx.fill();
        if (hot) {
          ctx.globalAlpha = d.boost * 0.25;
          ctx.strokeStyle = accent;
          ctx.beginPath(); ctx.moveTo(d.x - 18 * d.boost - d.size * 3, y); ctx.lineTo(d.x, y); ctx.stroke();
          ctx.strokeStyle = ink;
        }
      }
      ctx.globalAlpha = 1;
    };
    const step = (t) => {
      if (!running) return;
      const dt = Math.min(48, t - (last || t)) / 16.67;
      last = t;
      for (const d of dots) {
        if (pointer.active) {
          const dx = d.x - pointer.x, dy = laneY(d.lane, d.x, t) - pointer.y;
          const near = Math.max(0, 1 - Math.hypot(dx, dy) / 170);
          d.boost += (near - d.boost) * 0.12;
        } else d.boost *= 0.94;
        d.x += d.v * (1 + d.boost * 3.2) * dt;
        if (d.x > W + 10) { processed++; Object.assign(d, makeDot(-10)); }
      }
      if (dots.length > Math.min(150, Math.round(W / 10)) && Math.random() < 0.03) {
        const idx = dots.findIndex(d => d.x < 0);
        if (idx > -1) dots.splice(idx, 1);
      }
      countEl.textContent = processed.toLocaleString('en-IN');
      draw(t);
      requestAnimationFrame(step);
    };
    const start = () => { if (!running && visible && !document.hidden && !reduced) { running = true; last = 0; requestAnimationFrame(step); } };
    const stop = () => { running = false; };

    hero.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
      if (!reduced && dots.length < 230 && Math.random() < 0.35) {
        const d = makeDot(pointer.x - 40 - Math.random() * 60);
        d.lane = lanes.reduce((b, y, k) => Math.abs(y - pointer.y) < Math.abs(lanes[b] - pointer.y) ? k : b, 0);
        dots.push(d);
      }
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointer.active = false; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    new ResizeObserver(resize).observe(canvas);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);

    recolor(); resize();
    if (reduced) {
      $('#stream-hint').textContent = 'Each dot is an event moving through a partition.';
      $('.hero__count').hidden = true;
    } else {
      if (!finePointer) $('#stream-hint').textContent = 'Each dot is an event moving through a partition. Drag across to add load.';
      start();
    }
    return { recolor };
  })();

  /* ---------- Nav, progress bar, timeline (one scroll loop) ---------- */
  const nav = $('#nav');
  const bar = $('#progress');
  const tl = $('#timeline');
  const tlFill = $('#timeline-fill');
  const stops = $$('.stop');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 8);
    nav.classList.toggle('is-hidden', y > lastY && y > 560 && !nav.contains(document.activeElement));
    lastY = y;
    const r = tl.getBoundingClientRect();
    const mark = innerHeight * 0.6;
    const p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
    tlFill.style.transform = `scaleY(${p})`;
    stops.forEach(s => s.classList.toggle('is-lit', s.getBoundingClientRect().top + 12 < mark));
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* Active section in nav */
  const links = $$('.nav__links a');
  const byId = new Map(links.map(a => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.removeAttribute('aria-current'));
    byId.get(e.target.id)?.setAttribute('aria-current', 'true');
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => spy.observe(s));

  /* ---------- Reveal on scroll, with stagger inside groups ---------- */
  $$('.cases > .reveal').forEach((el, k) => el.style.setProperty('--d', `${(k % 3) * 0.08}s`));
  $$('.about__cols > .reveal').forEach((el, k) => el.style.setProperty('--d', `${k * 0.07}s`));
  const revealer = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealer.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => revealer.observe(el));

  /* ---------- Count-up metrics ---------- */
  const counter = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    counter.unobserve(e.target);
    const el = e.target, end = +el.dataset.count;
    if (reduced) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1500;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => { if (!reduced) el.textContent = '0'; counter.observe(el); });

  /* ---------- Project filters ---------- */
  const cases = $$('.case');
  const empty = $('#cases-empty');
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    const f = chip.dataset.filter;
    let shown = 0;
    cases.forEach(c => {
      const match = f === 'all' || c.dataset.tags.split(' ').includes(f);
      const wasHidden = c.classList.contains('is-hidden');
      c.classList.toggle('is-hidden', !match);
      c.classList.add('is-in');
      if (match) {
        if (wasHidden && !reduced) c.animate([{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: shown * 60, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'backwards' });
        shown++;
      }
    });
    empty.hidden = shown > 0;
  }));

  /* ---------- Card spotlight and tilt ---------- */
  if (finePointer) {
    $$('.case__btn').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        if (!reduced) {
          const tilt = card.closest('.case--feature') ? 2 : 4;
          card.style.setProperty('--ry', `${(x - 0.5) * tilt}deg`);
          card.style.setProperty('--rx', `${(0.5 - y) * tilt}deg`);
        }
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Case study dialog ---------- */
  const sheet = $('#sheet');
  $$('.case').forEach(c => {
    $('.case__btn', c).addEventListener('click', () => {
      $('#sheet-org').textContent = $('.case__org', c).textContent;
      $('#sheet-title').textContent = $('.case__title', c).textContent;
      const m = $('.case__metric', c), ml = $('.case__metric-label', c);
      $('#sheet-metric').textContent = '';
      if (m) { const d = $('[data-count]', m); $('#sheet-metric').textContent = `${m.textContent.replace(d.textContent, d.dataset.count).replace(/\s+/g, '')} ${ml.textContent}`; }
      $('#sheet-body').innerHTML = $('.case__detail', c).innerHTML;
      $('#sheet-tags').textContent = $('.case__tags', c).textContent;
      sheet.showModal();
      sheet.scrollTop = 0;
    });
  });
  $('#sheet-close').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

  /* ---------- Magnetic email button ---------- */
  if (finePointer && !reduced) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Copy email ---------- */
  const copyBtn = $('#copy');
  const email = $('#email').textContent.trim();
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(email); copyBtn.textContent = 'Copied'; }
    catch (e) {
      copyBtn.textContent = 'Select and copy';
      const r = document.createRange(); r.selectNodeContents($('#email'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    copyBtn.classList.add('is-done');
    setTimeout(() => { copyBtn.textContent = 'Copy email'; copyBtn.classList.remove('is-done'); }, 2000);
  });

  /* ---------- Footer ---------- */
  $('#year').textContent = new Date().getFullYear();
  const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  const clock = $('#clock');
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 15000);
})();
