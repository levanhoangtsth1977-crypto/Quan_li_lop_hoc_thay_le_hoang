/* BEHAVIOR MULTI-STUDENT UI 2.1 — SINGLE CANONICAL PICKER */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_MULTI_STUDENT_UI_21__)return;
  window.__LH_BEHAVIOR_MULTI_STUDENT_UI_21__=true;

  const S=v=>String(v??'').trim();
  const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function install(select){
    if(!select || select.dataset.lhCompactMulti==='1') return;
    const host=select.parentElement;
    if(!host)return;

    select.dataset.lhCompactMulti='1';
    select.multiple=true;
    select.setAttribute('multiple','multiple');
    select.size=1;
    select.style.position='absolute';
    select.style.opacity='0';
    select.style.pointerEvents='none';
    select.style.width='1px';
    select.style.height='1px';
    select.style.overflow='hidden';

    const box=document.createElement('div');
    box.className='lh-compact-student-picker';
    box.innerHTML=`
      <button type="button" class="lh-csp-trigger" aria-expanded="false">
        <span class="lh-csp-text">Chọn học sinh</span>
        <span class="lh-csp-count"></span>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div class="lh-csp-panel" hidden>
        <div class="lh-csp-header">
          <strong>Chọn học sinh</strong>
          <button type="button" class="lh-csp-close" title="Thu gọn" aria-label="Thu gọn"><i class="fa-solid fa-chevron-up"></i></button>
        </div>
        <div class="lh-csp-list"></div>
      </div>`;
    host.insertBefore(box,select);

    const trigger=box.querySelector('.lh-csp-trigger');
    const panel=box.querySelector('.lh-csp-panel');
    const text=box.querySelector('.lh-csp-text');
    const count=box.querySelector('.lh-csp-count');
    const list=box.querySelector('.lh-csp-list');
    const closeBtn=box.querySelector('.lh-csp-close');

    function selectedValues(){
      return Array.from(select.options).filter(o=>o.selected&&S(o.value)).map(o=>o.value);
    }
    function sync(){
      const values=selectedValues();
      text.textContent=values.length ? 'Đã chọn học sinh' : 'Chọn học sinh';
      count.textContent=values.length ? `${values.length} học sinh` : '';
      list.querySelectorAll('.lh-csp-item').forEach(item=>{
        const on=values.includes(item.dataset.value);
        item.classList.toggle('selected',on);
        const cb=item.querySelector('input');
        if(cb)cb.checked=on;
      });
    }
    function rebuild(){
      list.innerHTML='';
      Array.from(select.options).filter(o=>S(o.value)).forEach(option=>{
        const label=document.createElement('label');
        label.className='lh-csp-item';
        label.dataset.value=option.value;
        label.innerHTML=`<input type="checkbox" value="${E(option.value)}"><span>${E(option.textContent)}</span><i class="fa-solid fa-check"></i>`;
        const cb=label.querySelector('input');
        cb.checked=option.selected;
        label.addEventListener('click',function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          cb.checked=!cb.checked;
          const opt=Array.from(select.options).find(o=>o.value===option.value);
          if(opt){opt.selected=cb.checked;select.dispatchEvent(new Event('change',{bubbles:true}));}
          sync();
        });
        list.appendChild(label);
      });
      sync();
    }
    function open(){panel.hidden=false;trigger.setAttribute('aria-expanded','true');trigger.classList.add('open');}
    function close(){panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.classList.remove('open');}

    trigger.addEventListener('click',function(ev){ev.preventDefault();panel.hidden?open():close();});
    closeBtn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();close();});
    document.addEventListener('click',function(ev){if(!box.contains(ev.target))close();});
    select.addEventListener('change',sync);

    new MutationObserver(rebuild).observe(select,{childList:true,subtree:true});
    rebuild();
  }

  function scan(){
    document.querySelectorAll('#violationForm #violationStudent, #rewardForm #rewardStudent, .ev-static-modal #eStudent').forEach(install);
  }

  function css(){
    if(document.getElementById('lhCompactStudentPickerCss20'))return;
    const style=document.createElement('style');
    style.id='lhCompactStudentPickerCss20';
    style.textContent=`
      .lh-compact-student-picker{position:relative;width:100%}
      .lh-compact-student-picker .lh-csp-trigger{width:100%;min-height:44px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;padding:10px 12px;display:flex;align-items:center;gap:8px;text-align:left;font:inherit;cursor:pointer;box-sizing:border-box}
      .lh-compact-student-picker .lh-csp-trigger .lh-csp-text{flex:1}
      .lh-compact-student-picker .lh-csp-count{font-size:12px;color:#64748b;white-space:nowrap}
      .lh-compact-student-picker .lh-csp-trigger i{transition:transform .15s ease}
      .lh-compact-student-picker .lh-csp-trigger.open i{transform:rotate(180deg)}
      .lh-compact-student-picker .lh-csp-panel{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:100010;background:#fff;border:1px solid #dbe3ef;border-radius:12px;box-shadow:0 18px 45px rgba(15,23,42,.16);overflow:hidden}
      .lh-compact-student-picker .lh-csp-header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
      .lh-compact-student-picker .lh-csp-close{border:0;background:transparent;color:#475569;padding:5px 8px;cursor:pointer}
      .lh-compact-student-picker .lh-csp-list{max-height:300px;overflow:auto;padding:6px}
      .lh-compact-student-picker .lh-csp-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 11px;border-radius:8px;cursor:pointer;box-sizing:border-box}
      .lh-compact-student-picker .lh-csp-item:hover{background:#f8fafc}
      .lh-compact-student-picker .lh-csp-item.selected{background:#eff6ff;font-weight:700}
      .lh-compact-student-picker .lh-csp-item input{width:17px;height:17px;flex:none}
      .lh-compact-student-picker .lh-csp-item span{flex:1}
      .lh-compact-student-picker .lh-csp-item i{opacity:0}
      .lh-compact-student-picker .lh-csp-item.selected i{opacity:1}
    `;
    document.head.appendChild(style);
  }

  function start(){css();scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
