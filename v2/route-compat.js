/* V2 route compatibility: one Student ID context across module navigation. */
(() => {
  const KEY = "LH_V2_SELECTED_STUDENT";
  const DATA_KEY = "LH_V2_2026_2027";
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const canon = v => String(v ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "");
  const setSelected = id => { if (id) sessionStorage.setItem(KEY, id); };
  const getSelected = () => sessionStorage.getItem(KEY) || "";
  const clearSelected = () => sessionStorage.removeItem(KEY);
  const readData = () => { try { return JSON.parse(localStorage.getItem(DATA_KEY) || "null"); } catch { return null; } };
  const getStudent = id => readData()?.students?.find(s => s.id === id) || null;

  function markMatchingTableRows(student) {
    if (!student?.name) return;
    const wanted = canon(student.name);
    qsa("#mainContent tbody tr").forEach(row => {
      row.classList.remove("v2-selected-student");
      const text = canon(row.cells?.[1]?.textContent || "");
      if (text === wanted || text.includes(wanted)) {
        row.classList.add("v2-selected-student");
        row.dataset.studentRow = student.id;
      }
    });
  }

  function normalizeImportActions() {
    qsa('[data-action="import-students"]').forEach(btn => {
      btn.dataset.action = "import-roster";
      btn.setAttribute("data-v2-import-roster", "1");
    });
  }

  function flashStudentContext() {
    const id = getSelected();
    normalizeImportActions();
    if (!id) return;
    const s = getStudent(id);
    qsa(`[data-student-row="${CSS.escape(id)}"]`).forEach(row => {
      row.classList.add("v2-selected-student");
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    qsa('select[name="studentId"]').forEach(sel => {
      if ([...sel.options].some(o => o.value === id)) {
        sel.value = id;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    qsa('input[name="studentId"]').forEach(input => { if (!input.value) input.value = id; });
    qsa(`[data-student="${CSS.escape(id)}"]`).forEach(el => el.setAttribute("aria-current", "true"));
    if (!s) return;
    markMatchingTableRows(s);
    const route = qs("#pageTitle")?.textContent?.trim() || "";
    const supported = ["Vi phạm", "Khen thưởng", "Tiến bộ", "Nhận xét", "Điểm danh", "Link học sinh"];
    if (!supported.includes(route)) return;
    const main = qs("#mainContent");
    if (!main || main.querySelector(".v2-student-context")) return;
    const bar = document.createElement("div");
    bar.className = "notice v2-student-context";
    bar.style.cssText = "margin:0 0 12px;display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap";
    bar.innerHTML = `👤 <strong>Đang làm việc với:</strong> ${esc(s.name)} <button type="button" class="mini-btn" data-v2-open-profile="${esc(id)}">Mở trang tổng hợp</button>`;
    const content = main.querySelector(".content");
    if (content) content.insertBefore(bar, content.firstChild);
  }

  function chooseRosterImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    input.style.display = "none";
    document.body.appendChild(input);
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return;
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        const norm = v => String(v ?? "").replace(/\s+/g, " ").trim();
        const parseCsv = text => {
          const out=[]; let row=[], cur="", quoted=false;
          for(let i=0;i<text.length;i++){
            const c=text[i];
            if(c==='\"'){if(quoted&&text[i+1]==='\"'){cur+='\"';i++;}else quoted=!quoted;}
            else if(c===","&&!quoted){row.push(cur);cur="";}
            else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cur);if(row.some(x=>norm(x)!==""))out.push(row);row=[];cur="";}
            else cur+=c;
          }
          if(cur!==""||row.length){row.push(cur);if(row.some(x=>norm(x)!==""))out.push(row);}
          return out;
        };
        let rows=[];
        if(ext==='csv') rows=parseCsv(await file.text());
        else if(window.XLSX){const wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false});for(const sheet of wb.SheetNames)rows.push(...XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:'',raw:false}));}
        else throw new Error('Thư viện XLSX chưa sẵn sàng.');
        let h=-1,best=0;
        rows.slice(0,30).forEach((r,i)=>{const t=canon((r||[]).join(' | '));const s=['hovaten','hoten','hocsinh','mahocsinh','mahs','studentid','ngaysinh','gioitinh'].reduce((n,k)=>n+(t.includes(k)?1:0),0);if(s>best){best=s;h=i;}});
        if(h<0)throw new Error('Không tìm thấy dòng tiêu đề danh sách học sinh.');
        const headers=rows[h].map(norm), col=(keys)=>{const hs=headers.map(canon);return hs.findIndex(x=>keys.includes(x)||keys.some(k=>x.includes(k)));};
        const nameCol=col(['hovaten','hoten','hocsinh']), codeCol=col(['mahocsinh','mahs','studentid','id']), birthCol=col(['ngaysinh','sinh']), genderCol=col(['gioitinh']);
        const imported=[];
        for(let i=h+1;i<rows.length;i++){const r=Array.isArray(rows[i])?rows[i].map(norm):[];const name=nameCol>=0?r[nameCol]:'';if(name)imported.push({name,studentCode:codeCol>=0?r[codeCol]:'',birthDate:birthCol>=0?r[birthCol]:'',gender:genderCol>=0?r[genderCol]:''});}
        const data=readData();if(!data||!Array.isArray(data.students))throw new Error('Chưa có dữ liệu V2 để cập nhật.');
        const now=new Date().toISOString();let added=0,updated=0;
        for(const r of imported){const code=canon(r.studentCode);let s=code?data.students.find(x=>canon(x.studentCode||'')===code):null;if(!s){const n=canon(r.name);s=data.students.find(x=>canon(x.name)===n&&(!r.birthDate||canon(x.birthDate)===canon(r.birthDate)))||null;}if(s){s.birthDate=r.birthDate||s.birthDate||'';s.gender=r.gender||s.gender||'';if(r.studentCode)s.studentCode=r.studentCode;s.status='active';s.updatedAt=now;updated++;}else{data.students.push({id:`STU_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`,name:r.name,birthDate:r.birthDate||'',gender:r.gender||'',studentCode:r.studentCode||'',status:'active',shareEnabled:true,createdAt:now,updatedAt:now});added++;}}
        localStorage.setItem(DATA_KEY,JSON.stringify(data));
        const toast=qs('#toastStack');if(toast){const e=document.createElement('div');e.className='toast';e.textContent=`Đã nhập ${imported.length} học sinh · thêm ${added} · cập nhật ${updated}.`;toast.appendChild(e);setTimeout(()=>e.remove(),3200);}setTimeout(()=>location.reload(),300);
      }catch(err){const toast=qs('#toastStack');if(toast){const e=document.createElement('div');e.className='toast';e.textContent=`Lỗi nhập danh sách: ${err.message||err}`;toast.appendChild(e);setTimeout(()=>e.remove(),3500);}}
      finally{input.remove();}
    };
    input.click();
  }

  function wireContextButton() {
    qsa("[data-v2-open-profile]").forEach(btn => {
      if (btn.dataset.v2Bound === "1") return;
      btn.dataset.v2Bound = "1";
      btn.addEventListener("click", () => {
        const id = btn.dataset.v2OpenProfile;
        setSelected(id);
        qs('[data-route="profiles"]')?.click();
        setTimeout(() => qs(`[data-action="profile"][data-student="${CSS.escape(id)}"]`)?.click(), 150);
      });
    });
  }

  document.addEventListener("click", e => {
    const importBtn = e.target.closest('[data-action="import-roster"]');
    if (importBtn) { e.preventDefault(); e.stopImmediatePropagation(); chooseRosterImport(); return; }
    const route = e.target.closest("[data-route][data-student]");
    if (route?.dataset.student) setSelected(route.dataset.student);
    const action = e.target.closest("[data-action][data-student]");
    if (action?.dataset.student) setSelected(action.dataset.student);
    if (e.target.closest('[data-route="profiles"]') && !e.target.closest('[data-student]')) clearSelected();
  }, true);

  const observer = new MutationObserver(() => window.requestAnimationFrame(() => { flashStudentContext(); wireContextButton(); }));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("load", () => { flashStudentContext(); wireContextButton(); });
})();
