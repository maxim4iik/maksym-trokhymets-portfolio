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
    const nextY = targetElement.getBoundingClientRect().top + window.scrollY - margin;
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

const githubActivity = document.querySelector('[data-github-activity]');

if (githubActivity) {
  const user = githubActivity.dataset.githubUser;
  const grid = githubActivity.querySelector('[data-github-grid]');
  const summary = githubActivity.querySelector('[data-github-summary]');
  const isUa = document.documentElement.lang === 'uk';
  const locale = isUa ? 'uk-UA' : 'en-US';

  const text = {
    loading: isUa ? 'Завантажую активність...' : 'Loading activity...',
    unavailable: isUa
      ? 'Активність тимчасово недоступна.'
      : 'Activity is temporarily unavailable.',
    contributions: isUa ? 'контрибуцій за рік' : 'contributions in the last year',
    contribOne: isUa ? 'контрибуція' : 'contribution',
    contribFew: isUa ? 'контрибуції' : 'contributions'
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`));
  };

  const plural = (n) => (n === 1 ? text.contribOne : text.contribFew);

  // Render exactly the days the API returns (last 42), oldest → newest.
  const renderGrid = (days = []) => {
    if (!grid) return;
    grid.replaceChildren();

    if (days.length === 0) {
      // Placeholder empties so the grid keeps its shape while loading.
      for (let i = 0; i < 42; i += 1) {
        const cell = document.createElement('span');
        cell.dataset.level = '0';
        grid.append(cell);
      }
      return;
    }

    days.forEach((day) => {
      const cell = document.createElement('span');
      cell.dataset.level = String(Math.max(0, Math.min(4, day.level ?? 0)));
      cell.title = `${formatDate(day.date)}: ${day.count} ${plural(day.count)}`;
      grid.append(cell);
    });
  };

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
