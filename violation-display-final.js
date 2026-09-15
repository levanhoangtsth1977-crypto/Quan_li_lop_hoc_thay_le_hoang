/* VI PHẠM DISPLAY FINAL 1.0
 * Hiển thị đúng toàn bộ bản ghi VI_PHAM đã đồng bộ từ Google Sheets.
 * Chuẩn hóa hoàn toàn tiếng Việt trên bảng Vi phạm.
 * Không tạo, sửa hoặc xóa dữ liệu Google Sheets.
 */
(function(){
  'use strict';
  if(window.__LH_VIOLATION_DISPLAY_FINAL_10__) return;
  window.__LH_VIOLATION_DISPLAY_FINAL_10__=true;

  const S=v=>String(v??'').trim();
  const esc=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm=v=>S(v).toLocaleLowerCase('vi');

  const TYPE_VI={
    'dangerous-play':'Chơi đùa, chạy nhảy ở khu vực nguy hiểm',
    'running-corridor':'Chạy nhảy, đùa nghịch ở hành lang',
    'late':'Đi học chưa đúng giờ',
    'late-school':'Đi học chưa đúng giờ',
    'no-homework':'Chưa hoàn thành bài tập',
    'homework':'Chưa hoàn thành bài tập',
    'disorder':'Làm mất trật tự trong giờ học',
    'talking':'Nói chuyện, làm việc riêng trong giờ học',
    'not-focus':'Không tập trung trong giờ học',
    'not-concentrate':'Không tập trung trong giờ học',
    'forget-books':'Quên sách, vở hoặc đồ dùng học tập',
    'forget-school-supplies':'Quên sách, vở hoặc đồ dùng học tập',
    'untidy':'Chưa giữ gìn vệ sinh cá nhân và lớp học',
    'cleanliness':'Chưa giữ gìn vệ sinh cá nhân và lớp học',
    'fight':'Xô xát, đánh nhau với bạn',
    'rude':'Có lời nói, thái độ chưa phù hợp với bạn',
    'disrespect':'Có lời nói, thái độ chưa phù hợp với thầy cô',
    'phone':'Sử dụng điện thoại hoặc thiết bị chưa đúng quy định',
    'cheating':'Thiếu trung thực trong học tập, kiểm tra',
    'property':'Làm hư hỏng hoặc sử dụng đồ dùng chưa đúng cách',
    'other':'Vi phạm khác'
  };
  const LEVEL_V={light:'Nhẹ',medium:'Trung bình',serious:'Nghiêm trọng',danger:'Nghiêm trọng'};
  const ACTION_V={
    '':'Chưa ghi',
    none:'Chưa xử lý',
    reminder:'Nhắc nhở',
    warn:'Nhắc nhở',
    warning:'Nhắc nhở',
    guidance:'Hướng dẫn khắc phục',
    parent:'Thông báo với cha mẹ học sinh',
    parents:'Thông báo với cha mẹ học sinh',
    monitor:'Theo dõi giáo dục',
    monitoring:'Theo dõi giáo dục'
  };

  function studentsMap(){
    const a=Array.isArray(window.students)?window.students:[];
    const m=new Map();
    a.forEach(s=>{const id=S(s?.id||s?.studentId);if(id)m.set(id,S(s?.name||s?.studentName||s?.fullName));});
    return m;
  }

  function records(){
    const a=Array.isArray(window.violationRecords)?window.violationRecords:[];
    const seen=new Set();
    return a.filter(r=>{
      const id=S(r?.id||r?.recordId);
      const k=id||JSON.stringify(r);
      if(seen.has(k)) return false;
      seen.add(k); return true;
    }).map((r,i)=>({...r,__index:i}));
  }

  function textType(v){const k=norm(v).replace(/\s+/g,'-');return TYPE_V[k]||S(v)||'Vi phạm khác';}
  function textLevel(v){const k=norm(v);return LEVEL_V[k]|| (k==='light'?'Nhẹ':S(v)||'Nhẹ');}
  function textAction(v,status){const k=norm(v);if(ACTION_V[k]) return ACTION_V[k];const s=norm(status);if(ACTION_V[s]) return ACTION_V[s];return S(v)||'Chưa ghi';}
  function dateText(v){const t=S(v);if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const [y,m,d]=t.split('-');return `${d}/${m}/${y}`;}if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(t))return t;return t||'—';}

  function findTable(){
    return document.querySelector('#page-violations #violationTable')||document.querySelector('#violationTable');
  }
  function findBody(){
    const table=findTable();
    return table?.querySelector('tbody')||document.querySelector('#page-violations tbody');
  }

  function render(){
    const body=findBody();
    if(!body) return false;
    const rows=records();
    const map=studentsMap();
    if(!rows.length){
      body.innerHTML='<tr><td colspan="6"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></span><strong>Chưa có dữ liệu vi phạm</strong><p>Chỉ các bản ghi thực tế mới xuất hiện tại đây.</p></div></td></tr>';
      const badge=document.getElementById('violationBadge'); if(badge) badge.textContent='0';
      return true;
    }

    body.innerHTML=rows.map((r,i)=>{
      const id=S(r?.id||r?.recordId);
      const sid=S(r?.studentId||r?.studentID||r?.student_id);
      const name=S(r?.studentName||r?.name||r?.fullName)||map.get(sid)||'Chưa xác định học sinh';
      const type=S(r?.type||r?.violationType||r?.content||r?.violation);
      const level=S(r?.level||r?.severity||'light');
      const action=S(r?.action||r?.handling||r?.solution);
      const status=S(r?.status||'');
      const date=S(r?.date||r?.violationDate||r?.createdDate||r?.createdAt);
      return `<tr>
        <td>${i+1}</td>
        <td>${esc(name)}</td>
        <td>${esc(dateText(date))}</td>
        <td>${esc(textType(type))}</td>
        <td>${esc(textAction(action,status))}${level?` <span class="lh-vio-level">(${esc(textLevel(level))})</span>`:''}</td>
        <td><button type="button" class="icon-button" title="Xóa bản ghi" aria-label="Xóa bản ghi" data-lh-delete-violation="${esc(id)}"><i class="fa-solid fa-trash"></i></button></td>
      </tr>`;
    }).join('');

    const badge=document.getElementById('violationBadge'); if(badge) badge.textContent=String(rows.length);
    const stat=document.getElementById('statViolations'); if(stat) stat.textContent=String(rows.length);
    return true;
  }

  function wireDelete(){
    document.addEventListener('click',e=>{
      const b=e.target?.closest?.('[data-lh-delete-violation]');
      if(!b) return;
      const id=S(b.getAttribute('data-lh-delete-violation'));
      if(!id) return;
      e.preventDefault(); e.stopPropagation();
      if(typeof window.deleteViolation==='function') window.deleteViolation(id);
    },true);
  }

  function boot(){
    wireDelete();
    render();
    window.addEventListener('google-sheets-data-ready',()=>setTimeout(render,0));
    window.addEventListener('lh-page-change',e=>{if(e?.detail?.page==='violations')setTimeout(render,0);});
    document.addEventListener('click',e=>{
      const b=e.target?.closest?.('[data-action="add-violation"],[data-page="violations"]');
      if(b) setTimeout(render,800);
    },true);
    const obs=new MutationObserver(()=>{if(document.getElementById('page-violations')?.classList.contains('active'))render();});
    const root=document.getElementById('page-violations');
    if(root) obs.observe(root,{childList:true,subtree:true});
    setInterval(()=>{if(document.getElementById('page-violations')?.classList.contains('active'))render();},2000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
