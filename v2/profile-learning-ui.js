// V2 profile learning UI: enriches the aggregate student page with per-subject results.
const KEY='LH_V2_2026_2027';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readData=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
const canon=v=>String(v??'').replace(/\s+/g,' ').trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'');
const stage=v=>{const x=canon(v);if(x==='gk1'||x.includes('giuaky1')||x.includes('giuakyi'))return'GK1';if(x==='ck1'||x.includes('cuoiky1')||x.includes('cuoikyi'))return'CK1';if(x==='gk2'||x.includes('giuaky2')||x.includes('giuakyii'))return'GK2';if(x==='ck2'||x.includes('cuoinam')||x.includes('cuoiky2')||x.includes('cuoikyii'))return'CK2';return String(v||'')};
function install(){
  const data=readData(); if(!data||!Array.isArray(data.learning))return;
  const original=data.learning;
  const attach=()=>{
    const main=$('#mainContent'); if(!main||main.dataset.learningUi==='1')return;
    const title=main.querySelector('.page-head h1'); if(!title)return;
    const id=location.hash.match(/^#profile=([^&]+)/)?.[1]||'';
    // Prefer the currently rendered profile's action button when no hash ID exists.
    const profileBtn=main.querySelector('[data-action="edit-student"][data-student]');
    const studentId=id||profileBtn?.dataset.student||'';
    if(!studentId)return;
    const rows=original.filter(r=>r.studentId===studentId);
    if(!rows.length)return;
    const byStage={GK1:[],CK1:[],GK2:[],CK2:[]};
    rows.forEach(r=>(byStage[stage(r.stage)]||[]).push(r));
    const section=document.createElement('section');section.className='card';section.style.marginTop='14px';section.dataset.learningUi='1';
    section.innerHTML=`<div class="section-title"><div><h2>Kết quả học tập theo môn</h2><div class="muted">Dữ liệu hiển thị nguyên giá trị đã đọc từ file SMAS; không tự quy đổi.</div></div></div>`+
      `<div class="stage-grid">${[['GK1','Giữa kỳ I'],['CK1','Cuối kỳ I'],['GK2','Giữa kỳ II'],['CK2','Cuối năm / CK2']].map(([k,l])=>`<div class="stage"><strong>${k}</strong><small>${l}</small><div style="margin-top:8px">${byStage[k].length?`${byStage[k].length} kết quả`: 'Chưa có'}</div></div>`).join('')}</div>`+
      `<div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Môn/nhóm</th><th>GK1</th><th>CK1</th><th>GK2</th><th>CK2 / Cuối năm</th><th>Nguồn</th></tr></thead><tbody>${renderSubjects(byStage)}</tbody></table></div>`;
    const anchor=[...main.querySelectorAll('.section-title h2')].find(x=>x.textContent.includes('Học tập SMAS'))?.closest('.section-title');
    (anchor?.parentElement||main).prepend(section);
    main.dataset.learningUi='1';
  };
  const renderSubjects=byStage=>{
    const map=new Map();Object.entries(byStage).forEach(([k,arr])=>arr.forEach(r=>{const key=canon(r.subject);if(!map.has(key))map.set(key,{name:r.subject,vals:{},source:r.source||r.sourceFile||''});map.get(key).vals[k]=r.value}));
    return [...map.values()].map(x=>`<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.vals.GK1||'—')}</td><td>${esc(x.vals.CK1||'—')}</td><td>${esc(x.vals.GK2||'—')}</td><td>${esc(x.vals.CK2||'—')}</td><td>${esc(x.source)}</td></tr>`).join('')||`<tr><td colspan="6"><div class="empty">Chưa có kết quả theo môn.</div></td></tr>`;
  };
  const obs=new MutationObserver(()=>attach());obs.observe(document.body,{childList:true,subtree:true});setTimeout(attach,200);setTimeout(attach,1000);
}
window.addEventListener('load',install,{once:true});
