/* DATA SYNC VIETNAMESE FIX — SAFE COMPATIBILITY LAYER
 * Deliberately does not mutate student data or schema.
 * The current Google bridge is authoritative for Google synchronization.
 */
(function(){
'use strict';
if(window.__LH_DATA_SYNC_VIETNAMESE_FIX__)return;
window.__LH_DATA_SYNC_VIETNAMESE_FIX__=true;

function removeDuplicateAICards(){
  try{
    const page=document.getElementById('page-ai');
    if(!page)return;
    page.querySelectorAll('.ui-complete-page').forEach(el=>el.remove());
  }catch(e){console.warn('[AI DEDUPE]',e)}
}

function addExternalAIButtons(){
  try{
    const page=document.getElementById('page-ai');
    if(!page || page.querySelector('#lhExternalAI')) return;
    const grid=page.querySelector('.ai-grid');
    if(!grid) return;

    const wrap=document.createElement('div');
    wrap.id='lhExternalAI';
    wrap.className='ai-external-tools';
    wrap.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:18px';

    const gemini=document.createElement('a');
    gemini.className='ai-card ai-external-card';
    gemini.href='https://gemini.google.com/';
    gemini.target='_blank';
    gemini.rel='noopener noreferrer';
    gemini.innerHTML='<span class="ai-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span><strong>Gemini</strong><span>Mở Gemini để hỗ trợ soạn bài, ý tưởng và phân tích.</span>';

    const chatgpt=document.createElement('a');
    chatgpt.className='ai-card ai-external-card';
    chatgpt.href='https://chatgpt.com/';
    chatgpt.target='_blank';
    chatgpt.rel='noopener noreferrer';
    chatgpt.innerHTML='<span class="ai-icon"><i class="fa-solid fa-comments"></i></span><strong>ChatGPT</strong><span>Mở ChatGPT để hỗ trợ nội dung, phân tích và công việc giáo viên.</span>';

    wrap.append(gemini,chatgpt);
    grid.insertAdjacentElement('afterend',wrap);
  }catch(e){console.warn('[AI LINKS]',e)}
}

window.addEventListener('DOMContentLoaded',function(){
  removeDuplicateAICards();
  addExternalAIButtons();
  const page=document.getElementById('page-ai');
  if(page&&!window.__LH_AI_DEDUPE_OBSERVER__){
    const observer=new MutationObserver(function(){
      page.querySelectorAll('.ui-complete-page').forEach(el=>el.remove());
      addExternalAIButtons();
    });
    observer.observe(page,{childList:true,subtree:true});
    window.__LH_AI_DEDUPE_OBSERVER__=observer;
  }
},{once:true});

window.addEventListener('google-sheets-data-ready',function(){
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.renderStudents==='function')window.renderStudents()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
  removeDuplicateAICards();
  addExternalAIButtons();
});

window.LH_AIDedupe={removeDuplicateAICards,addExternalAIButtons};
})();
