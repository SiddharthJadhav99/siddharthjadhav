(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  /* ---------- Theme ---------- */
  const themeBtn = $('#theme');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const syncTheme = () => themeBtn && themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  themeBtn?.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    syncTheme();
    document.dispatchEvent(new Event('themechange'));
  });
  syncTheme();

  /* ---------- Hero words ---------- */
  $$('.hero__title').forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true');
      h.append(s, i < words.length - 1 ? ' ' : '');
    });
  });

  /* ---------- Blueprint crosshair ---------- */
  const hero = $('.hero');
  if (hero && fine && !reduced) {
    const cross = $('.cross', hero), x = $('.cross__x', hero), y = $('.cross__y', hero), lab = $('.cross__label', hero);
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const px = Math.round(e.clientX - r.left), py = Math.round(e.clientY - r.top);
      x.style.transform = `translateY(${py}px)`;
      y.style.transform = `translateX(${px}px)`;
      lab.style.transform = `translate(${px + 8}px, ${py + 6}px)`;
      lab.textContent = `x ${String(px).padStart(4, '0')}  y ${String(py).padStart(4, '0')}`;
    }, { passive: true });
    cross.hidden = false;
  }

  /* ---------- Scroll: nav, progress ---------- */
  const nav = $('#nav'), bar = $('#progress');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const yy = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? yy / max : 0})`;
    nav?.classList.toggle('is-scrolled', yy > 8);
    nav?.classList.toggle('is-hidden', yy > lastY && yy > 600 && !nav.contains(document.activeElement));
    lastY = yy; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Active link spy (home nav and case-study table of contents) */
  const spyLinks = $$('[data-spy] a[href*="#"]');
  if (spyLinks.length) {
    const map = new Map(spyLinks.map(a => [a.hash.slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const a = map.get(e.target.id); if (!a) return;
      $$('a', a.closest('[data-spy]')).forEach(l => l.removeAttribute('aria-current'));
      a.setAttribute('aria-current', 'true');
    }), { rootMargin: '-40% 0px -55% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Reveal ---------- */
  $$('[data-stagger]').forEach(g => $$(':scope > .reveal', g).forEach((el, i) => el.style.setProperty('--d', `${i * 0.07}s`)));
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); rv.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => rv.observe(el));

  /* ---------- Card spotlight ---------- */
  if (fine) $$('.card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------- Count up ---------- */
  const cu = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cu.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    const tick = now => { const k = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN'); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  if (!reduced) $$('[data-count]').forEach(el => { el.textContent = '0'; cu.observe(el); });

  /* ---------- Copy email, footer ---------- */
  const copy = $('#copy');
  copy?.addEventListener('click', async () => {
    const email = $('#email').textContent.trim();
    try { await navigator.clipboard.writeText(email); copy.textContent = 'Copied'; }
    catch (e) { copy.textContent = 'Select and copy'; const r = document.createRange(); r.selectNodeContents($('#email')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    copy.classList.add('is-done');
    setTimeout(() => { copy.textContent = 'Copy email'; copy.classList.remove('is-done'); }, 2000);
  });
  $$('.year').forEach(y => y.textContent = new Date().getFullYear());
  const clock = $('#clock');
  if (clock) { const f = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }); const t = () => clock.textContent = f.format(new Date()); t(); setInterval(t, 15000); }

  /* =========================================================
     Demo 1: agent workflow, before and after
     ========================================================= */
  const AGENT = {
    before: {
      nodes: {
        mgr: { x: 70, y: 150, t: 'human', l: 'Manager', s: 'in chat' },
        orch: { x: 255, y: 150, t: 'llm', l: 'orchestrator', s: 'LLM routes every step' },
        hire: { x: 500, y: 40, t: 'llm', l: 'hire_agent', s: 'LLM' },
        rec: { x: 500, y: 113, t: 'llm', l: 'recommend_agent', s: 'LLM' },
        sn: { x: 500, y: 187, t: 'llm', l: 'servicenow_agent', s: 'LLM + tools' },
        appr: { x: 500, y: 260, t: 'llm', l: 'approval_agent', s: 'LLM' }
      },
      edges: [['mgr', 'orch'], ['orch', 'hire'], ['orch', 'rec'], ['orch', 'sn'], ['orch', 'appr']],
      route: ['mgr', 'orch', 'hire', 'orch', 'rec', 'orch', 'sn', 'orch', 'appr', 'orch', 'sn', 'orch', 'mgr'],
      cost: { orch: 1, hire: 2, rec: 2, sn: 2, appr: 2 },
      agents: 5, time: '~20–40 s', note: 'Every hop goes back through an LLM router. Misroutes and invented approvals were possible.'
    },
    after: {
      nodes: {
        mgr: { x: 70, y: 150, t: 'human', l: 'Manager', s: 'in chat' },
        hire: { x: 210, y: 60, t: 'llm', l: 'hire_agent', s: 'LLM, collects 6 fields' },
        look: { x: 365, y: 60, t: 'code', l: 'sn_lookup', s: 'Python' },
        rec: { x: 520, y: 60, t: 'code', l: 'recommend', s: 'Python, 3-tier fallback' },
        appr: { x: 520, y: 240, t: 'llm', l: 'approval_agent', s: 'LLM, typed decision' },
        order: { x: 365, y: 240, t: 'code', l: 'sn_create', s: 'Python, real orders' },
        sum: { x: 210, y: 240, t: 'code', l: 'summary', s: 'Python' }
      },
      edges: [['mgr', 'hire'], ['hire', 'look'], ['look', 'rec'], ['rec', 'appr'], ['appr', 'order'], ['order', 'sum'], ['sum', 'mgr']],
      route: ['mgr', 'hire', 'look', 'rec', 'appr', 'order', 'sum', 'mgr'],
      cost: { hire: 2, appr: 2 },
      agents: 2, time: '~1–3 s', note: 'The LLM only talks to people. Lookup, recommendation and ordering are plain code, so they can’t hallucinate.'
    }
  };

  $$('[data-demo="agent"]').forEach(box => {
    const svg = $('svg', box), packetLayer = svgEl('g');
    const mCalls = $('[data-m="calls"]', box), mAgents = $('[data-m="agents"]', box), mTime = $('[data-m="time"]', box), note = $('.demo__note', box);
    const segs = $$('.seg button', box), runBtn = $('[data-run]', box);
    const layers = {};
    let mode = 'after', runId = 0;

    for (const key of ['before', 'after']) {
      const d = AGENT[key], g = svgEl('g', { class: 'graph-layer' });
      d.edgeEls = {};
      d.edges.forEach(([a, b]) => {
        const A = d.nodes[a], B = d.nodes[b];
        const p = svgEl('line', { class: 'edge', x1: A.x, y1: A.y, x2: B.x, y2: B.y });
        d.edgeEls[a + b] = d.edgeEls[b + a] = p; g.append(p);
      });
      d.nodeEls = {};
      for (const id in d.nodes) {
        const n = d.nodes[id], w = n.t === 'human' ? 96 : 140, h = 46;
        const ng = svgEl('g', { class: `node node--${n.t}` });
        ng.append(svgEl('rect', { x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: n.t === 'human' ? 23 : 10 }));
        const t1 = svgEl('text', { x: n.x, y: n.y - 3, 'text-anchor': 'middle' }); t1.textContent = n.l;
        const t2 = svgEl('text', { x: n.x, y: n.y + 13, 'text-anchor': 'middle', class: 'sub' }); t2.textContent = n.s;
        ng.append(t1, t2); g.append(ng); d.nodeEls[id] = ng;
      }
      layers[key] = g; svg.append(g);
    }
    const packet = svgEl('circle', { class: 'packet', r: 6, cx: -20, cy: -20 });
    packetLayer.append(packet); svg.append(packetLayer);

    const setMode = m => {
      mode = m; runId++;
      segs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
      for (const k in layers) layers[k].classList.toggle('is-off', k !== m);
      const d = AGENT[m];
      mAgents.textContent = d.agents; mTime.textContent = d.time; mCalls.textContent = '0';
      note.textContent = d.note;
      packet.classList.add('is-idle');
      $$('.is-active, .is-hot', svg).forEach(e => e.classList.remove('is-active', 'is-hot'));
    };

    const move = (A, B, id) => new Promise(res => {
      const dist = Math.hypot(B.x - A.x, B.y - A.y), dur = Math.max(260, dist * 1.8), t0 = performance.now();
      const f = now => {
        if (id !== runId) return res(false);
        const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        packet.setAttribute('cx', A.x + (B.x - A.x) * e); packet.setAttribute('cy', A.y + (B.y - A.y) * e);
        k < 1 ? requestAnimationFrame(f) : res(true);
      };
      requestAnimationFrame(f);
    });

    const run = async () => {
      const id = ++runId, d = AGENT[mode];
      let calls = 0; mCalls.textContent = '0';
      if (reduced) { mCalls.textContent = d.route.reduce((s, n) => s + (d.cost[n] || 0), 0); return; }
      runBtn.disabled = true; packet.classList.remove('is-idle');
      for (let i = 0; i < d.route.length; i++) {
        const cur = d.route[i], n = d.nodes[cur];
        if (i > 0) {
          const prev = d.route[i - 1], e = d.edgeEls[prev + cur];
          e?.classList.add('is-hot');
          const ok = await move(d.nodes[prev], n, id);
          e?.classList.remove('is-hot');
          if (!ok) return;
        } else { packet.setAttribute('cx', n.x); packet.setAttribute('cy', n.y); }
        const el = d.nodeEls[cur]; el.classList.add('is-active');
        const c = d.cost[cur] || 0;
        for (let k = 0; k < c; k++) { await sleep(260); if (id !== runId) return; calls++; mCalls.textContent = calls; }
        await sleep(n.t === 'code' ? 140 : n.t === 'human' ? 220 : 120);
        el.classList.remove('is-active');
        if (id !== runId) return;
      }
      packet.classList.add('is-idle');
      runBtn.disabled = false;
      note.textContent = `${d.note} One onboarding run: about ${calls} LLM calls (est.).`;
    };

    segs.forEach(b => b.addEventListener('click', () => { setMode(b.dataset.mode); runBtn.disabled = false; run(); }));
    runBtn.addEventListener('click', run);
    setMode('before');
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); run(); } }, { threshold: .5 }).observe(box);
  });

  /* =========================================================
     Demo 2: offline-first visit with an ordered mutation queue
     ========================================================= */
  $$('[data-demo="offline"]').forEach(box => {
    const dev = $('.device', box), net = $('.net', box), netLabel = $('.net__label', box);
    const list = $('.queue__list', box), empty = $('.queue__empty', box), count = $('.queue__count', box);
    const note = $('.demo__note', box), restartBtn = $('[data-restart]', box), resetBtn = $('[data-reset]', box);
    const tasks = $$('.task', box);
    let online = false, n = 0, replaying = false;
    const items = [];

    const render = () => {
      const waiting = items.filter(i => i.s !== 'synced').length;
      count.textContent = waiting;
      empty.hidden = items.length > 0;
    };
    const add = (op) => {
      const it = { n: ++n, op, s: online ? 'syncing' : 'queued' };
      const li = document.createElement('li');
      li.className = 'q'; li.dataset.s = it.s;
      li.innerHTML = `<span class="q__n">#${it.n}</span><span class="q__op"></span><span class="q__s"></span>`;
      $('.q__op', li).textContent = op;
      it.el = li; items.push(it); list.prepend(li); setS(it, it.s); render();
      if (online && !replaying) syncOne(it);
      else note.textContent = `Saved on this device. ${items.filter(i => i.s === 'queued').length} waiting for network; the screen already shows the result.`;
    };
    const setS = (it, s) => { it.s = s; it.el.dataset.s = s; $('.q__s', it.el).textContent = s === 'queued' ? 'Queued' : s === 'syncing' ? 'Syncing' : 'Synced'; render(); };
    const syncOne = async it => { setS(it, 'syncing'); await sleep(reduced ? 0 : 480); setS(it, 'synced'); };
    const replay = async () => {
      const pending = items.filter(i => i.s === 'queued');
      if (!pending.length) { note.textContent = 'Back online. Nothing was waiting.'; return; }
      replaying = true;
      note.textContent = `Back online. Replaying ${pending.length} change${pending.length > 1 ? 's' : ''} one at a time, oldest first.`;
      for (const it of pending) { if (!online) break; await syncOne(it); }
      replaying = false;
      if (online) note.textContent = pending.some(i => i.op.includes('visit/end'))
        ? 'All synced in order. The end-visit call is idempotent, so if it replays twice nothing breaks.'
        : 'All synced in order, so the server never sees a step before the one it depends on.';
    };

    net.addEventListener('click', () => {
      online = !online;
      net.setAttribute('aria-checked', String(online));
      netLabel.textContent = online ? 'Online' : 'Offline';
      if (online) replay(); else note.textContent = 'Offline. Keep tapping: every change is saved on the device first.';
    });
    tasks.forEach(t => t.addEventListener('click', () => {
      const end = t.classList.contains('task--end');
      if (end && t.getAttribute('aria-pressed') === 'true') return;
      const now = t.getAttribute('aria-pressed') !== 'true';
      t.setAttribute('aria-pressed', String(now));
      if (end) { $('.task__label', t).textContent = 'Visit ended'; tasks.forEach(x => x.disabled = x !== t); }
      add(end ? 'POST visit/end' : `PATCH action/${t.dataset.op}${now ? '' : ' (undo)'}`);
    }));
    restartBtn.addEventListener('click', () => {
      const waiting = items.filter(i => i.s === 'queued').length;
      dev.classList.remove('is-restarting'); void dev.offsetWidth; dev.classList.add('is-restarting');
      setTimeout(() => {
        note.textContent = waiting
          ? `App restarted. ${waiting} queued change${waiting > 1 ? 's' : ''} restored from on-device storage, nothing lost.`
          : 'App restarted. The visit state came back from on-device storage.';
      }, reduced ? 0 : 400);
    });
    resetBtn.addEventListener('click', () => {
      items.length = 0; n = 0; list.innerHTML = ''; render();
      tasks.forEach(t => { t.setAttribute('aria-pressed', 'false'); t.disabled = false; });
      $('.task--end .task__label', box).textContent = 'End visit';
      note.textContent = online ? 'Online. Changes sync as you tap.' : 'Offline. Tap the steps, then switch the network back on.';
    });
    render();
  });

  /* =========================================================
     Demo 3: partition grouping for mixed message sizes
     ========================================================= */
  $$('[data-demo="partitions"]').forEach(box => {
    const canvas = $('canvas', box), ctx = canvas.getContext('2d');
    const segs = $$('.seg button', box), note = $('.demo__note', box), mt = $('[data-m="tput"]', box), mw = $('[data-m="wait"]', box), ml = $('[data-m="lat"]', box);
    let mode = 'single', W = 0, H = 0, msgs = [], workers = [], last = 0, acc = 0, running = false, visible = false, waitEMA = 0;
    let ink = '#000', signal = '#00f', line = '#ccc', muted = '#666';
    const colors = () => { const cs = getComputedStyle(root); ink = cs.getPropertyValue('--ink').trim(); signal = cs.getPropertyValue('--signal').trim(); line = cs.getPropertyValue('--line').trim(); muted = cs.getPropertyValue('--muted').trim(); };
    const SIZES = [{ p: .75, r: 3.5, t: 90 }, { p: .20, r: 6, t: 260 }, { p: .05, r: 10, t: 1100 }];
    const pick = () => { const x = Math.random(); return x < .75 ? 0 : x < .95 ? 1 : 2; };
    const lanesY = () => mode === 'single' ? [H / 2] : [H * .22, H * .5, H * .78];
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2); W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    };
    const reset = () => {
      msgs = []; waitEMA = 0;
      workers = (mode === 'single' ? [0] : [0, 1, 2]).map(() => ({ busy: null, left: 0 }));
      segs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      mt.textContent = mode === 'single' ? '18K/h' : '24K/h';
      ml.textContent = mode === 'single' ? 'Baseline' : '33% lower';
      note.textContent = mode === 'single'
        ? 'One partition: a large payload holds up every small message queued behind it.'
        : 'Grouped by size: large payloads get their own lane and stop blocking the 75% that are small.';
    };
    const laneOf = s => mode === 'single' ? 0 : s;
    const step = dt => {
      acc += dt;
      while (acc > 80) { acc -= 80; const s = pick(); msgs.push({ s, x: -10, lane: laneOf(s), born: performance.now() }); }
      const wx = W - 60;
      workers.forEach((w, li) => {
        if (w.busy) { w.left -= dt; if (w.left <= 0) { w.busy = null; } }
        if (!w.busy) {
          const q = msgs.filter(m => m.lane === li && !m.done).sort((a, b) => b.x - a.x)[0];
          if (q && q.x >= wx - SIZES[q.s].r - 14) {
            q.done = true; w.busy = q; w.left = SIZES[q.s].t * (mode === 'single' ? .55 : 1);
            const wait = performance.now() - q.born; waitEMA = waitEMA ? waitEMA * .95 + wait * .05 : wait;
          }
        }
      });
      // move: queue behind the worker without overlap
      for (let li = 0; li < workers.length; li++) {
        const lane = msgs.filter(m => m.lane === li && !m.done).sort((a, b) => b.x - a.x);
        let limit = wx - 14;
        lane.forEach(m => { const r = SIZES[m.s].r; m.x = Math.min(m.x + dt * .32, limit - r); limit = m.x - r - 3; });
      }
      msgs = msgs.filter(m => !m.done && m.x > -40).slice(-260);
      if (msgs.length > 200) msgs = msgs.slice(-200);
      mw.textContent = `${(waitEMA / 1000).toFixed(1)} s`;
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const ys = lanesY(), wx = W - 60;
      ys.forEach((y, li) => {
        ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(wx - 18, y); ctx.stroke();
        const w = workers[li]; ctx.lineWidth = 1.5; ctx.strokeStyle = ink; ctx.fillStyle = w && w.busy ? signal : 'transparent';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(wx - 14, y - 14, 44, 28, 7) : ctx.rect(wx - 14, y - 14, 44, 28); ctx.fill(); ctx.stroke();
        if (w && w.busy) { ctx.fillStyle = getComputedStyle(root).getPropertyValue('--signal-ink').trim(); ctx.beginPath(); ctx.arc(wx + 8, y, SIZES[w.busy.s].r * .7, 0, Math.PI * 2); ctx.fill(); }
      });
      msgs.forEach(m => { const y = ys[m.lane] ?? ys[0]; ctx.fillStyle = m.s === 2 ? ink : muted; ctx.globalAlpha = m.s === 0 ? .55 : .85; ctx.beginPath(); ctx.arc(m.x, y, SIZES[m.s].r, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
    };
    const loop = t => { if (!running) return; const dt = Math.min(50, t - (last || t)); last = t; step(dt); draw(); requestAnimationFrame(loop); };
    const start = () => { if (!running && visible && !reduced && !document.hidden) { running = true; last = 0; requestAnimationFrame(loop); } };
    segs.forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; reset(); }));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : (running = false); }).observe(canvas);
    document.addEventListener('visibilitychange', () => document.hidden ? (running = false) : start());
    document.addEventListener('themechange', () => { colors(); draw(); });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colors(); draw(); });
    new ResizeObserver(resize).observe(canvas);
    colors(); reset(); resize();
    if (reduced) { for (let i = 0; i < 120; i++) step(30); draw(); }
  });
})();
