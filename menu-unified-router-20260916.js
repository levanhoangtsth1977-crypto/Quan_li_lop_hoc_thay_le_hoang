/* MENU UNIFIED ROUTER 2026-09-16
 * One capture-phase entry point for canonical menu navigation and homepage quick actions.
 * This module does not own CRUD/save/submit events; it only routes UI navigation.
 */
(function () {
  'use strict';

  if (window.__LH_MENU_UNIFIED_ROUTER_20260916__) return;
  window.__LH_MENU_UNIFIED_ROUTER_20260916__ = true;

  var LABELS = {
    dashboard: 'Trang chủ',
    students: 'Học sinh',
    attendance: 'Điểm danh',
    violations: 'Vi phạm',
    rewards: 'Khen thưởng',
    learning: 'Học tập',
    statistics: 'Thống kê',
    'student-links': 'Link học sinh',
    ai: 'AI giáo viên',
    'lucky-wheel': 'Vòng quay may mắn',
    settings: 'Cài đặt'
  };

  var PAGES = Object.keys(LABELS);

  function hasPage(value) {
    return PAGES.indexOf(String(value || '').trim()) !== -1;
  }

  function closeSidebar() {
    try {
      if (typeof window.closeMobileSidebar === 'function') {
        window.closeMobileSidebar();
        return;
      }
    } catch (e) {}
    try {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebarOverlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.display = '';
        overlay.style.pointerEvents = 'none';
      }
    } catch (e) {}
  }

  function setActiveDom(page) {
    var section = document.querySelector('[data-page-section="' + CSS.escape(page) + '"]');
    if (!section) return false;

    document.querySelectorAll('[data-page-section]').forEach(function (el) {
      var active = el === section;
      el.classList.toggle('active', active);
      if (active) {
        el.hidden = false;
        el.removeAttribute('aria-hidden');
      } else {
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
      }
    });

    document.querySelectorAll('.menu-item[data-page]').forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-page') === page);
      item.setAttribute('aria-current', item.getAttribute('data-page') === page ? 'page' : 'false');
    });

    var title = document.getElementById('pageTitle');
    if (title) title.textContent = LABELS[page] || page;

    try {
      document.title = 'Quản lý lớp học Thầy Lê Hoàng — ' + (LABELS[page] || page);
    } catch (e) {}

    closeSidebar();
    return true;
  }

  function tryCanonical(page) {
    var fn = null;
    try {
      if (typeof window.navigateToPage === 'function') fn = window.navigateToPage;
      else if (window.LopHocApp && typeof window.LopHocApp.navigateToPage === 'function') {
        fn = window.LopHocApp.navigateToPage;
      } else if (window.LopHocApp && typeof window.LopHocApp.navigate === 'function') {
        fn = window.LopHocApp.navigate;
      }
    } catch (e) {}

    if (!fn) return false;

    try {
      var result = fn.call(window, page);
      if (result !== false) {
        setActiveDom(page);
        return true;
      }
    } catch (e) {
      console.warn('[MENU UNIFIED ROUTER] canonical navigation failed:', page, e);
    }
    return false;
  }

  function tryRenderer(page) {
    var names = {
      dashboard: ['renderDashboard'],
      students: ['renderStudents'],
      attendance: ['renderAttendance'],
      violations: ['renderViolations'],
      rewards: ['renderRewards'],
      learning: ['renderLearning'],
      statistics: ['renderStatistics'],
      'student-links': ['renderStudentLinks', 'renderStudentLinksPage'],
      ai: ['renderAI', 'renderAi', 'renderAITeacher'],
      'lucky-wheel': ['renderLuckyWheel'],
      settings: ['renderSettings']
    }[page] || [];

    for (var i = 0; i < names.length; i++) {
      try {
        if (typeof window[names[i]] === 'function') {
          window[names[i]]();
          return true;
        }
      } catch (e) {
        console.warn('[MENU UNIFIED ROUTER] renderer failed:', names[i], e);
      }
    }
    return false;
  }

  function navigate(page) {
    page = String(page || '').trim();
    if (!hasPage(page)) return false;

    if (tryCanonical(page)) return true;

    var domOk = setActiveDom(page);
    if (!domOk) return false;

    tryRenderer(page);
    return true;
  }

  function showModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return false;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    return true;
  }

  function quickAction(name) {
    name = String(name || '').trim();
    try {
      if (name === 'add-student') {
        if (typeof window.openAddStudentModal === 'function') return window.openAddStudentModal() !== false;
        return showModal('studentModal');
      }
      if (name === 'import-students') {
        if (typeof window.openImportStudents === 'function') return window.openImportStudents() !== false;
        return false;
      }
      if (name === 'attendance') return navigate('attendance');
      if (name === 'add-violation') {
        if (typeof window.prepareViolationModal === 'function') return window.prepareViolationModal() !== false;
        return showModal('violationModal');
      }
      if (name === 'add-reward') {
        if (typeof window.prepareRewardModal === 'function') return window.prepareRewardModal() !== false;
        return showModal('rewardModal');
      }
      if (name === 'statistics') return navigate('statistics');
      if (name === 'student-links') return navigate('student-links');
      if (name === 'learning' || name === 'add-learning' || name === 'progress' || name === 'add-progress') return navigate('learning');
      if (name === 'ai' || name === 'ai-teacher') return navigate('ai');
      if (name === 'settings') return navigate('settings');
      if (name === 'refresh' || name === 'refresh-data') {
        if (typeof window.refreshAll === 'function') {
          window.refreshAll();
          return true;
        }
        window.location.reload();
        return true;
      }
    } catch (e) {
      console.warn('[MENU UNIFIED ROUTER] quick action failed:', name, e);
    }
    return false;
  }

  function installHiddenOverlayShield() {
    try {
      var style = document.getElementById('lhUnifiedRouterShield');
      if (style) return;
      style = document.createElement('style');
      style.id = 'lhUnifiedRouterShield';
      style.textContent = [
        '.modal.hidden,.overlay.hidden,.modal.is-hidden,.overlay.is-hidden{display:none!important;pointer-events:none!important}',
        '[data-modal].hidden,[data-overlay].hidden{display:none!important;pointer-events:none!important}',
        '#sidebarOverlay[aria-hidden="true"]{pointer-events:none!important}'
      ].join('\n');
      document.head.appendChild(style);
    } catch (e) {}
  }

  function onClick(event) {
    var target = event.target && event.target.closest ? event.target : null;
    if (!target) return;

    var menu = target.closest('.menu-item[data-page]');
    if (menu) {
      var page = menu.getAttribute('data-page');
      if (hasPage(page)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        navigate(page);
        return;
      }
    }

    var pageLink = target.closest('[data-page-link]');
    if (pageLink) {
      var linkPage = pageLink.getAttribute('data-page-link');
      if (hasPage(linkPage)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        navigate(linkPage);
        return;
      }
    }

    var action = target.closest('[data-action]');
    if (action) {
      var name = action.getAttribute('data-action');
      var handled = ['add-student','import-students','attendance','add-violation','add-reward','statistics','student-links','learning','add-learning','progress','add-progress','ai','ai-teacher','settings','refresh','refresh-data'].indexOf(name) !== -1;
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        quickAction(name);
      }
    }
  }

  installHiddenOverlayShield();
  document.addEventListener('click', onClick, true);
  window.LHUnifiedMenu = {
    navigate: navigate,
    quickAction: quickAction,
    version: '20260916.1'
  };
})();
