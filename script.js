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
    { d: '以淺木色電視牆、簡潔收納與開放式客餐廚配置，整合居家主要活動空間。', s: ['空間|客廳與餐廚', '專案|新店住宅'] },
    { d: '淺色床組搭配簡潔牆面與收納，保留舒適、明亮的休息空間。', s: ['空間|臥室', '專案|桃園山鼻住宅'] },
    { d: '以沙發、電視牆與餐廚區串聯生活動線，呈現新店住宅的客餐廳實景。', s: ['空間|客餐廳', '專案|新店住宅'] },
    { d: '以淺色檯面、鏡櫃和玻璃淋浴間整理衛浴設備與使用區域。', s: ['空間|衛浴', '專案|新店住宅'] },
    { d: '木質踏階、立面格柵和樓梯下方收納相互整合，延伸空間的垂直動線。', s: ['空間|樓梯與木作', '專案|桃園山鼻住宅'] },
    { d: '深色櫥櫃搭配淺色檯面與嵌入式設備，清楚分配料理與收納空間。', s: ['空間|廚房', '專案|新店住宅'] },
    { d: '利用窗邊木作桌面和層架，整理工作區與日常收納，並保留自然採光。', s: ['空間|書桌與收納', '專案|新店住宅'] },
  ];
  const dlg = $('#dlg');
  const open = c => {
    const i = +c.dataset.id, img = $('img', c);
    $('#dlgImg').src = img.src;
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
