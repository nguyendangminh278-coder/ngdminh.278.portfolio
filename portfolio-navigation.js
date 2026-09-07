/* Restore the portfolio's custom viewport and horizontal timeline on return. */
(() => {
  const viewport = document.getElementById('viewport');
  if (!viewport) return;
  const key = 'portfolio:return:' + new URL('.', location.href).pathname;
  let interacted = false;
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (_) {}
  const navigation = performance.getEntriesByType('navigation')[0];
  const returning = navigation?.type === 'back_forward';
  const fromSavedLink = saved && (location.hash === saved.hash || location.hash === saved.section);
  const shouldRestore = saved && (returning || fromSavedLink);
  function save(hash = location.hash, section = '') {
    const state = {
      hash, section, top: viewport.scrollTop,
      timeline: document.getElementById('work-timeline')?.scrollLeft || 0,
      projectTab: document.querySelector('.proj3-tab.is-active')?.dataset.tab,
      skillTab: document.querySelector('.s5-tab.is-active')?.dataset.s5tab
    };
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch (_) {}
  }
  function restore() {
    if (interacted) return;
    if (shouldRestore) {
      const project = Array.from(document.querySelectorAll('.proj3-tab')).find(el => el.dataset.tab === saved.projectTab);
      const skill = Array.from(document.querySelectorAll('.s5-tab')).find(el => el.dataset.s5tab === saved.skillTab);
      project?.click();
      skill?.click();
      const timeline = document.getElementById('work-timeline');
      if (timeline) timeline.scrollLeft = saved.timeline || 0;
      viewport.scrollTo({ top: Number(saved.top) || 0, behavior: 'instant' });
    } else if (location.hash) {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
      document.getElementById(id)?.scrollIntoView({ block: 'start', inline: 'center', behavior: 'instant' });
    }
  }
  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(restore));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = new URL(link.href, location.href);
    if (target.pathname === location.pathname && target.origin === location.origin && target.hash) return;
    const section = link.closest('section[id]');
    if (!section) return;
    const hash = '#' + (link.id || section.id);
    history.replaceState(history.state, '', hash);
    save(hash, '#' + section.id);
  }, true);
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(type => {
    window.addEventListener(type, () => { interacted = true; }, { passive: true, once: true });
  });
  window.addEventListener('pagehide', () => save());
  window.addEventListener('pageshow', event => { if (!event.persisted) schedule(); });
  window.addEventListener('load', schedule);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})();
