/* LE HOANG — LEARNING + COMMENTS STABILITY BRIDGE
 * Chỉ khôi phục nút Học tập/Nhận xét; không chặn event của menu khác.
 */
(function(){
  'use strict';
  if(window.__LH_LEARNING_COMMENTS_REPAIR__) return;
  window.__LH_LEARNING_COMMENTS_REPAIR__=true;
  const loadOnce={};
  function load(src){
    if(loadOnce[src]) return loadOnce[src];
    loadOnce[src]=new Promise(resolve=>{
      const existing=document.querySelector('script[data-lh-repair="'+src+'"]');
      if(existing){ resolve(true); return; }
      const s=document.createElement('script');
      s.src=src; s.dataset.lhRepair=src; s.async=false;
      s.onload=()=>resolve(true); s.onerror=()=>resolve(false);
      document.head.appendChild(s);
    });
    return loadOnce[src];
  }
  async function ensureLearning(){
    if(typeof window.LH_LEARNING_PHASE1?.open==='function') return true;
    if(typeof window.renderLearning==='function') return true;
    return load('./learning-menu.js?v=STABLE-20260826').then(()=>true);
  }
  async function ensureComments(){
    if(typeof window.commentMenu?.open==='function') return true;
    return load('./learning-menu.js?v=STABLE-20260826').then(()=>true);
  }
  document.addEventListener('click',async e=>{
    const learning=e.target.closest('[data-action="add-learning"]');
    if(learning){
      e.preventDefault();
      await ensureLearning();
      if(typeof window.LH_LEARNING_PHASE1?.open==='function') window.LH_LEARNING_PHASE1.open();
      else if(typeof window.openLearningEditor==='function') window.openLearningEditor();
      return;
    }
    const comment=e.target.closest('[data-action="add-comment"]');
    if(comment){
      e.preventDefault();
      await ensureComments();
      if(typeof window.commentMenu?.open==='function') window.commentMenu.open();
      else if(typeof window.openCommentEditor==='function') window.openCommentEditor();
    }
  },false);
  window.LH_LEARNING_COMMENTS_REPAIR={ensureLearning,ensureComments};
})();
