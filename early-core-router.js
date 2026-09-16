/* EARLY CORE ROUTER 1.0
 * Runs before the main application script.
 * It is deliberately tiny: navigation + modal opening only.
 * When the canonical router is ready, this layer gets out of the way.
 */
(function(){
  'use strict';
  if(window.__LH_EARLY_CORE_ROUTER__) return;
  window.__LH_EARLY_CORE_ROUTER__ = true;

  var labels = {
    dashboard:'Trang chủ', students:'Học sinh', attendance:'Điểm danh',
    violations:'Vi phạm', rewards:'Khen thưởng', learning:'Học tập',
    statistics:'Thống kê', 'student-links':'Link học sinh', ai:'AI giáo viên',
    'lucky-wheel':'Vòng quay may mắn', settings:'Cài đặt'
  };

  function canonicalReady(){
    try { return !!(window.UI && UI.eventsBound === true && typeof window.navigateToPage === 'function'); }
    catch(e){ return false; }
  }

  function page(value){
    value=String(value||'').trim();
    if(!value) return false;
    if(canonicalReady()) return !!window.navigateToPage(value);
    var section=document.querySelector('[data-page-section="'+value.replace(/"/g,'\\"')+'"]');
    if(!section) return false;
    document.querySelectorAll('[data-page-section]').forEach(function(el){
      var active=el===section;
      el.classList.toggle('active',active);
      if(active) el.removeAttribute('hidden'); else el.setAttribute('hidden','');
    });
    document.querySelectorAll('.menu-item[data-page]').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-page')===value);
    });
    var title=document.getElementById('pageTitle');
    if(title) title.textContent=labels[value]||value;
    return true;
  }

  function modal(id){
    var el=document.getElementById(id);
    if(!el) return false;
    el.hidden=false;
    el.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    return true;
  }

  function action(name){
    try{
      if(canonicalReady()) return true;
      switch(String(name||'')){
        case 'add-student': return modal('studentModal');
        case 'attendance': return page('attendance');
        case 'add-violation': return modal('violationModal');
        case 'add-reward': return modal('rewardModal');
        case 'statistics': return page('statistics');
        case 'student-links': return page('student-links');
        case 'learning': case 'add-learning': return page('learning');
        case 'ai': case 'ai-teacher': return page('ai');
        case 'settings': return page('settings');
        case 'refresh': case 'refresh-data': location.reload(); return true;
      }
    }catch(e){ console.warn('[EARLY CORE ROUTER]',e); }
    return false;
  }

  function onClick(ev){
    if(canonicalReady()) return;
    var t=ev.target && ev.target.closest ? ev.target : null;
    if(!t) return;
    var m=t.closest('.menu-item[data-page]');
    if(m){ if(page(m.getAttribute('data-page'))) ev.preventDefault(); return; }
    var p=t.closest('[data-page-link]');
    if(p){ if(page(p.getAttribute('data-page-link'))) ev.preventDefault(); return; }
    var a=t.closest('[data-action]');
    if(a){
      var n=a.getAttribute('data-action');
      if(action(n)) ev.preventDefault();
    }
  }

  document.addEventListener('click', onClick, true);
})();
