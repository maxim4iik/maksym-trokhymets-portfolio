const root = document.documentElement;
root.classList.add('js');

const setupSmoothWheelScroll = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduceMotion.matches || !('requestAnimationFrame' in window)) return;

  root.classList.add('smooth-wheel');

  let current = window.scrollY;
  let target = current;
  let frame = 0;

  const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);
  const clamp = (value) => Math.min(Math.max(value, 0), maxScroll());

  const isNativeScrollArea = (element) => {
    if (!(element instanceof Element)) return false;
    if (element.closest('.preview-modal, .preview-frame, iframe, textarea, select, [data-native-scroll]')) {
      return true;
    }

    let node = element;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const canScroll = /(auto|scroll)/.test(`${style.overflow}${style.overflowY}`);
      if (canScroll && node.scrollHeight > node.clientHeight + 1) return true;
      node = node.parentElement;
    }

    return false;
  };

  const step = () => {
    target = clamp(target);
    const delta = target - current;

    if (Math.abs(delta) < 0.45) {
      current = target;
      window.scrollTo(0, current);
      frame = 0;
      return;
    }

    current += delta * 0.12;
    window.scrollTo(0, current);
    frame = window.requestAnimationFrame(step);
  };

  const scrollToSmooth = (value) => {
    current = window.scrollY;
    target = clamp(value);

    if (!frame) {
      frame = window.requestAnimationFrame(step);
    }
  };

  window.addEventListener(
    'wheel',
    (event) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        document.body.classList.contains('preview-open') ||
        isNativeScrollArea(event.target)
      ) {
        return;
      }

      event.preventDefault();

      if (!frame) {
        current = window.scrollY;
        target = current;
      }

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      target = clamp(target + event.deltaY * unit);

      if (!frame) {
        frame = window.requestAnimationFrame(step);
      }
    },
    { passive: false }
  );

  window.addEventListener(
    'scroll',
    () => {
      if (!frame) {
        current = window.scrollY;
        target = current;
      }
    },
    { passive: true }
  );

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const url = new URL(link.href);
    if (url.pathname !== window.location.pathname || !url.hash) return;

    const id = decodeURIComponent(url.hash.slice(1));
    const targetElement = id ? document.getElementById(id) : document.documentElement;
    if (!targetElement) return;

    event.preventDefault();

    const margin = Number.parseFloat(window.getComputedStyle(targetElement).scrollMarginTop) || 0;
    const nextY = targetElement.getBoundingClientRect().top + window.scrollY - margin;
    scrollToSmooth(nextY);
    history.pushState(null, '', url.hash);
  });
};

setupSmoothWheelScroll();

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
    loading: isUa ? 'Завантажую публічну активність...' : 'Loading public activity...',
    unavailable: isUa
      ? 'Публічна активність тимчасово недоступна.'
      : 'Public activity is temporarily unavailable.',
    sideActivity: isUa ? 'Публічна активність side-проєктів' : 'Public side-project activity',
    latest: isUa ? 'остання' : 'latest',
    events: isUa ? 'подій' : 'events'
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(value));
  };

  const renderGrid = (events = []) => {
    if (!grid) return;

    const counts = new Map();
    events.forEach((event) => {
      if (!event.created_at) return;
      const key = event.created_at.slice(0, 10);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    grid.replaceChildren();

    for (let index = 41; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      const count = counts.get(key) || 0;
      const cell = document.createElement('span');
      cell.dataset.level = String(Math.min(4, count));
      cell.title = `${formatDate(key)}: ${count} ${text.events}`;
      grid.append(cell);
    }
  };

  const renderFallback = () => {
    if (summary) summary.textContent = text.unavailable;
  };

  const loadGithubActivity = async () => {
    if (!user) return;
    if (summary) summary.textContent = text.loading;
    renderGrid();

    try {
      const eventsResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/events/public?per_page=60`, {
        headers: { Accept: 'application/vnd.github+json' }
      });

      if (!eventsResponse.ok) {
        throw new Error('GitHub API unavailable');
      }

      const events = await eventsResponse.json();

      const latestEvent = Array.isArray(events) ? events[0] : null;
      if (summary) {
        const latest = latestEvent ? ` · ${text.latest} ${formatDate(latestEvent.created_at)}` : '';
        summary.textContent = `${text.sideActivity}${latest}`;
      }

      renderGrid(Array.isArray(events) ? events : []);
    } catch {
      renderGrid();
      renderFallback();
    }
  };

  loadGithubActivity();
}
