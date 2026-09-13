/* STUDENT PICKER V3 — COMPACT MULTI-SELECT FOR EVENT MODALS */
(function(){
  'use strict';
  if(window.__LH_STUDENT_PICKER_V3__) return;
  window.__LH_STUDENT_PICKER_V3__=true;

  const S=v=>String(v??'').trim();
  const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function selectedValues(select){
    return Array.from(select.options).filter(o=>o.selected&&S(o.value)).map(o=>S(o.value));
  }

  function install(select){
    if(!select || select.dataset.lhV3==='1') return;
    select.dataset.lhV3='1';

    /* Keep the real select for existing save logic, but never display it. */
    select.multiple=true;
    select.removeAttribute('size');
    select.style.position='absolute';
    select.style.left='-99999px';
    select.style.width='1px';
    select.style.height='1px';
    select.style.opacity='0';
    select.style.pointerEvents='none';

    const label=select.closest('label');
    label?.querySelectorAll('.lh-multi-hint').forEach(x=>x.remove());

    const old=select.parentElement?.querySelector('.lh-csp-v3');
    if(old) old.remove();

    const box=document.createElement('div');
    box.className='lh-csp-v3';
    box.innerHTML=`
      <button type="button" class="lh-csp3-trigger" aria-expanded="false">
        <span class="lh-csp3-main">Chọn học sinh</span>
        <span class="lh-csp3-count"></span>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div class="lh-csp3-panel" hidden>
        <div class="lh-csp3-head">
          <strong>Chọn học sinh</strong>
          <button type="button" class="lh-csp3-collapse" aria-label="Thu gọn"><i class="fa-solid fa-chevron-up"></i></button>
        </div>
        <div class="lh-csp3-list"></div>
      </div>`;
    select.parentElement?.insertBefore(box,select);

    const trigger=box.querySelector('.lh-csp3-trigger');
    const panel=box.querySelector('.lh-csp3-panel');
    const main=box.querySelector('.lh-csp3-main');
    const count=box.querySelector('.lh-csp3-count');
    const list=box.querySelector('.lh-csp3-list');
    const collapse=box.querySelector('.lh-csp3-collapse');

    function close(){
      panel.hidden=true;
      trigger.setAttribute('aria-expanded','false');
      trigger.classList.remove('open');
    }
    function open(){
      panel.hidden=false;
      trigger.setAttribute('aria-expanded','true');
      trigger.classList.add('open');
    }
    function sync(){
      const values=selectedValues(select);
      main.textContent=values.length?'Đã chọn học sinh':'Chọn học sinh';
      count.textContent=values.length?`${values.length} học sinh`:'';
      list.querySelectorAll('.lh-csp3-item').forEach(item=>{
        const on=values.includes(item.dataset.value);
        item.classList.toggle('selected',on);
        const cb=item.querySelector('input');
        if(cb) cb.checked=on;
      });
    }
    function rebuild(){
      list.innerHTML='';
      Array.from(select.options).filter(o=>S(o.value)).forEach(option=>{
        const item=document.createElement('label');
        item.className='lh-csp3-item';
        item.dataset.value=S(option.value);
        item.innerHTML=`<input type="checkbox"><span>${E(option.textContent)}</span><i class="fa-solid fa-check"></i>`;
        const cb=item.querySelector('input');
        cb.checked=option.selected;
        item.addEventListener('click',e=>{
          if(e.target!==cb) cb.checked=!cb.checked;
          const opt=Array.from(select.options).find(o=>S(o.value)===S(option.value));
          if(!opt)return;
          opt.selected=cb.checked;
          select.dispatchEvent(new Event('change',{bubbles:true}));
          sync();
        });
        list.appendChild(item);
      });
      sync();
    }

    trigger.addEventListener('click',e=>{e.preventDefault();panel.hidden?open():close();});
    collapse.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close();});
    document.addEventListener('click',e=>{if(!box.contains(e.target))close();});
    select.addEventListener('change',sync);

    new MutationObserver(()=>rebuild()).observe(select,{childList:true,subtree:true});
    rebuild();
  }

  function scan(){
    document.querySelectorAll('.ev-static-modal #eStudent, #violationForm #violationStudent, #rewardForm #rewardStudent').forEach(install);
  }

  function css(){
    if(document.getElementById('lhStudentPickerV3Css'))return;
    const style=document.createElement('style');
    style.id='lhStudentPickerV3Css';
    style.textContent=`
      .lh-csp-v3{position:relative;width:100%;margin-top:2px}
      .lh-csp3-trigger{width:100%;min-height:44px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;display:flex;align-items:center;gap:8px;text-align:left;font:inherit;cursor:pointer;box-sizing:border-box}
      .lh-csp3-main{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .lh-csp3-count{font-size:12px;color:#64748b;white-space:nowrap}
      .lh-csp3-trigger i{transition:transform .15s ease}
      .lh-csp3-trigger.open i{transform:rotate(180deg)}
      .lh-csp3-panel{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:100020;background:#fff;border:1px solid #dbe3ef;border-radius:12px;box-shadow:0 18px 45px rgba(15,23,42,.16);overflow:hidden}
      .lh-csp3-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
      .lh-csp3-collapse{border:0;background:transparent;color:#475569;padding:5px 8px;cursor:pointer}
      .lh-csp3-list{max-height:300px;overflow:auto;padding:6px}
      .lh-csp3-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 11px;border-radius:8px;cursor:pointer;box-sizing:border-box}
      .lh-csp3-item:hover{background:#f8fafc}
      .lh-csp3-item.selected{background:#eff6ff;font-weight:700}
      .lh-csp3-item input{width:17px;height:17px;flex:none;margin:0}
      .lh-csp3-item span{flex:1}
      .lh-csp3-item i{opacity:0}
      .lh-csp3-item.selected i{opacity:1}
    `;
    document.head.appendChild(style);
  }

  function start(){
    css();
    scan();
    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
