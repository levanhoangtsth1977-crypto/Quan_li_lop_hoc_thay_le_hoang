/* ============================================================
   THỐNG KÊ — HỌC SINH XUẤT SẮC TOÀN DIỆN
   Module độc lập: không thay đổi CSDL.
   Tự lấy dữ liệu từ các nguồn trạng thái hiện có của ứng dụng.
   ============================================================ */
(function () {
  'use strict';
  const ID='thongKeXuatSacPanel';
  const BTN='btnXuatSacToanDien';

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}
  function arr(v){return Array.isArray(v)?v:[];}
  function first(obj, keys){
    for(const k of keys){ if(obj && obj[k]!=null) return obj[k]; }
    return '';
  }
  function getStudents(){
    const candidates=[window.students,window.hocSinh,window.HOC_SINH,window.studentList,window.roster,window.appState?.students,window.state?.students,window.APP_STATE?.students];
    for(const x of candidates) if(Array.isArray(x)&&x.length) return x;
    return [];
  }
  function getRecords(kind){
    const map={
      attendance:['attendance','attendances','diemDanh','DIEM_DANH'],
      violation:['violations','violationRecords','viPham','VI_PHAM'],
      reward:['rewards','rewardRecords','khenThuong','KHEN_THUONG'],
      learning:['learning','learningRecords','hocTap','HOC_TAP'],
      comment:['comments','commentRecords','nhanXet','NHAN_XET'],
      progress:['progress','progressRecords','tienBo','TIEN_BO']
    };
    const keys=map[kind]||[];
    const candidates=[];
    for(const k of keys){
      candidates.push(window[k],window.appState?.[k],window.state?.[k],window.APP_STATE?.[k]);
    }
    for(const x of candidates) if(Array.isArray(x)) return x;
    return [];
  }
  function sid(r){return String(first(r,['studentId','studentID','studentCode','idHocSinh','hocSinhId','id'])||'').trim();}
  function nameOf(s){return String(first(s,['name','studentName','hoTen','fullName','ten'])||'').trim();}
  function normalizeStudentId(s){return String(first(s,['id','studentId','studentCode','code'])||'').trim();}
  function scoreLearning(records,id){
    const rs=records.filter(r=>sid(r)===id);
    let vals=[];
    rs.forEach(r=>{['score','average','avg','diem','mark','result'].forEach(k=>{const n=Number(r?.[k]);if(Number.isFinite(n)&&n>=0&&n<=10)vals.push(n);});});
    if(!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0)/vals.length;
  }
  function count(records,id){return records.filter(r=>sid(r)===id).length;}
  function buildRows(){
    const students=getStudents();
    const A=getRecords('attendance'), V=getRecords('violation'), R=getRecords('reward'), L=getRecords('learning'), C=getRecords('comment'), P=getRecords('progress');
    return students.map((s,i)=>{
      const id=normalizeStudentId(s), v=count(V,id), rw=count(R,id), a=count(A,id), learning=scoreLearning(L,id);
      const abs=A.filter(r=>sid(r)===id && /vắng|absent/i.test(String(first(r,['status','trangThai','type','loai'])||''))).length;
      let academic=learning==null?50:Math.max(0,Math.min(100,learning*10));
      const commentCount=count(C,id), progressCount=count(P,id);
      // Trọng số: học tập 50%, năng lực/phẩm chất/tiến bộ 20%, chuyên cần 15%, khen thưởng 10%, vi phạm 5%.
      const learningPart=academic*0.50;
      const qualityPart=Math.min(100,50+commentCount*5+progressCount*5)*0.20;
      const attendancePart=Math.max(0,100-abs*10)*0.15;
      const rewardPart=Math.min(100,rw*20)*0.10;
      const violationPart=Math.max(0,100-v*15)*0.05;
      const total=learningPart+qualityPart+attendancePart+rewardPart+violationPart;
      return {i:i+1,id,name:nameOf(s),total,learning,abs,v,rw,commentCount,progressCount};
    }).filter(x=>x.name).sort((a,b)=>b.total-a.total||a.abs-b.abs||a.v-b.v||b.rw-a.rw);
  }
  function render(limit){
    const rows=buildRows().slice(0,limit);
    const panel=document.getElementById(ID); if(!panel)return;
    if(!rows.length){panel.innerHTML='<div class="empty-state"><strong>Chưa đủ dữ liệu để xếp hạng</strong><p>Hệ thống cần dữ liệu học sinh và các nhóm theo dõi hiện có.</p></div>';return;}
    panel.innerHTML=`<div class="section-heading" style="margin-top:18px"><div><h2>🏆 Học sinh xuất sắc toàn diện</h2><p>Ưu tiên học tập, năng lực/phẩm chất, chuyên cần; xét thêm khen thưởng và vi phạm.</p></div><label style="display:flex;align-items:center;gap:8px">Số lượng <select id="xuatSacLimit"><option>3</option><option selected>5</option><option>10</option><option>15</option><option>20</option></select></label></div><div class="table-container"><table class="data-table"><thead><tr><th>Hạng</th><th>Học sinh</th><th>Điểm tổng hợp</th><th>Học tập</th><th>Vắng</th><th>Vi phạm</th><th>Khen thưởng</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><strong>${i+1}</strong></td><td><strong>${esc(r.name)}</strong></td><td><strong>${r.total.toFixed(1)}/100</strong></td><td>${r.learning==null?'Chưa có':r.learning.toFixed(1)}</td><td>${r.abs}</td><td>${r.v}</td><td>${r.rw}</td></tr>`).join('')}</tbody></table></div>`;
    document.getElementById('xuatSacLimit')?.addEventListener('change',e=>render(Number(e.target.value)||5));
  }
  function mount(){
    const stats=document.getElementById('page-statistics'); if(!stats)return false;
    if(!document.getElementById(BTN)){
      const header=stats.querySelector('.page-header');
      if(header){
        const b=document.createElement('button');b.id=BTN;b.type='button';b.className='button primary';b.innerHTML='<i class="fa-solid fa-medal"></i> 🏆 HS xuất sắc toàn diện';
        b.addEventListener('click',()=>{const p=document.getElementById(ID);if(p){p.hidden=!p.hidden;if(!p.hidden)render(5);} });
        header.querySelector('.page-actions')?.appendChild(b) || header.appendChild(b);
      }
    }
    if(!document.getElementById(ID)){
      const p=document.createElement('section');p.id=ID; p.hidden=true; p.className='dashboard-panel';
      stats.appendChild(p);
    }
    return true;
  }
  function boot(){if(mount())return;setTimeout(boot,500);}
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  // Khi menu Thống kê được mở lại, đảm bảo nút luôn tồn tại.
  document.addEventListener('click',e=>{if(e.target.closest('[data-page="statistics"]'))setTimeout(mount,50);});
})();
