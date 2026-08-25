/* QUẢN LÝ LỚP HỌC — SINGLE MENU ROUTER V3 */
(function(){
'use strict';
if(window.__LH_SINGLE_MENU_ROUTER_V3__)return;
window.__LH_SINGLE_MENU_ROUTER_V3__=true;
const labels={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên',materials:'Kho học liệu','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt'};
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
function clean(v){return String(v??'').trim().replace(/\s+/g,' ')}
function norm(v){return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d')}
function closeMobile(){if(window.innerWidth>900)return;document.getElementById('sidebar')?.classList.remove('open');document.getElementById('sidebarOverlay')?.classList.remove('active');}
function isUtilitiesLink(el){if(!el)return false;const href=clean(el.getAttribute?.('href')).toLowerCase();const text=clean(el.textContent).toLowerCase();return href.includes('tien-ich.html')||norm(text)==='tien ich'||norm(text).includes('tien ich')}
function purgeLegacyUtilities(){
 document.querySelectorAll('#page-utilities-final,[data-page-section="utilities"],#lhUtilitiesFinal,#lhUtilitiesMenu,#lhUtilitiesDynamic,.lh-utilities-divider').forEach(el=>el.remove());
 document.querySelectorAll('.main-menu [data-page="utilities"]').forEach(el=>el.remove());
 const nav=document.querySelector('.main-menu');if(!nav)return;
 const items=[...nav.querySelectorAll('a,button')].filter(isUtilitiesLink);
 let keeper=items.find(x=>x.id==='lhUtilitiesStandalone')||items.find(x=>x.tagName==='A'&&clean(x.getAttribute('href')).toLowerCase().includes('tien-ich.html'))||items[0];
 if(keeper){keeper.id='lhUtilitiesStandalone';keeper.setAttribute('href','tien-ich.html');keeper.className='menu-item';keeper.innerHTML='<i class="fa-solid fa-toolbox"></i><span>Tiện ích</span>';}
 items.forEach(x=>{if(x!==keeper)x.remove()});
}
function setActive(page){document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(b=>b.classList.toggle('active',b.getAttribute('data-page')===page));const t=document.getElementById('pageTitle');if(t)t.textContent=labels[page]||page;closeMobile();}
function show(page){purgeLegacyUtilities();const target=document.querySelector('[data-page-section="'+page+'"]');if(!target)return false;document.querySelectorAll('[data-page-section]').forEach(el=>{el.hidden=true;el.classList.remove('active')});target.hidden=false;target.classList.add('active');setActive(page);if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));if(page==='rewards')setTimeout(bindRewardDeleteUI,0);return true;}
function ensureUtilitiesLink(){const nav=document.querySelector('.main-menu');if(!nav)return;purgeLegacyUtilities();let link=nav.querySelector('#lhUtilitiesStandalone');if(!link){link=document.createElement('a');link.href='tien-ich.html';link.className='menu-item';link.id='lhUtilitiesStandalone';link.innerHTML='<i class="fa-solid fa-toolbox"></i><span>Tiện ích</span>';const settings=nav.querySelector('[data-page="settings"]');if(settings)nav.insertBefore(link,settings);else nav.appendChild(link)}purgeLegacyUtilities();link.addEventListener('click',()=>closeMobile(),{capture:true});}

function rewardStudentName(r){
 const sid=clean(r?.studentId);const list=typeof window.getStudentsSafe==='function'?window.getStudentsSafe():(Array.isArray(window.students)?window.students:[]);
 const s=list.find(x=>clean(x?.id)===sid||clean(x?.studentCode||x?.code)===sid);
 return clean(s?.name)||clean(r?.studentName||r?.name);
}
function rewardDate(v){const s=clean(v);if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const p=s.split('-');return p[2]+'/'+p[1]+'/'+p[0]}return s}
function remoteDate(v){const s=clean(v);if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){const p=s.split('/');return p[2]+'-'+p[1]+'-'+p[0]}return s}
function formText(v){return ({praise:'Tuyên dương',certificate:'Giấy khen',reward:'Phần thưởng',other:'Khác'})[clean(v)]||clean(v)}
function jsonp(action,params){return new Promise((resolve,reject)=>{const cb='LHUI_'+Date.now()+'_'+Math.random().toString(36).slice(2);const s=document.createElement('script');let done=false;const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}s.remove();err?reject(err):resolve(data)};const timer=setTimeout(()=>finish(Error('Google Apps Script không phản hồi')),20000);window[cb]=d=>finish(null,d);s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));const q=Object.assign({action,callback:cb,_:Date.now()},params||{});s.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');document.head.appendChild(s)})}
function rewardEquivalent(local,remote){
 const studentName=rewardStudentName(local);const remoteName=clean(remote.studentName||remote.name);
 const sameStudent=(clean(local.studentId)&&clean(remote.studentId)&&clean(local.studentId)===clean(remote.studentId))||(studentName&&remoteName&&norm(studentName)===norm(remoteName));
 const sameDate=remoteDate(local.date)===remoteDate(remote.date||remote.ngay||remote.Date);
 const sameType=clean(local.type)===clean(remote.type);
 const sameForm=clean(local.formType)===clean(remote.formType)||formText(local.formType)===clean(remote.formType);
 const sameNote=!clean(local.note)||clean(local.note)===clean(remote.note);
 return sameStudent&&sameDate&&sameType&&sameForm&&sameNote;
}
async function robustDeleteReward(localId){
 const localList=Array.isArray(window.rewardRecords)?window.rewardRecords:[];const local=localList.find(r=>clean(r?.id)===clean(localId));
 const data=await jsonp('get_events');if(!data||data.ok!==true)throw Error('Không đọc được dữ liệu Khen thưởng từ Google Sheets.');
 const remote=Array.isArray(data.KHEN_THUONG)?data.KHEN_THUONG:[];
 let target=remote.find(r=>clean(r?.id)===clean(localId));
 if(!target&&local)target=remote.find(r=>rewardEquivalent(local,r));
 if(!target)throw Error('Không tìm thấy lượt tương ứng trên Google Sheets để xóa.');
 const result=await jsonp('delete_event',{sheet:'KHEN_THUONG',id:clean(target.id),recordId:clean(target.id)});
 if(!result||result.ok!==true||result.deleted!==true)throw Error(result?.error||'Google Sheets không xác nhận xóa.');
 return clean(target.id);
}
function sameRow(r,row){const c=row.querySelectorAll('td');if(c.length<2)return false;return (!clean(c[0].textContent)||clean(c[0].textContent)===rewardDate(r.date))&&(!clean(c[1].textContent)||clean(c[1].textContent)===rewardStudentName(r))&&(!clean(c[2]?.textContent)||clean(c[2].textContent)===clean(r.type))&&(!clean(c[3]?.textContent)||clean(c[3].textContent)===formText(r.formType))}
function rewardRows(){return Array.from(document.querySelectorAll('#rewardTableBody tr,#page-rewards table tbody tr'))}
function styleRewardButtons(){if(document.getElementById('lhRewardDeleteStyle'))return;const s=document.createElement('style');s.id='lhRewardDeleteStyle';s.textContent='.lh-reward-actions{text-align:center;white-space:nowrap}.lh-reward-delete{border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700}.lh-reward-delete:disabled{opacity:.55;cursor:wait}';document.head.appendChild(s)}
async function exactDelete(id){try{return await robustDeleteReward(id)}catch(first){if(typeof window.deleteReward==='function'){const result=await window.deleteReward(id);if(result!==false)return true}throw first}}
function bindRewardDeleteUI(){styleRewardButtons();const sec=document.getElementById('page-rewards');if(!sec||sec.hidden)return;const records=Array.isArray(window.rewardRecords)?window.rewardRecords:[];const rows=rewardRows();rows.forEach((row,idx)=>{let cell=row.querySelector('.lh-reward-actions');if(!cell){cell=document.createElement('td');cell.className='lh-reward-actions';row.appendChild(cell)}cell.innerHTML='';let recId=clean(row.getAttribute('data-reward-id'));let rec=recId?records.find(r=>clean(r?.id)===recId):null;if(!rec)rec=records.find(r=>sameRow(r,row))||records[idx]||null;if(!rec?.id)return;row.setAttribute('data-reward-id',rec.id);const b=document.createElement('button');b.type='button';b.className='lh-reward-delete';b.textContent='Xóa';b.dataset.rewardId=rec.id;b.onclick=async e=>{e.preventDefault();e.stopPropagation();if(b.disabled)return;if(!confirm('Xóa đúng lượt khen thưởng này?'))return;b.disabled=true;b.textContent='Đang xóa…';try{await exactDelete(rec.id);if(typeof window.pullGoogleSheetEvents==='function')await window.pullGoogleSheetEvents();if(typeof window.renderRewards==='function' )window.renderRewards();setTimeout(bindRewardDeleteUI,300)}catch(err){b.disabled=false;b.textContent='Xóa';alert(err?.message||'Không thể xóa lượt khen thưởng.')}};cell.appendChild(b)});const all=Array.from(sec.querySelectorAll('button')).filter(b=>/xóa tất cả/i.test(clean(b.textContent)));all.forEach(btn=>{if(btn.__LH_REWARD_ALL_V3__)return;btn.__LH_REWARD_ALL_V3__=true;btn.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const rs=Array.isArray(window.rewardRecords)?window.rewardRecords.slice():[];if(!rs.length){alert('Không có dữ liệu khen thưởng để xóa.');return}if(!confirm(`Xóa toàn bộ ${rs.length} lượt khen thưởng?`))return;btn.disabled=true;const old=btn.textContent;btn.textContent='Đang xóa…';try{for(const r of rs){if(r?.id)await exactDelete(r.id)}if(typeof window.pullGoogleSheetEvents==='function')await window.pullGoogleSheetEvents();if(typeof window.renderRewards==='function')window.renderRewards();setTimeout(bindRewardDeleteUI,300)}catch(err){alert(err?.message||'Không thể xóa toàn bộ khen thưởng.')}finally{btn.disabled=false;btn.textContent=old}},true)})}
function hookRewards(){if(window.__LH_REWARD_UI_HOOK_V3__)return;window.__LH_REWARD_UI_HOOK_V3__=true;const old=window.renderRewards;if(typeof old==='function'){window.renderRewards=function(){const r=old.apply(this,arguments);setTimeout(bindRewardDeleteUI,0);return r}}setTimeout(bindRewardDeleteUI,0)}
function bind(){purgeLegacyUtilities();ensureUtilitiesLink();hookRewards();const menu=document.querySelector('.main-menu');if(menu&&!menu.__LH_SINGLE_BOUND_V3__){menu.__LH_SINGLE_BOUND_V3__=true;menu.addEventListener('click',function(e){const link=e.target.closest('#lhUtilitiesStandalone');if(link)return;const btn=e.target.closest('.menu-item[data-page]');if(!btn)return;const page=btn.getAttribute('data-page');if(show(page)){e.preventDefault();e.stopImmediatePropagation()}},true);menu.addEventListener('touchend',function(e){const link=e.target.closest('#lhUtilitiesStandalone');if(link)return;const btn=e.target.closest('.menu-item[data-page]');if(!btn)return;const page=btn.getAttribute('data-page');if(show(page)){e.preventDefault();e.stopImmediatePropagation()}},{capture:true,passive:false})}const toggle=document.getElementById('sidebarToggle');if(toggle&&!toggle.__LH_SINGLE_BOUND_V3__){toggle.__LH_SINGLE_BOUND_V3__=true;toggle.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');if(!s)return;const open=!s.classList.contains('open');s.classList.toggle('open',open);if(o)o.classList.toggle('active',open)},true)}const close=document.getElementById('sidebarClose');if(close&&!close.__LH_SINGLE_BOUND_V3__){close.__LH_SINGLE_BOUND_V3__=true;close.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();closeMobile()},true)}const overlay=document.getElementById('sidebarOverlay');if(overlay&&!overlay.__LH_SINGLE_BOUND_V3__){overlay.__LH_SINGLE_BOUND_V3__=true;overlay.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();closeMobile()},true)}if(!window.__LH_UTILITIES_OBSERVER__){window.__LH_UTILITIES_OBSERVER__=true;const nav=document.querySelector('.main-menu');if(nav){const mo=new MutationObserver(()=>{purgeLegacyUtilities()});mo.observe(nav,{childList:true,subtree:true});}}
}
function boot(){bind();setTimeout(bind,300);setTimeout(bind,1000);setTimeout(bind,1800);setTimeout(bind,3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();