(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav: solid background after scrolling, mobile menu */
  const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');
  const onScroll = () => {
    nav.classList.toggle('solid', scrollY > 60 || !document.body.classList.contains('home-page'));
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--scroll-progress', scrollable > 0 ? scrollY / scrollable : 0);
    if (!reduce && document.body.classList.contains('home-page')) {
      document.documentElement.style.setProperty('--hero-offset', `${Math.min(scrollY * 0.12, 72)}px`);
    }
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
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }

  /* Count-up stats */
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target, to = +el.dataset.count;
        countIO.unobserve(el);
        const t0 = performance.now(), dur = 1400;
        const tick = now => {
          const p = Math.min((now - t0) / dur, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => { el.textContent = '0'; countIO.observe(el); });
  } else {
    counters.forEach(el => { el.textContent = el.dataset.count; });
  }

  /* Featured projects carousel */
  const cards = $$('.card'), track = $('#projectsTrack');
  const worksCount = $('#worksCount');
  const worksPrev = $('#worksPrev'), worksNext = $('#worksNext');
  if (cards.length && track && worksCount && worksPrev && worksNext) {
    let activeSlide = 0, scrollFrame = 0;
    const updateControls = () => {
      worksCount.textContent = `${String(activeSlide + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      worksPrev.disabled = activeSlide === 0;
      worksNext.disabled = activeSlide === cards.length - 1 || track.scrollWidth - track.clientWidth <= 1;
    };
    const updateCarousel = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 1) {
        activeSlide = 0;
      } else if (track.scrollLeft >= maxScroll - 1) {
        activeSlide = cards.length - 1;
      } else {
        const trackLeft = track.getBoundingClientRect().left;
        activeSlide = cards.reduce((closest, card, index) => {
          const cardLeft = card.getBoundingClientRect().left - trackLeft;
          const closestLeft = cards[closest].getBoundingClientRect().left - trackLeft;
          return Math.abs(cardLeft) < Math.abs(closestLeft) ? index : closest;
        }, 0);
      }
      updateControls();
    };
    const goToSlide = index => {
      const nextSlide = Math.max(0, Math.min(cards.length - 1, index));
      activeSlide = nextSlide;
      updateControls();
      cards[nextSlide].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'start' });
    };
    track.addEventListener('scroll', () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        updateCarousel();
        scrollFrame = 0;
      });
    }, { passive: true });
    addEventListener('resize', updateCarousel, { passive: true });
    worksPrev.addEventListener('click', () => goToSlide(activeSlide - 1));
    worksNext.addEventListener('click', () => goToSlide(activeSlide + 1));
    track.addEventListener('keydown', e => {
      if (e.target.closest('.card') || e.target === track) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); goToSlide(activeSlide - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(activeSlide + 1); }
      }
    });
    updateCarousel();
  }

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
