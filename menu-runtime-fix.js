/* ============================================================
   MENU RUNTIME FIX 5.1.0
   Mobile-first runtime safety layer
   ============================================================ */
(function () {
  "use strict";

  const q = s => document.querySelector(s);
  const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const text = v => String(v ?? "").trim();

  function toast(msg, type="info") {
    if (typeof window.showToast === "function") window.showToast(msg, type);
    else console.info(msg);
  }

  function students() {
    try {
      if (typeof window.getStudentsSafe === "function") {
        const value = window.getStudentsSafe();
        if (Array.isArray(value)) return value.slice();
      }
    } catch (_) {}
    return Array.isArray(window.students) ? window.students.slice() : [];
  }

  function loadDataEngine() {
    if (typeof window.getStudentsSafe === "function" || Array.isArray(window.students)) return Promise.resolve(true);
    return new Promise(resolve => {
      const existing = document.querySelector('script[data-runtime-data-engine="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once:true });
        existing.addEventListener("error", () => resolve(false), { once:true });
        return;
      }
      const script = document.createElement("script");
      script.src = "data.js";
      script.dataset.runtimeDataEngine = "true";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function renderPageSections(page) {
    const target = text(page);
    const sections = Array.from(document.querySelectorAll("[data-page-section]"));
    const section = sections.find(s => s.dataset.pageSection === target);
    if (!section) return false;
    sections.forEach(s => {
      const active = s.dataset.pageSection === target;
      s.classList.toggle("active", active);
      s.hidden = !active;
    });
    document.querySelectorAll(".menu-item[data-page]").forEach(b => b.classList.toggle("active", b.dataset.page === target));
    const title = document.getElementById("pageTitle");
    if (title) {
      const titles = {dashboard:"Trang chủ",students:"Học sinh",attendance:"Điểm danh",violations:"Vi phạm",rewards:"Khen thưởng",learning:"Học tập",comments:"Nhận xét",statistics:"Thống kê","student-links":"Link học sinh",materials:"Kho học liệu",ai:"AI giáo viên",settings:"Cài đặt"};
      title.textContent = titles[target] || target;
    }
    try { document.getElementById("mainContent")?.scrollTo({ top:0, behavior:"smooth" }); } catch (_) { document.getElementById("mainContent")?.scrollTo(0,0); }
    try { document.getElementById("sidebar")?.classList.remove("open"); document.getElementById("sidebarOverlay")?.classList.remove("active"); } catch (_) {}
    return true;
  }

  function go(page) {
    if (typeof window.navigateToPage === "function") {
      try { if (window.navigateToPage(page)) return true; } catch (_) {}
    }
    return renderPageSections(page);
  }

  function renderStudentsDirect() {
    const tbody = q("#studentTableBody");
    if (!tbody) return;
    const list = students().sort((a,b) => text(a.name).localeCompare(text(b.name), "vi"));
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-users"></i></span><strong>Chưa nhận được danh sách học sinh</strong><p>Đang chờ đồng bộ dữ liệu từ Google Sheets.</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = list.map((s,i) => `<tr><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.gender || "")}</td><td>${esc(s.birthDate || "")}</td><td>${esc(s.attendance ?? "")}</td><td>${text(s.status || "Đang học")}</td><td><button type="button" class="icon-button" data-student-action="view" data-student-id="${esc(s.id)}"><i class="fa-solid fa-eye"></i></button><button type="button" class="icon-button" data-student-action="edit" data-student-id="${esc(s.id)}"><i class="fa-solid fa-pen"></i></button></td></tr>`).join("");
  }

  function renderLearningPage() {
    const box=q("#learningOverview"); if(!box) return;
    const ss=students();
    let list=[]; try { list=typeof window.getLearningRecords === "function" ? window.getLearningRecords() : []; } catch (_) {}
    if(!Array.isArray(list)) list=[];
    box.innerHTML = ss.length ? `<div class="table-container"><table class="data-table"><thead><tr><th>STT</th><th>Học sinh</th><th>Kết quả gần nhất</th><th>Môn</th><th>Ngày</th></tr></thead><tbody>${ss.map((s,i)=>{const r=list.filter(x=>String(x.studentId)===String(s.id)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];return `<tr><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(r?.result||"Chưa ghi nhận")}</td><td>${esc(r?.subject||"")}</td><td>${esc(r?.date||"")}</td></tr>`;}).join("")}</tbody></table></div>` : '<div class="empty-state"><strong>Chưa có học sinh</strong><p>Đang chờ dữ liệu.</p></div>';
  }

  function renderCommentsPage() {
    const box=q("#commentsContainer"); if(!box) return;
    const ss=students();
    let list=[]; try { list=typeof window.getCommentRecords === "function" ? window.getCommentRecords() : []; } catch (_) {}
    if(!Array.isArray(list)) list=[];
    box.innerHTML = ss.length ? `<div class="table-container"><table class="data-table"><thead><tr><th>STT</th><th>Học sinh</th><th>Nhận xét</th><th>Ngày</th></tr></thead><tbody>${ss.map((s,i)=>{const r=list.filter(x=>String(x.studentId)===String(s.id)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];return `<tr><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(r?.note||r?.comment||"Chưa có nhận xét")}</td><td>${esc(r?.date||"")}</td></tr>`;}).join("")}</tbody></table></div>` : '<div class="empty-state"><strong>Chưa có học sinh</strong><p>Đang chờ dữ liệu.</p></div>';
  }

  function renderStatisticsPage() {
    const box=q("#statisticsGrid"); if(!box) return;
    let st={}; try { st=typeof window.getClassStatistics === "function" ? window.getClassStatistics() || {} : {}; } catch (_) {}
    const ss=students();
    const total=Number(st.totalStudents ?? ss.length);
    box.innerHTML=`<div class="stats-grid"><article class="stat-card"><strong class="stat-number">${total}</strong><span class="stat-label">Học sinh</span></article><article class="stat-card"><strong class="stat-number">${Number(st.present||0)}</strong><span class="stat-label">Có mặt hôm nay</span></article><article class="stat-card"><strong class="stat-number">${Number(st.totalViolations||0)}</strong><span class="stat-label">Vi phạm</span></article><article class="stat-card"><strong class="stat-number">${Number(st.totalRewards||0)}</strong><span class="stat-label">Khen thưởng</span></article></div>`;
  }

  function refreshVisible(page) {
    if (typeof window.refreshAll === "function") { try { window.refreshAll(); } catch (_) {} }
    if (page === "students") renderStudentsDirect();
    if (page === "learning") renderLearningPage();
    if (page === "comments") renderCommentsPage();
    if (page === "statistics") renderStatisticsPage();
  }

  function requestGoogleStudentSync() {
    if (typeof window.syncStudentsFromGoogle !== "function") return;
    window.syncStudentsFromGoogle().then(result => {
      refreshVisible("students");
      if (result?.count) toast(`Đã nhận ${result.count} học sinh từ Google Sheets.`, "success");
    }).catch(error => console.warn("[MENU FIX] Google student sync:", error));
  }

  function install() {
    if (window.__MENU_RUNTIME_FIX_510__) return;
    window.__MENU_RUNTIME_FIX_510__ = true;

    document.addEventListener("click", event => {
      const menu = event.target.closest(".menu-item[data-page]");
      if (menu) {
        event.preventDefault();
        const page = menu.dataset.page;
        go(page);
        setTimeout(() => refreshVisible(page), 30);
        return;
      }

      const link = event.target.closest("[data-page-link]");
      if (link) {
        event.preventDefault();
        const page = link.dataset.pageLink;
        go(page);
        setTimeout(() => refreshVisible(page), 30);
        return;
      }

      const toggle = event.target.closest("#sidebarToggle,#menuToggle");
      if (toggle) {
        event.preventDefault();
        q("#sidebar")?.classList.add("open");
        q("#sidebarOverlay")?.classList.add("active");
        return;
      }

      if (event.target.closest("#sidebarClose,#sidebarOverlay")) {
        event.preventDefault();
        q("#sidebar")?.classList.remove("open");
        q("#sidebarOverlay")?.classList.remove("active");
        return;
      }

      const refresh = event.target.closest("#refreshActivity");
      if (refresh) {
        event.preventDefault();
        refreshVisible(document.querySelector(".menu-item.active")?.dataset.page || "dashboard");
        toast("Đã làm mới dữ liệu.", "success");
      }
    }, false);

    document.addEventListener("change", event => {
      if (event.target.id === "schoolYearSelect" && q("#heroSchoolYear")) q("#heroSchoolYear").textContent = event.target.options[event.target.selectedIndex]?.text || event.target.value;
      if (event.target.id === "classSelect" && q("#heroClass")) q("#heroClass").textContent = event.target.options[event.target.selectedIndex]?.text || event.target.value;
    }, false);

    loadDataEngine().then(ok => {
      if (!ok) { toast("Không tải được Data Engine.", "error"); return; }
      try { if (typeof window.loadClassData === "function") window.loadClassData(); } catch (_) {}
      renderStudentsDirect();
      requestGoogleStudentSync();
    });

    setTimeout(() => requestGoogleStudentSync(), 1500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once:true });
  else install();
})();