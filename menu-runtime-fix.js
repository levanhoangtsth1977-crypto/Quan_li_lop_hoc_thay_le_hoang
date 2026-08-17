/* ============================================================
   MENU RUNTIME FIX 5.0.0
   Quản lý lớp học Thầy Lê Hoàng
   - Không sửa data.js / không xóa LocalStorage
   - Bổ sung renderer thật cho Học tập / Nhận xét / Thống kê
   - Kích hoạt tìm kiếm, bộ lọc, dashboard period, profile, notification
   - Giữ nguyên Event Router MASTER; dùng delegated handlers an toàn
   ============================================================ */
(function () {
  "use strict";

  const q = s => document.querySelector(s);
  const qa = s => Array.from(document.querySelectorAll(s));
  const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const text = v => String(v ?? "").trim();

  function toast(msg, type="info") {
    if (typeof window.showToast === "function") window.showToast(msg,type);
    else console.info(msg);
  }
  function students() {
    try {
      if (typeof window.getStudentsSafe === "function") {
        const a = window.getStudentsSafe();
        if (Array.isArray(a)) return a.slice();
      }
    } catch(e) {}
    return Array.isArray(window.students) ? window.students.slice() : [];
  }
  function call(name,...args) {
    if (typeof window[name] !== "function") return false;
    try { return window[name](...args); }
    catch(e) { console.error("[MENU FIX]",name,e); toast("Chức năng gặp lỗi: "+name,"error"); return false; }
  }
  function go(page) {
    if (typeof window.navigateToPage === "function") return !!window.navigateToPage(page);
    return false;
  }

  function renderLearningPage() {
    const box=q("#learningOverview"); if(!box) return;
    const ss=students();
    let list=[];
    try { list=typeof window.getLearningRecords==="function"?window.getLearningRecords():[]; } catch(e){}
    if(!Array.isArray(list)) list=[];
    box.innerHTML = ss.length ? `
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>STT</th><th>Học sinh</th><th>Kết quả gần nhất</th><th>Môn</th><th>Ngày</th><th>Thao tác</th></tr></thead>
          <tbody>
          ${ss.map((s,i)=>{
            const rs=list.filter(r=>String(r.studentId)===String(s.id)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
            const r=rs[0];
            return `<tr><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(r?.result||"Chưa ghi nhận")}</td><td>${esc(r?.subject||"")}</td><td>${esc(r?.date||"")}</td><td><button type="button" class="button secondary" data-menu-action="learning-add" data-student-id="${esc(s.id)}">Ghi nhận</button></td></tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>` : `<div class="empty-state"><strong>Chưa có học sinh</strong><p>Hãy nhập danh sách học sinh trước.</p></div>`;
  }

  function renderCommentsPage() {
    const box=q("#commentsContainer"); if(!box) return;
    const ss=students();
    let list=[];
    try { list=typeof window.getCommentRecords==="function"?window.getCommentRecords():[]; } catch(e){}
    if(!Array.isArray(list)) list=[];
    box.innerHTML = ss.length ? `
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>STT</th><th>Học sinh</th><th>Nội dung nhận xét</th><th>Ngày</th><th>Thao tác</th></tr></thead>
          <tbody>
          ${ss.map((s,i)=>{
            const rs=list.filter(r=>String(r.studentId)===String(s.id)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
            const r=rs[0];
            return `<tr><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(r?.note||r?.comment||"Chưa có nhận xét")}</td><td>${esc(r?.date||"")}</td><td><button type="button" class="button secondary" data-menu-action="comment-add" data-student-id="${esc(s.id)}">Thêm nhận xét</button></td></tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>` : `<div class="empty-state"><strong>Chưa có học sinh</strong><p>Hãy nhập danh sách học sinh trước.</p></div>`;
  }

  function renderStatisticsPage() {
    const box=q("#statisticsGrid"); if(!box) return;
    const ss=students();
    let st={};
    try { st=typeof window.getClassStatistics==="function"?window.getClassStatistics()||{}:{}; } catch(e){}
    const total=Number(st.totalStudents ?? ss.length);
    const present=Number(st.present ?? 0);
    const vio=Number(st.totalViolations ?? 0);
    const rew=Number(st.totalRewards ?? 0);
    const learning=Number(st.totalLearning ?? 0);
    const progress=Number(st.totalProgress ?? 0);
    const comments=Number(st.totalComments ?? 0);
    box.innerHTML=`<div class="stats-grid">
      ${[["Học sinh",total,"fa-users"],["Có mặt hôm nay",present,"fa-user-check"],["Vi phạm",vio,"fa-triangle-exclamation"],["Khen thưởng",rew,"fa-trophy"],["Học tập",learning,"fa-book-open"],["Tiến bộ",progress,"fa-arrow-trend-up"],["Nhận xét",comments,"fa-comment-dots"]].map(x=>`<article class="stat-card"><div class="stat-card-top"><span class="stat-icon student"><i class="fa-solid ${x[2]}"></i></span></div><strong class="stat-number">${x[1]}</strong><span class="stat-label">${x[0]}</span></article>`).join("")}
    </div>`;
  }

  function renderCurrent(page) {
    if(page==="learning") renderLearningPage();
    if(page==="comments") renderCommentsPage();
    if(page==="statistics") renderStatisticsPage();
  }

  function openDataModal(title, fields, save) {
    const old=q("#menuRuntimeModal"); if(old) old.remove();
    const modal=document.createElement("div");
    modal.className="modal"; modal.id="menuRuntimeModal";
    modal.innerHTML=`<div class="modal-backdrop" data-runtime-close></div>
      <div class="modal-dialog"><div class="modal-header"><div><span class="modal-eyebrow"><i class="fa-solid fa-pen-to-square"></i> Quản lý lớp</span><h2>${esc(title)}</h2></div>
      <button type="button" class="icon-button" data-runtime-close aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button></div>
      <form id="runtimeDataForm"><div class="form-grid">${fields.join("")}</div>
      <div class="modal-footer"><button type="button" class="button secondary" data-runtime-close>Hủy</button><button type="submit" class="button primary"><i class="fa-solid fa-floppy-disk"></i> Lưu</button></div></form></div>`;
    document.body.appendChild(modal); modal.hidden=false; document.body.classList.add("modal-open");
    modal.querySelector("#runtimeDataForm").addEventListener("submit",e=>{e.preventDefault(); save(modal);});
    modal.addEventListener("click",e=>{if(e.target.closest("[data-runtime-close]")){modal.remove();document.body.classList.remove("modal-open");}});
  }

  function addLearning(studentId) {
    const s=students().find(x=>String(x.id)===String(studentId));
    if(!s) return toast("Không tìm thấy học sinh.","error");
    openDataModal("Ghi nhận kết quả học tập",[
      `<div class="form-group full"><label>Học sinh</label><input value="${esc(s.name)}" readonly></div>`,
      `<div class="form-group"><label>Môn học</label><input id="rtSubject" required></div>`,
      `<div class="form-group"><label>Ngày</label><input id="rtDate" type="date" value="${new Date().toISOString().slice(0,10)}" required></div>`,
      `<div class="form-group"><label>Kết quả</label><input id="rtResult" required></div>`,
      `<div class="form-group"><label>Mức độ</label><select id="rtLevel"><option value="Tốt">Tốt</option><option value="Đạt">Đạt</option><option value="Cần cố gắng">Cần cố gắng</option></select></div>`,
      `<div class="form-group full"><label>Ghi chú</label><textarea id="rtNote" rows="3"></textarea></div>`
    ],modal=>{
      const data={studentId,date:q("#rtDate").value,subject:q("#rtSubject").value,result:q("#rtResult").value,level:q("#rtLevel").value,note:q("#rtNote").value};
      const r=call("addLearningRecord",data);
      if(r===false){toast("Data Engine chưa cung cấp API addLearningRecord.","warning");return;}
      modal.remove(); document.body.classList.remove("modal-open"); renderLearningPage(); toast("Đã ghi nhận kết quả học tập.","success");
    });
  }

  function addComment(studentId) {
    const s=students().find(x=>String(x.id)===String(studentId));
    if(!s) return toast("Không tìm thấy học sinh.","error");
    openDataModal("Thêm nhận xét",[
      `<div class="form-group full"><label>Học sinh</label><input value="${esc(s.name)}" readonly></div>`,
      `<div class="form-group"><label>Ngày</label><input id="rtCDate" type="date" value="${new Date().toISOString().slice(0,10)}" required></div>`,
      `<div class="form-group"><label>Loại</label><input id="rtCType" placeholder="Môn học / năng lực / phẩm chất"></div>`,
      `<div class="form-group full"><label>Nội dung</label><textarea id="rtCNote" rows="5" required></textarea></div>`
    ],modal=>{
      const data={studentId,date:q("#rtCDate").value,type:q("#rtCType").value,note:q("#rtCNote").value};
      const r=call("addComment",data);
      if(r===false){toast("Data Engine chưa cung cấp API addComment.","warning");return;}
      modal.remove(); document.body.classList.remove("modal-open"); renderCommentsPage(); toast("Đã thêm nhận xét.","success");
    });
  }

  function showSimple(title,body){
    const old=q("#menuSimpleDialog"); if(old) old.remove();
    const d=document.createElement("div"); d.className="modal"; d.id="menuSimpleDialog";
    d.innerHTML=`<div class="modal-backdrop" data-simple-close></div><div class="modal-dialog"><div class="modal-header"><div><span class="modal-eyebrow"><i class="fa-solid fa-circle-info"></i> Hệ thống</span><h2>${esc(title)}</h2></div><button type="button" class="icon-button" data-simple-close><i class="fa-solid fa-xmark"></i></button></div><div style="padding:20px;line-height:1.7">${esc(body)}</div><div class="modal-footer"><button type="button" class="button primary" data-simple-close>Đóng</button></div></div>`;
    document.body.appendChild(d); d.hidden=false; document.body.classList.add("modal-open");
    d.addEventListener("click",e=>{if(e.target.closest("[data-simple-close]")){d.remove();document.body.classList.remove("modal-open");}});
  }

  function handleClick(e) {
    const b=e.target.closest("[data-menu-action]");
    if(b){
      e.preventDefault();
      if(b.dataset.menuAction==="learning-add") addLearning(b.dataset.studentId);
      if(b.dataset.menuAction==="comment-add") addComment(b.dataset.studentId);
      return;
    }
    const p=e.target.closest(".menu-item[data-page]");
    if(p){ setTimeout(()=>renderCurrent(p.dataset.page),60); return; }
    const pl=e.target.closest("[data-page-link]");
    if(pl){ setTimeout(()=>renderCurrent(pl.dataset.pageLink),60); return; }
    const id=e.target.closest("#refreshActivity,#notificationButton,#profileButton,#teacherMenuButton");
    if(id){
      e.preventDefault();
      if(id.id==="refreshActivity") { call("refreshAll"); toast("Đã làm mới dữ liệu.","success"); }
      else if(id.id==="notificationButton") showSimple("Thông báo","Hiện chưa có thông báo mới.");
      else showSimple("Thầy Lê Hoàng","Giáo viên chủ nhiệm • Lớp 5C • Năm học 2026–2027");
    }
  }

  function handleChange(e){
    const t=e.target;
    if(t.id==="dashboardPeriod"){ return; }
    if(t.id==="violationPeriodFilter"){ if(typeof window.renderViolations==="function") window.renderViolations(); return; }
    if(t.id==="schoolYearSelect" && q("#heroSchoolYear")) q("#heroSchoolYear").textContent=t.options[t.selectedIndex]?.text||t.value;
    if(t.id==="classSelect" && q("#heroClass")) q("#heroClass").textContent=t.options[t.selectedIndex]?.text||t.value;
  }

  function globalSearch(){
    const input=q("#globalSearch"); if(!input) return;
    const value=text(input.value); if(!value) return;
    go("students");
    const s=q("#studentSearch"); if(s){s.value=value;s.dispatchEvent(new Event("input",{bubbles:true}));}
  }

  function install(){
    if(window.__MENU_RUNTIME_FIX_500__) return;
    window.__MENU_RUNTIME_FIX_500__=true;
    document.addEventListener("click",handleClick,false);
    document.addEventListener("change",handleChange,false);
    q("#globalSearch")?.addEventListener("keydown",e=>{if(e.key==="Enter") globalSearch();});
    document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();q("#globalSearch")?.focus();}});
    setTimeout(()=>renderCurrent("learning"),100);
    setTimeout(()=>renderCurrent("comments"),120);
    setTimeout(()=>renderCurrent("statistics"),140);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
