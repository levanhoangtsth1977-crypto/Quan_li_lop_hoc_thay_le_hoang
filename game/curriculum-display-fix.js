/* ============================================================
   TRIỆU PHÚ HỌC ĐƯỜNG — CURRICULUM DISPLAY FINAL 1.0
   - Môn -> Chủ đề/Chương độc lập, không trộn môn.
   - Hiển thị đủ danh mục chuẩn của Toán/Tiếng Việt/Khoa học.
   - Lịch sử & Địa lí lấy toàn bộ Cxx thực tế từ BO_CAU_HOI.
   - Không hiển thị số lượng trong ngoặc.
   - Pool chơi: tối đa 100 câu thực tế cho từng Môn|Cxx.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_CURRICULUM_DISPLAY_FINAL_10__)return;
window.__LH_CURRICULUM_DISPLAY_FINAL_10__=true;
const clean=v=>String(v==null?'':v).replace(/\s*\([^)]*\)\s*$/,'').trim().replace(/\s+/g,' ');
const sub=v=>{const s=String(v||'').toLowerCase();if(s==='math'||s==='toan')return'math';if(s==='vietnamese'||s==='tv')return'vietnamese';if(s==='science'||s==='kh')return'science';if(s==='history'||s==='ls-dl'||s==='lSDL')return'history';return s};
const code=q=>String(q&&q.topicCode||'').toUpperCase().match(/^C\d+$/)?String(q.topicCode).toUpperCase():'';
function actual(){return (Array.isArray(window.LH_ALL_GAME_QUESTIONS)?window.LH_ALL_GAME_QUESTIONS:[]).filter(q=>String(q.status||'').toUpperCase()!=='CATALOG_ONLY'&&q.question&&Array.isArray(q.options)&&q.options.length===4)}
function buildPool(){const src=actual(),groups={};src.forEach(q=>{const k=sub(q.subject)+'|'+code(q);if(!k.endsWith('|'))(groups[k]||(groups[k]=[])).push(q)});const out=[];Object.keys(groups).sort().forEach(k=>{const a=groups[k].slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}a.slice(0,100).forEach(q=>out.push(q))});window.GAME_QUESTIONS=out;return out}
function historyCatalog(src){const map={};src.filter(q=>sub(q.subject)==='history').forEach(q=>{const c=code(q);if(!c)return;const n=clean(q.chapter||q.Chuong||q.topic||('Chủ đề '+Number(c.slice(1))));if(!map[c]||n.length>map[c].length)map[c]=n});return Object.keys(map).sort((a,b)=>Number(a.slice(1))-Number(b.slice(1))).map(c=>[c,map[c]])}
function render(){const s=document.getElementById('subject'),c=document.getElementById('chapter'),m=document.getElementById('gameMode');if(!s||!c)return;if(m&&m.value==='mixed'){c.disabled=true;c.innerHTML='<option value="">🌐 Tổng hợp 4 môn</option>';return}const sk=sub(s.value),src=actual();let list=[];const cat=window.LH_CURRICULUM&&Array.isArray(window.LH_CURRICULUM[sk])?window.LH_CURRICULUM[sk]:null;if(cat&&cat.length)list=cat.map(x=>[x[0],clean(x[1])]);else list=historyCatalog(src);if(!list.length){c.disabled=true;c.innerHTML='<option value="">⚠️ Môn này chưa có chủ đề</option>';return}const old=c.value;c.innerHTML='';const first=document.createElement('option');first.value='';first.textContent='📚 Chọn chủ đề / chương';c.appendChild(first);list.forEach(([tc,name])=>{const o=document.createElement('option');o.value=name;o.textContent='📘 '+name;o.dataset.topicCode=tc;o.dataset.subject=sk;c.appendChild(o)});c.disabled=false;if(old&&Array.from(c.options).some(o=>o.value===old))c.value=old}
function boot(){buildPool();render();const s=document.getElementById('subject'),m=document.getElementById('gameMode');if(s&&!s.dataset.lhCurrFix){s.dataset.lhCurrFix='1';s.addEventListener('change',()=>{buildPool();render()})}if(m&&!m.dataset.lhCurrFix){m.dataset.lhCurrFix='1';m.addEventListener('change',render)}}
window.addEventListener('questionBankReady',()=>setTimeout(boot,80));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250),{once:true});else setTimeout(boot,250);
})();
