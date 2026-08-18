/* ============================================================
   MENU RUNTIME + STUDENT RECOVERY 6.0.0
   Mobile-first runtime safety layer
   ------------------------------------------------------------
   Mục tiêu chính: KHÔNG BAO GIỜ để Google trả thiếu làm mất roster.
   Master Roster 42 HS là nguồn khôi phục chuẩn cho lớp 5C 2026-2027.
   ============================================================ */
(function () {
  "use strict";

  const MASTER_URL = "./DANH_SACH_HOC_SINH_5C_2026_2027.json?v=20260818-6";
  const EXPECTED = 42;
  const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec";
  const q = s => document.querySelector(s);
  const text = v => String(v ?? "").trim();
  const esc = v => text(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");

  function toast(msg, type="info") {
    try { if (typeof window.showToast === "function") window.showToast(msg, type); }
    catch (_) {}
    console.info("[STUDENT RECOVERY]", msg);
  }

  function getStudents() {
    try {
      if (typeof window.getStudentsSafe === "function") {
        const v = window.getStudentsSafe();
        if (Array.isArray(v)) return v.slice();
      }
    } catch (_) {}
    return Array.isArray(window.students) ? window.students.slice() : [];
  }

  function normalizeStudent(s, i) {
    const n = i + 1;
    return {
      id: text(s?.id) || `STU_5C_2026_${String(n).padStart(3,"0")}`,
      studentCode: text(s?.studentCode || s?.code) || `5C-2026-${String(n).padStart(3,"0")}`,
      name: text(s?.name || s?.studentName),
      gender: text(s?.gender),
      birthDate: text(s?.birthDate || s?.dateOfBirth),
      parentName: text(s?.parentName),
      phone: text(s?.phone),
      address: text(s?.address),
      status: text(s?.status) || "active",
      note: text(s?.note),
      createdAt: text(s?.createdAt) || "2026-08-18T00:00:00.000Z",
      updatedAt: text(s?.updatedAt) || "2026-08-18T00:00:00.000Z",
      shareEnabled: s?.shareEnabled !== false
    };
  }

  async function fetchMaster() {
    const r = await fetch(MASTER_URL, { cache:"no-store", credentials:"same-origin" });
    if (!r.ok) throw new Error(`Master HTTP ${r.status}`);
    const p = await r.json();
    const a = Array.isArray(p?.students) ? p.students : [];
    if (a.length !== EXPECTED) throw new Error(`Master Roster ${a.length}/${EXPECTED}`);
    return a.map(normalizeStudent);
  }

  function replaceLocal(list, source) {
    if (typeof window.replaceStudents !== "function") return false;
    const result = window.replaceStudents(list, {
      source,
      persist: true,
      allowEmpty: false,
      preserveRelatedRecords: true,
      expectedCount: EXPECTED
    });
    return !!result && result.success !== false && Number(result.count || list.length) === EXPECTED;
  }

  function renderStudents() {
    const tbody = q("#studentTableBody");
    if (!tbody) return;
    const list = getStudents();
    if (!list.length) return;
    tbody.innerHTML = list.map((s,i) => `<tr><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.gender)}</td><td>${esc(s.birthDate)}</td><td>${esc(s.attendance ?? "")}</td><td>${esc(s.status === "inactive" ? "Không còn học" : "Đang học")}</td><td><button type="button" class="icon-button" data-student-action="view" data-student-id="${esc(s.id)}"><i class="fa-solid fa-eye"></i></button><button type="button" class="icon-button" data-student-action="edit" data-student-id="${esc(s.id)}"><i class="fa-solid fa-pen"></i></button></td></tr>`).join("");
  }

  async function googleJsonp(action, params={}) {
    return new Promise((resolve,reject) => {
      const cb = `__lh_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const s = document.createElement("script");
      const qs = new URLSearchParams({ action, callback:cb, ...params });
      let done=false;
      const finish=(err,val)=>{ if(done)return; done=true; clearTimeout(timer); delete window[cb]; s.remove(); err?reject(err):resolve(val); };
      const timer=setTimeout(()=>finish(new Error("Google JSONP timeout")),12000);
      window[cb]=v=>finish(null,v);
      s.onerror=()=>finish(new Error("Google JSONP error"));
      s.src=`${GOOGLE_URL}?${qs.toString()}`;
      document.head.appendChild(s);
    });
  }

  async function googleImport(list) {
    const payload = list.map(normalizeStudent);
    await fetch(GOOGLE_URL, {
      method:"POST", mode:"no-cors", cache:"no-store", redirect:"follow", keepalive:true,
      headers:{"Content-Type":"text/plain;charset=UTF-8"},
      body:JSON.stringify({action:"importStudents", students:payload})
    });
    await new Promise(r=>setTimeout(r,1800));
    for(let i=0;i<6;i++) {
      try {
        const r=await googleJsonp("getStudents");
        const a=Array.isArray(r?.students)?r.students:[];
        if(a.length>=EXPECTED) return a;
      } catch (_) {}
      await new Promise(r=>setTimeout(r,1000));
    }
    throw new Error("Google Sheets chưa xác minh đủ 42 học sinh.");
  }

  async function recoverStudents() {
    if (window.__LH_STUDENT_RECOVERY_600__) return;
    window.__LH_STUDENT_RECOVERY_600__ = true;
    const status={startedAt:new Date().toISOString(),expected:EXPECTED};
    window.__LH_STUDENT_RECOVERY_STATUS__=status;

    try {
      let attempts=0;
      while(typeof window.replaceStudents !== "function" && attempts<120) {
        await new Promise(r=>setTimeout(r,100)); attempts++;
      }
      if(typeof window.replaceStudents !== "function") throw new Error("Data Engine chưa sẵn sàng.");

      const master=await fetchMaster();
      const local=getStudents();
      status.localBefore=local.length;

      /* Quy tắc tuyệt đối: nếu local thiếu 42, khôi phục Master trước. */
      if(local.length !== EXPECTED) {
        if(!replaceLocal(master,"MASTER_ROSTER_RECOVERY_600")) throw new Error("Không thể ghi 42 HS vào LocalStorage.");
        status.localRecovered=EXPECTED;
        renderStudents();
      } else {
        status.localRecovered=EXPECTED;
      }

      /* Google chỉ được bổ sung/khôi phục; payload thiếu không được ghi đè Local. */
      try {
        const remote=await googleJsonp("getStudents");
        const remoteList=Array.isArray(remote?.students)?remote.students:[];
        status.googleBefore=remoteList.length;
        if(remoteList.length<EXPECTED) {
          const verified=await googleImport(master);
          status.googleAfter=verified.length;
        } else {
          status.googleAfter=remoteList.length;
        }
      } catch(error) {
        status.googleRecoveryError=String(error?.message||error);
        /* Local Master 42 vẫn là dữ liệu hợp lệ; không xóa/ghi đè. */
        console.warn("[STUDENT RECOVERY] Google recovery:",error);
      }

      renderStudents();
      try { if(typeof window.refreshAll === "function") window.refreshAll(); } catch (_) {}
      status.localFinal=getStudents().length;
      status.ok=status.localFinal>=EXPECTED;
      status.finishedAt=new Date().toISOString();
      window.__LH_STUDENT_RECOVERY_STATUS__=status;
      if(status.ok) toast(`Đã khôi phục ${status.localFinal} học sinh cho thiết bị này.`,"success");
    } catch(error) {
      status.ok=false; status.error=String(error?.message||error); status.finishedAt=new Date().toISOString();
      window.__LH_STUDENT_RECOVERY_STATUS__=status;
      console.error("[STUDENT RECOVERY]",error);
    }
  }

  function renderPage(page) {
    const target=text(page); const sections=[...document.querySelectorAll("[data-page-section]")];
    const section=sections.find(s=>s.dataset.pageSection===target); if(!section)return false;
    sections.forEach(s=>{const on=s.dataset.pageSection===target;s.classList.toggle("active",on);s.hidden=!on;});
    document.querySelectorAll(".menu-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===target));
    const title=q("#pageTitle"); if(title){const t={dashboard:"Trang chủ",students:"Học sinh",attendance:"Điểm danh",violations:"Vi phạm",rewards:"Khen thưởng",learning:"Học tập",comments:"Nhận xét",statistics:"Thống kê","student-links":"Link học sinh",materials:"Kho học liệu",ai:"AI giáo viên",settings:"Cài đặt"};title.textContent=t[target]||target;}
    q("#sidebar")?.classList.remove("open"); q("#sidebarOverlay")?.classList.remove("active");
    if(target==="students")renderStudents(); return true;
  }

  function install() {
    if(window.__MENU_RUNTIME_FIX_600__)return;
    window.__MENU_RUNTIME_FIX_600__=true;
    document.addEventListener("click",e=>{
      const m=e.target.closest(".menu-item[data-page], [data-page-link]");
      if(m){e.preventDefault();renderPage(m.dataset.page||m.dataset.pageLink);return;}
      if(e.target.closest("#sidebarToggle,#menuToggle")){e.preventDefault();q("#sidebar")?.classList.add("open");q("#sidebarOverlay")?.classList.add("active");}
      if(e.target.closest("#sidebarClose,#sidebarOverlay")){e.preventDefault();q("#sidebar")?.classList.remove("open");q("#sidebarOverlay")?.classList.remove("active");}
    });
    recoverStudents();
    setTimeout(recoverStudents,3000);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
