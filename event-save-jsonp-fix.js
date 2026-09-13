/* EVENT SAVE JSONP FIX
 * Bypass cross-origin fetch failures in events-new-final.js.
 * Only intercepts the Save button in the violation/reward modal.
 */
(function(){
  'use strict';
  if(window.__LH_EVENT_SAVE_JSONP_FIX__) return;
  window.__LH_EVENT_SAVE_JSONP_FIX__=true;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();

  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='__LH_EVENT_SAVE_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      let done=false;
      const finish=(err,data)=>{
        if(done)return;
        done=true;
        clearTimeout(timer);
        try{delete window[cb]}catch(_){window[cb]=undefined}
        s.remove();
        err?reject(err):resolve(data);
      };
      const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi.')),20000);
      window[cb]=data=>finish(null,data);
      s.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));
      const q=new URLSearchParams({action,callback:cb,_:Date.now(),...params});
      s.src=API+'?'+q.toString();
      document.head.appendChild(s);
    });
  }

  function esc(v){return S(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

  async function save(btn){
    const m=document.getElementById('evModal');
    if(!m) return;
    const studentId=S(m.querySelector('#evStudent')?.value);
    const type=S(m.querySelector('#evType')?.value);
    const date=S(m.querySelector('#evDate')?.value);
    const note=S(m.querySelector('#evNote')?.value);
    if(!studentId||!type){alert('Vui lòng chọn học sinh và nội dung.');return;}
    const isViolation=!!m.querySelector('#evLevel');
    const record={
      id:'',
      studentId,
      date:date||new Date().toISOString().slice(0,10),
      type,
      note
    };
    if(isViolation){
      record.level=S(m.querySelector('#evLevel')?.value);
      record.status=S(m.querySelector('#evStatus')?.value);
      record.action=S(m.querySelector('#evAction')?.value);
    }else{
      record.formType=S(m.querySelector('#evFormType')?.value);
    }
    btn.disabled=true;
    const old=btn.innerHTML;
    btn.innerHTML='Đang lưu...';
    try{
      const result=await jsonp('save_event',{payload:JSON.stringify({sheet:isViolation?'VI_PHAM':'KHEN_THUONG',record})});
      if(!result?.ok) throw new Error(result?.error||'Google Apps Script từ chối lưu.');
      m.remove();
      alert(isViolation?'Đã lưu vi phạm.':'Đã lưu khen thưởng.');
      location.reload();
    }catch(e){
      btn.disabled=false;
      btn.innerHTML=old;
      alert('Lưu thất bại: '+S(e?.message||e));
    }
  }

  document.addEventListener('click',function(e){
    const btn=e.target?.closest?.('#evSave');
    if(!btn) return;
    const modal=btn.closest('#evModal');
    if(!modal) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    save(btn);
  },true);
})();

/* ============================================================
   VI PHẠM — CHỌN HỌC SINH DẠNG NÚT XỔ XUỐNG / THU GỌN
   Chỉ áp dụng form #violationForm.
   ============================================================ */
(function(){
  'use strict';
  if(window.__LH_VIOLATION_STUDENT_PICKER_20__) return;
  window.__LH_VIOLATION_STUDENT_PICKER_20__=true;

  const S=v=>String(v??'').trim();
  const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');

  function install(form){
    const select=form?.querySelector('#violationStudent');
    if(!select||select.dataset.lhPickerReady==='1') return;
    const host=select.parentElement;
    if(!host) return;

    select.dataset.lhPickerReady='1';
    select.setAttribute('aria-hidden','true');
    select.tabIndex=-1;
    select.style.position='absolute';
    select.style.opacity='0';
    select.style.pointerEvents='none';
    select.style.width='1px';
    select.style.height='1px';

    const picker=document.createElement('div');
    picker.className='lh-violation-student-picker';
    picker.innerHTML=`
      <button type="button" class="lh-vsp-button" aria-expanded="false">
        <span class="lh-vsp-label">Chọn học sinh</span>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div class="lh-vsp-menu" hidden>
        <div class="lh-vsp-head">
          <strong>Chọn học sinh</strong>
          <button type="button" class="lh-vsp-collapse" aria-label="Thu gọn">
            <i class="fa-solid fa-chevron-up" aria-hidden="true"></i>
          </button>
        </div>
        <div class="lh-vsp-list"></div>
      </div>`;
    host.insertBefore(picker,select);

    const button=picker.querySelector('.lh-vsp-button');
    const menu=picker.querySelector('.lh-vsp-menu');
    const label=picker.querySelector('.lh-vsp-label');
    const list=picker.querySelector('.lh-vsp-list');
    const collapseButton=picker.querySelector('.lh-vsp-collapse');

    function collapsed(){
      menu.hidden=true;
      button.setAttribute('aria-expanded','false');
      button.classList.remove('open');
    }
    function expanded(){
      menu.hidden=false;
      button.setAttribute('aria-expanded','true');
      button.classList.add('open');
    }
    function syncLabel(){
      const opt=select.options[select.selectedIndex];
      label.textContent=opt?.value?S(opt.textContent):'Chọn học sinh';
    }
    function syncSelected(){
      list.querySelectorAll('.lh-vsp-item').forEach(item=>{
        const selected=item.dataset.value===select.value;
        item.classList.toggle('selected',selected);
        item.setAttribute('aria-selected',selected?'true':'false');
      });
    }
    function rebuild(){
      list.innerHTML='';
      Array.from(select.options).filter(o=>S(o.value)).forEach(option=>{
        const item=document.createElement('button');
        item.type='button';
        item.className='lh-vsp-item';
        item.dataset.value=option.value;
        item.setAttribute('aria-selected',option.selected?'true':'false');
        item.innerHTML=`<span>${E(option.textContent)}</span><i class="fa-solid fa-check" aria-hidden="true"></i>`;
        item.addEventListener('click',function(ev){
          ev.preventDefault();
          select.value=option.value;
          select.dispatchEvent(new Event('change',{bubbles:true}));
          syncLabel();
          syncSelected();
          collapsed();
        });
        list.appendChild(item);
      });
      syncLabel();
      syncSelected();
    }

    button.addEventListener('click',function(ev){
      ev.preventDefault();
      if(menu.hidden) expanded(); else collapsed();
    });
    collapseButton.addEventListener('click',function(ev){ev.preventDefault();collapsed();});
    document.addEventListener('click',function(ev){if(!picker.contains(ev.target))collapsed();});
    select.addEventListener('change',function(){syncLabel();syncSelected();});

    new MutationObserver(rebuild).observe(select,{childList:true});
    rebuild();
  }

  function scan(){document.querySelectorAll('#violationForm').forEach(install);}

  function style(){
    if(document.getElementById('lhViolationStudentPickerCss20')) return;
    const css=document.createElement('style');
    css.id='lhViolationStudentPickerCss20';
    css.textContent=`
      #violationForm .lh-violation-student-picker{position:relative;width:100%}
      #violationForm .lh-vsp-button{width:100%;min-height:44px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;display:flex;align-items:center;justify-content:space-between;gap:10px;font:inherit;text-align:left;cursor:pointer;box-sizing:border-box}
      #violationForm .lh-vsp-button:hover{border-color:#94a3b8}
      #violationForm .lh-vsp-button.open{border-color:#64748b;box-shadow:0 0 0 3px rgba(100,116,139,.12)}
      #violationForm .lh-vsp-button i{transition:transform .16s ease}
      #violationForm .lh-vsp-button.open i{transform:rotate(180deg)}
      #violationForm .lh-vsp-menu{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:100003;background:#fff;border:1px solid #dbe3ef;border-radius:12px;box-shadow:0 18px 45px rgba(15,23,42,.16);overflow:hidden}
      #violationForm .lh-vsp-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
      #violationForm .lh-vsp-collapse{border:0;background:transparent;padding:5px 8px;cursor:pointer;color:#475569}
      #violationForm .lh-vsp-list{max-height:280px;overflow-y:auto;padding:6px}
      #violationForm .lh-vsp-item{width:100%;border:0;border-radius:8px;background:#fff;color:#0f172a;padding:10px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px;font:inherit;text-align:left;cursor:pointer}
      #violationForm .lh-vsp-item:hover{background:#f1f5f9}
      #violationForm .lh-vsp-item.selected{background:#eff6ff;font-weight:700}
      #violationForm .lh-vsp-item i{opacity:0}
      #violationForm .lh-vsp-item.selected i{opacity:1}
    `;
    document.head.appendChild(css);
  }

  function start(){
    style();
    scan();
    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
