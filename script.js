(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Nav: solid background after scrolling, mobile menu */
  const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');
  const onScroll = () => nav.classList.toggle('solid', scrollY > 60 || !document.body.classList.contains('home-page'));
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = open => {
    menu.classList.toggle('open', open);
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
    onScroll();
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });

  /* Scroll reveal */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* Count-up stats */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.count;
      countIO.unobserve(el);
      if (reduce) { el.textContent = to; return; }
      const t0 = performance.now(), dur = 1800;
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => { if (!reduce) el.textContent = '0'; countIO.observe(el); });

  /* Project filter (reflected in ?cat=) */
  const cards = $$('.card'), grid = $('#grid');
  const filterBtns = $$('.filters button');
  if (cards.length && grid && $('#dlg')) {
  const applyFilter = f => {
    filterBtns.forEach(b => {
      const on = b.dataset.filter === f;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on);
    });
    cards.forEach(c => c.classList.toggle('hide', f !== 'all' && c.dataset.cat !== f));
    grid.classList.toggle('filtered', f !== 'all');
  };
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    applyFilter(f);
    const url = new URL(location.href);
    f === 'all' ? url.searchParams.delete('cat') : url.searchParams.set('cat', f);
    history.replaceState(null, '', url);
  }));
  const initCat = new URLSearchParams(location.search).get('cat');
  if (initCat && filterBtns.some(b => b.dataset.filter === initCat)) applyFilter(initCat);

  /* Project dialog */
  const data = [
    { d: '以大面積採光與木質、織品的搭配，營造溫潤放鬆的起居空間。', s: ['空間|客廳'] },
    { d: '低彩度色調與柔和燈光，打造適合休息的臥室。', s: ['空間|臥室'] },
    { d: '運用自然光與軟裝佈置，讓客廳兼具明亮與舒適。', s: ['空間|客廳'] },
    { d: '簡潔俐落的磚面與木質元素，讓衛浴空間清爽好整理。', s: ['空間|衛浴'] },
    { d: '木質格柵與簡潔量體構成的住宅立面。', s: ['空間|建築外觀'] },
    { d: '以中性色調為基底，點綴掛畫與圓形元素的客廳。', s: ['空間|客廳'] },
    { d: '人字拼地板與藤編收納櫃，打造溫暖的玄關與餐廳入口。', s: ['空間|玄關'] },
  ];
  data.forEach(x => x.s.push('備註|示意圖片，非實際案例'));
  const dlg = $('#dlg');
  const open = c => {
    const i = +c.dataset.id, img = $('img', c);
    $('#dlgImg').src = img.src.replace(/w=\d+/, 'w=1800');
    $('#dlgImg').alt = img.alt;
    $('#dlgMeta').textContent = $('span', c).textContent;
    $('#dlgTitle').textContent = $('h3', c).textContent;
    $('#dlgDesc').textContent = data[i].d;
    $('#dlgSpec').replaceChildren(...data[i].s.map(x => {
      const [k, v] = x.split('|');
      const row = document.createElement('div');
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k; dd.textContent = v;
      row.append(dt, dd);
      return row;
    }));
    dlg.showModal();
    document.body.style.overflow = 'hidden';
    history.replaceState(null, '', `#work-${i}`);
  };
  cards.forEach(c => {
    c.addEventListener('click', () => open(c));
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); } });
  });
  $('#dlgClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => {
    document.body.style.overflow = '';
    if (location.hash.startsWith('#work-')) history.replaceState(null, '', location.pathname + location.search + '#projects');
  });
  const deep = location.hash.match(/^#work-(\d+)$/);
  if (deep) { const c = cards.find(x => x.dataset.id === deep[1]); if (c) open(c); }
  }

  /* Hero parallax */
  const heroImg = $('.hero-media img');
  let ticking = false;
  if (!reduce && heroImg) addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (scrollY < innerHeight) heroImg.style.translate = `0 ${scrollY * 0.18}px`;
      ticking = false;
    });
  }, { passive: true });

  /* Prepare a prefilled email; the visitor reviews and sends it in their own mail app. */
  const form = $('#form'), note = $('#formNote');
  if (form && note) form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.elements.name, phone = form.elements.phone, email = form.elements.email;
    const bad = [];
    const nameError = name.value.trim() ? '' : '請填寫姓名';
    const hasContact = Boolean(phone.value.trim() || email.value.trim());
    const emailBad = Boolean(email.value.trim() && !email.validity.valid);
    const contactError = !hasContact ? '請至少填寫電話或 Email' : emailBad ? 'Email 格式不正確' : '';
    $('#e-name').textContent = nameError;
    $('#e-contact').textContent = contactError;
    name.setAttribute('aria-invalid', nameError ? 'true' : 'false');
    phone.setAttribute('aria-invalid', !hasContact ? 'true' : 'false');
    email.setAttribute('aria-invalid', !hasContact || emailBad ? 'true' : 'false');
    if (nameError) bad.push(name);
    if (contactError) bad.push(emailBad ? email : phone);
    if (bad.length) {
      note.style.color = '#a23b25';
      note.textContent = '請修正標示的欄位。';
      bad[0].focus();
      return;
    }
    note.style.color = '';
    note.textContent = '已為您準備諮詢 Email，請在開啟的郵件視窗確認並按下寄送。';
    const details = [
      `姓名：${name.value.trim()}`,
      `電話：${phone.value.trim() || '未提供'}`,
      `Email：${email.value.trim() || '未提供'}`,
      `空間類型：${form.elements.type.value}`,
      `預估預算：${form.elements.budget.value}`,
      `需求說明：${form.elements.msg.value.trim() || '未提供'}`,
    ].join('\n');
    const subject = `東陞室內裝修諮詢｜${name.value.trim()}`;
    window.location.href = `mailto:eastsun.building@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(details)}`;
  });
})();
