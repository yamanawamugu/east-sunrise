(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Nav: solid background after scrolling, mobile menu */
  const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');
  const onScroll = () => {
    nav.classList.toggle('solid', scrollY > 60 || !document.body.classList.contains('home-page'));
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--scroll-progress', scrollable > 0 ? scrollY / scrollable : 0);
  };
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
    {
      d: '淺木色中島、整合式收納與開放餐廚，讓備餐、用餐與日常相聚自然相連。',
      s: ['空間|住宅餐廚與收納', '專案|易德聚'],
      images: [
        { src: 'images/projects/yideju-01.webp', alt: '易德聚住宅餐廚空間，淺木色中島與整合式收納' },
        { src: 'images/projects/yideju-02.webp', alt: '易德聚住宅客廳電視牆，淺木色櫃體搭配展示燈光' },
        { src: 'images/projects/yideju-03.webp', alt: '易德聚住宅客餐廳與廚房相連的開放空間' },
        { src: 'images/projects/yideju-04.webp', alt: '易德聚住宅梳妝與收納區，弧形門洞連接室內空間' },
      ],
    },
    {
      d: '從樓梯、展示收納到工作角落，梳理垂直動線與日常使用，讓每一層都保有清楚節奏。',
      s: ['空間|住宅室內', '地點|桃園山鼻二路30號'],
      images: [
        { src: 'images/projects/taoyuan-shanbi-01.webp', alt: '桃園山鼻住宅樓梯與衣物收納空間' },
        { src: 'images/projects/taoyuan-shanbi-02.webp', alt: '桃園山鼻住宅樓梯下方的木作展示收納' },
        { src: 'images/projects/taoyuan-shanbi-03.webp', alt: '桃園山鼻住宅臥室，淺色床組與簡潔收納' },
        { src: 'images/projects/taoyuan-shanbi-04.webp', alt: '桃園山鼻住宅起居空間與工作桌' },
      ],
    },
    {
      d: '收錄二樓、三樓與六樓的住宅實景，依不同樓層整理廚房、起居與收納，呈現各自的生活樣貌。',
      s: ['空間|住宅室內', '內容|二樓、三樓與六樓實景'],
      images: [
        { src: 'images/projects/xindian-central-01.webp', alt: '新店中央五街二樓住宅廚房，深色櫥櫃搭配明亮檯面' },
        { src: 'images/projects/xindian-central-02.webp', alt: '新店中央五街三樓住宅客廳，木質電視牆與淺色地坪' },
        { src: 'images/projects/xindian-central-03.webp', alt: '新店中央五街六樓住宅工作與收納空間' },
        { src: 'images/projects/xindian-central-04.webp', alt: '新店中央五街華廈建築外觀' },
      ],
    },
  ];
  const dlg = $('#dlg');
  const dlgImg = $('#dlgImg'), dlgCount = $('#dlgCount');
  const dlgPrev = $('#dlgPrev'), dlgNext = $('#dlgNext');
  let activeProject = 0, activeImage = 0;
  const showImage = () => {
    const images = data[activeProject].images;
    const image = images[activeImage];
    dlgImg.src = image.src;
    dlgImg.alt = image.alt;
    dlgCount.textContent = `${String(activeImage + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
    dlgPrev.disabled = images.length < 2;
    dlgNext.disabled = images.length < 2;
  };
  const moveImage = direction => {
    const images = data[activeProject].images;
    activeImage = (activeImage + direction + images.length) % images.length;
    showImage();
  };
  const open = c => {
    const i = +c.dataset.id;
    activeProject = i;
    activeImage = 0;
    showImage();
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
  dlgPrev.addEventListener('click', () => moveImage(-1));
  dlgNext.addEventListener('click', () => moveImage(1));
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') moveImage(-1);
    if (e.key === 'ArrowRight') moveImage(1);
  });
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
      `需求說明：${form.elements.msg.value.trim() || '未提供'}`,
    ].join('\n');
    const subject = `東陞室內裝修諮詢｜${name.value.trim()}`;
    window.location.href = `mailto:eastsun.building@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(details)}`;
  });
})();
