const root = document.documentElement;
root.classList.add('js');

const scrollProgress = document.querySelector('[data-scroll-progress]');

if (scrollProgress) {
  let pending = false;

  const updateScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable <= 0 ? 0 : window.scrollY / scrollable;
    const pct = Math.max(0, Math.min(1, ratio)) * 100;
    scrollProgress.style.setProperty('--scroll-progress', `${pct}%`);
    pending = false;
  };

  const scheduleScrollProgress = () => {
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(updateScrollProgress);
    }
  };

  updateScrollProgress();
  window.addEventListener('scroll', scheduleScrollProgress, { passive: true });
  window.addEventListener('resize', scheduleScrollProgress);
}

const themeToggle = document.querySelector('[data-theme-toggle]');

if (themeToggle) {
  const isUa = document.documentElement.lang === 'uk';
  const labels = isUa
    ? { auto: 'Тема: авто (за пристроєм). Натисніть, щоб обрати світлу',
        light: 'Тема: світла. Натисніть, щоб обрати темну',
        dark: 'Тема: темна. Натисніть, щоб повернути авто' }
    : { auto: 'Theme: auto (follows device). Click for light',
        light: 'Theme: light. Click for dark',
        dark: 'Theme: dark. Click for auto' };

  // mode is the user's choice: 'auto' (no data-theme, follows the OS),
  // 'light' or 'dark' (explicit override persisted in localStorage).
  const order = ['auto', 'light', 'dark'];

  const currentMode = () => {
    const attr = document.documentElement.getAttribute('data-theme');
    return attr === 'light' || attr === 'dark' ? attr : 'auto';
  };

  const applyMode = (mode) => {
    if (mode === 'auto') {
      document.documentElement.removeAttribute('data-theme');
      try { localStorage.removeItem('theme'); } catch { /* ignore */ }
    } else {
      document.documentElement.setAttribute('data-theme', mode);
      try { localStorage.setItem('theme', mode); } catch { /* ignore */ }
    }
    themeToggle.dataset.mode = mode;
    themeToggle.setAttribute('aria-label', labels[mode]);
  };

  themeToggle.addEventListener('click', () => {
    const next = order[(order.indexOf(currentMode()) + 1) % order.length];
    applyMode(next);
  });

  // Reflect the initial mode (set by theme-init.js before paint).
  applyMode(currentMode());
}

const setupSmoothAnchorScroll = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduceMotion.matches) return;

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const link = target ? target.closest('a[href^="#"]') : null;
    if (!link) return;

    const url = new URL(link.href);
    if (url.pathname !== window.location.pathname || !url.hash) return;

    const id = decodeURIComponent(url.hash.slice(1));
    const targetElement = id ? document.getElementById(id) : document.documentElement;
    if (!targetElement) return;

    event.preventDefault();

    const margin = Number.parseFloat(window.getComputedStyle(targetElement).scrollMarginTop) || 0;
    const nextY = id === 'top'
      ? 0
      : targetElement.getBoundingClientRect().top + window.scrollY - margin;
    window.scrollTo({ top: nextY, behavior: 'smooth' });
    history.pushState(null, '', url.hash);
  });
};

setupSmoothAnchorScroll();

const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav.toggleAttribute('data-open', !open);
  });
}

const revealItems = document.querySelectorAll('[data-reveal]');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-visible', 'true');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.setAttribute('data-visible', 'true'));
}

const timeline = document.querySelector('[data-timeline]');

if (timeline) {
  const items = Array.from(timeline.querySelectorAll('.timeline-item'));
  let ticking = false;

  const updateTimeline = () => {
    const rect = timeline.getBoundingClientRect();
    const viewportCenter = window.innerHeight * 0.52;
    const total = Math.max(1, rect.height - window.innerHeight * 0.72);
    const passed = Math.min(Math.max(-rect.top + window.innerHeight * 0.18, 0), total);
    timeline.style.setProperty('--timeline-progress', `${(passed / total) * 100}%`);

    let active = items[0];
    let activeDistance = Infinity;

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenter = itemRect.top + itemRect.height * 0.42;
      const distance = Math.abs(itemCenter - viewportCenter);

      if (distance < activeDistance) {
        active = item;
        activeDistance = distance;
      }
    });

    items.forEach((item) => item.classList.toggle('is-active', item === active));
    ticking = false;
  };

  const requestTimelineUpdate = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateTimeline);
      ticking = true;
    }
  };

  updateTimeline();
  window.addEventListener('scroll', requestTimelineUpdate, { passive: true });
  window.addEventListener('resize', requestTimelineUpdate);
}

const previewModal = document.querySelector('#site-preview');

if (previewModal) {
  const previewImage = previewModal.querySelector('[data-preview-image]');
  const previewIframe = previewModal.querySelector('[data-preview-iframe]');
  const previewSnapshot = previewModal.querySelector('[data-preview-snapshot]');
  const previewNote = previewModal.querySelector('[data-preview-note]');
  const previewTitle = previewModal.querySelector('[data-preview-title]');
  const previewSummary = previewModal.querySelector('[data-preview-summary]');
  const previewStatus = previewModal.querySelector('[data-preview-status]');
  const previewRole = previewModal.querySelector('[data-preview-role]');
  const previewYear = previewModal.querySelector('[data-preview-year]');
  const previewDomain = previewModal.querySelector('[data-preview-domain]');
  const previewMode = previewModal.querySelector('[data-preview-mode]');
  const previewUrl = previewModal.querySelector('[data-preview-url]');
  const closeButtons = previewModal.querySelectorAll('[data-preview-close]');
  const previewTriggers = document.querySelectorAll('button[data-preview-image]');
  let lastTrigger = null;

  const closePreview = () => {
    previewModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('preview-open');
    if (previewIframe) previewIframe.src = 'about:blank';
    if (lastTrigger) lastTrigger.focus();
  };

  const openPreview = (trigger) => {
    lastTrigger = trigger;
    const title = trigger.dataset.previewTitle || 'Project preview';
    const image = trigger.dataset.previewImage || '';
    const domain = trigger.dataset.previewDomain || '';
    const url = trigger.dataset.previewUrl || '';
    const year = trigger.dataset.previewYear || '';
    const canEmbed = Boolean(url) && trigger.dataset.previewEmbed !== 'false';

    previewTitle.textContent = title;
    previewSummary.textContent = trigger.dataset.previewSummary || '';
    previewStatus.textContent = trigger.dataset.previewStatus || 'Preview';
    previewRole.textContent = trigger.dataset.previewRole || '';
    previewYear.textContent = year;
    previewYear.hidden = !year;
    previewDomain.textContent = domain;
    previewImage.src = image;
    previewImage.alt = `${title} website preview`;

    if (canEmbed) {
      previewIframe.hidden = false;
      previewIframe.title = `${title} live website preview`;
      previewIframe.src = url;
      previewSnapshot.hidden = true;
      previewMode.textContent = 'Live embedded preview - scroll inside';
    } else {
      previewIframe.hidden = true;
      previewIframe.src = 'about:blank';
      previewSnapshot.hidden = false;
      previewNote.textContent =
        trigger.dataset.previewNote ||
        'Live embedding is unavailable for this project, so this portfolio shows a captured preview.';
      previewMode.textContent = 'Captured preview';
    }

    if (url) {
      previewUrl.href = url;
      previewUrl.hidden = false;
    } else {
      previewUrl.hidden = true;
    }

    previewModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('preview-open');
    previewModal.querySelector('.preview-close').focus();
  };

  previewTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openPreview(trigger));
  });

  closeButtons.forEach((button) => button.addEventListener('click', closePreview));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && previewModal.getAttribute('aria-hidden') === 'false') {
      closePreview();
    }
  });
}

const caseStudyModal = document.querySelector('#ba-case-study');

if (caseStudyModal) {
  const triggers = document.querySelectorAll('[data-case-open]');
  const closeButtons = caseStudyModal.querySelectorAll('[data-case-close]');
  const closeButton = caseStudyModal.querySelector('.preview-close');
  let lastTrigger = null;

  const closeCaseStudy = () => {
    caseStudyModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('case-open');
    if (lastTrigger) lastTrigger.focus();
  };

  const openCaseStudy = (trigger) => {
    lastTrigger = trigger;
    caseStudyModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('case-open');
    closeButton?.focus();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openCaseStudy(trigger));
  });

  closeButtons.forEach((button) => button.addEventListener('click', closeCaseStudy));

  document.addEventListener('keydown', (event) => {
    if (caseStudyModal.getAttribute('aria-hidden') !== 'false') return;

    if (event.key === 'Escape') {
      closeCaseStudy();
      return;
    }

    if (event.key === 'Tab' && closeButton) {
      event.preventDefault();
      closeButton.focus();
    }
  });
}

const githubActivity = document.querySelector('[data-github-activity]');

if (githubActivity) {
  const grid = githubActivity.querySelector('[data-github-grid]');
  const months = githubActivity.querySelector('[data-github-months]');
  const summary = githubActivity.querySelector('[data-github-summary]');
  const detail = githubActivity.querySelector('[data-github-detail]');
  const calendarScroll = githubActivity.querySelector('[data-github-scroll]');
  const isUa = document.documentElement.lang === 'uk';
  const locale = isUa ? 'uk-UA' : 'en-US';
  const weekCount = 26;
  const cellCount = weekCount * 7;

  const text = {
    loading: isUa ? 'Завантажую активність...' : 'Loading activity...',
    unavailable: isUa
      ? 'Активність тимчасово недоступна.'
      : 'Activity is temporarily unavailable.',
    contributions: isUa ? 'контрибуцій за рік' : 'contributions in the last year',
    contribOne: isUa ? 'контрибуція' : 'contribution',
    contribFew: isUa ? 'контрибуції' : 'contributions',
    contribMany: isUa ? 'контрибуцій' : 'contributions',
    noContributions: isUa ? 'немає контрибуцій' : 'no contributions'
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`));
  };

  const plural = (n) => {
    if (!isUa) return n === 1 ? text.contribOne : text.contribFew;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return text.contribOne;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return text.contribFew;
    return text.contribMany;
  };

  const describeDay = (day) =>
    `${formatDate(day.date)}: ${day.count > 0 ? `${day.count} ${plural(day.count)}` : text.noContributions}`;

  const buildCalendarSlots = (days) => {
    const normalized = days
      .filter((day) => day?.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (normalized.length === 0) return Array(cellCount).fill(null);

    const firstWeekday = new Date(`${normalized[0].date}T12:00:00`).getDay();
    const slots = [...Array(firstWeekday).fill(null), ...normalized];

    while (slots.length % 7 !== 0) slots.push(null);
    while (slots.length < cellCount) slots.push(null);

    return slots.slice(-cellCount);
  };

  const renderMonths = (slots) => {
    if (!months) return;
    months.replaceChildren();

    let previousMonth = '';

    for (let week = 0; week < weekCount; week += 1) {
      const weekDays = slots.slice(week * 7, week * 7 + 7).filter(Boolean);
      const firstDay = weekDays[0];
      if (!firstDay) continue;

      const date = new Date(`${firstDay.date}T12:00:00`);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      if (week === 0 || monthKey !== previousMonth) {
        const label = document.createElement('span');
        label.style.gridColumn = String(week + 1);
        label.textContent = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
        months.append(label);
      }

      previousMonth = monthKey;
    }
  };

  const focusDay = (button) => {
    if (!button) return;
    grid.querySelectorAll('.github-day[tabindex="0"]').forEach((cell) => {
      cell.tabIndex = -1;
    });
    button.tabIndex = 0;
    button.focus();
  };

  const renderGrid = (days = []) => {
    if (!grid) return;
    grid.replaceChildren();
    const slots = buildCalendarSlots(days);

    slots.forEach((day, slotIndex) => {
      if (!day) {
        const empty = document.createElement('span');
        empty.className = 'github-day is-empty';
        empty.setAttribute('aria-hidden', 'true');
        grid.append(empty);
        return;
      }

      const cell = document.createElement('button');
      const description = describeDay(day);
      cell.type = 'button';
      cell.className = 'github-day';
      cell.dataset.level = String(Math.max(0, Math.min(4, day.level ?? 0)));
      cell.dataset.slot = String(slotIndex);
      cell.title = description;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', description);
      cell.tabIndex = -1;
      cell.addEventListener('mouseenter', () => {
        if (detail) detail.textContent = description;
      });
      cell.addEventListener('focus', () => {
        if (detail) detail.textContent = description;
      });
      cell.addEventListener('click', () => {
        if (detail) detail.textContent = description;
      });
      grid.append(cell);
    });

    renderMonths(slots);

    const dayButtons = Array.from(grid.querySelectorAll('.github-day:not(.is-empty)'));
    const latestDay = dayButtons.at(-1);
    if (latestDay) {
      latestDay.tabIndex = 0;
      if (detail) detail.textContent = latestDay.getAttribute('aria-label');
    }

    if (calendarScroll) {
      calendarScroll.scrollLeft = window.matchMedia('(max-width: 620px)').matches
        ? calendarScroll.scrollWidth
        : 0;
    }
  };

  grid?.addEventListener('keydown', (event) => {
    const current = event.target.closest('.github-day[data-slot]');
    if (!current) return;

    const slot = Number(current.dataset.slot);
    const offsets = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    let target = null;

    if (event.key in offsets) {
      target = grid.querySelector(`.github-day[data-slot="${slot + offsets[event.key]}"]`);
    } else if (event.key === 'Home') {
      target = grid.querySelector('.github-day[data-slot]');
    } else if (event.key === 'End') {
      target = Array.from(grid.querySelectorAll('.github-day[data-slot]')).at(-1);
    }

    if (target) {
      event.preventDefault();
      focusDay(target);
    }
  });

  const renderFallback = () => {
    if (summary) summary.textContent = text.unavailable;
  };

  const loadGithubActivity = async () => {
    if (summary) summary.textContent = text.loading;
    renderGrid();

    try {
      const response = await fetch('/api/github-contributions', {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Contributions API unavailable');
      }

      const data = await response.json();
      const days = Array.isArray(data.days) ? data.days : [];

      if (summary) {
        summary.textContent =
          typeof data.total === 'number'
            ? `${data.total.toLocaleString(locale)} ${text.contributions}`
            : text.unavailable;
      }

      renderGrid(days);
    } catch {
      renderGrid();
      renderFallback();
    }
  };

  loadGithubActivity();
}
