/* KHEN THUONG UI CLEANUP 1.1
 * Chỉ sắp xếp giao diện trang Khen thưởng.
 * Không thay đổi router/menu khác, không xóa dữ liệu Google Sheets.
 * Ẩn bảng legacy 5 cột nếu có, giữ bảng canonical #rewardTable 6 cột.
 * Không dùng MutationObserver toàn trang để tránh vòng lặp render và làm treo menu.
 */
(function(){
  'use strict';
  if(window.__LH_REWARD_UI_CLEANUP_11__) return;
  window.__LH_REWARD_UI_CLEANUP_11__=true;

  const page=()=>document.getElementById('page-rewards');

  function injectStyle(){
    if(document.getElementById('lhRewardUiCleanupCss')) return;
    const s=document.createElement('style');
    s.id='lhRewardUiCleanupCss';
    s.textContent=`
      #page-rewards .lh-events-toolbar{
        display:flex;align-items:center;justify-content:space-between;gap:14px;
        margin:16px 0;padding:14px 16px;border:1px solid var(--border,#e2e8f0);
        border-radius:14px;background:#fff;box-shadow:0 4px 14px rgba(15,23,42,.05)
      }
      #page-rewards .lh-events-toolbar-left{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
      #page-rewards .lh-events-toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      #page-rewards .lh-events-count{font-size:13px;font-weight:800;color:var(--text-secondary,#526071);white-space:nowrap}
      #page-rewards .lh-events-search{max-width:380px;height:40px;padding:0 12px;border:1px solid var(--border,#e2e8f0);border-radius:10px;background:#fff}
      #page-rewards .lh-events-search:focus{border-color:rgba(37,99,235,.45);box-shadow:0 0 0 3px rgba(37,99,235,.10)}
      #page-rewards .lh-events-toolbar .button{min-height:40px;white-space:nowrap}
      #page-rewards .table-container[data-lh-reward-canonical]{
        margin-top:14px;border:1px solid var(--border,#e2e8f0);border-radius:14px;
        background:#fff;overflow:auto;box-shadow:0 4px 16px rgba(15,23,42,.04)
      }
      #page-rewards #rewardTable{min-width:920px;width:100%;border-collapse:separate;border-spacing:0}
      #page-rewards #rewardTable thead th{position:sticky;top:0;z-index:2;background:#f8fafc}
      #page-rewards #rewardTable tbody td{vertical-align:middle}
      #page-rewards #rewardTable tbody tr:hover{background:#f8fbff}
      #page-rewards [data-lh-legacy-reward-table="1"]{display:none !important}
      @media(max-width:700px){
        #page-rewards .lh-events-toolbar{flex-direction:column;align-items:stretch}
        #page-rewards .lh-events-toolbar-left,#page-rewards .lh-events-toolbar-right{width:100%}
        #page-rewards .lh-events-toolbar-right{justify-content:stretch}
        #page-rewards .lh-events-toolbar-right .button{flex:1}
        #page-rewards .lh-events-search{max-width:none;width:100%}
        #page-rewards .page-header{gap:12px}
      }
    `;
    document.head.appendChild(s);
  }

  function hideLegacyTables(){
    const p=page();if(!p)return;
    const tables=[...p.querySelectorAll('table')];
    const canonical=p.querySelector('#rewardTable');
    tables.forEach((t)=>{
      if(canonical && t===canonical)return;
      const cells=[...t.querySelectorAll('thead th')].map(x=>String(x.textContent||'').trim()).join('|');
      const looksReward=/Ngày/.test(cells)&&/Học sinh/.test(cells)&&(/Thành tích/.test(cells)||/Hình thức/.test(cells));
      const looksFive=/Ghi chú/.test(cells)&&!canonical;
      if(looksReward||looksFive){
        if(t.getAttribute('data-lh-legacy-reward-table')!=='1') t.setAttribute('data-lh-legacy-reward-table','1');
        const wrap=t.closest('.table-container');
        if(wrap && wrap.getAttribute('data-lh-legacy-reward-table')!=='1') wrap.setAttribute('data-lh-legacy-reward-table','1');
      }
    });
  }

  function markCanonicalTable(){
    const p=page();if(!p)return;
    const table=p.querySelector('#rewardTable');
    if(!table)return;
    const wrap=table.closest('.table-container');
    if(wrap && wrap.getAttribute('data-lh-reward-canonical')!=='1') wrap.setAttribute('data-lh-reward-canonical','1');
    const head=table.querySelector('thead');
    const target='<tr><th>STT</th><th>Họ tên học sinh</th><th>Ngày khen thưởng</th><th>Nội dung khen thưởng</th><th>Hình thức khen thưởng</th><th>Thao tác</th></tr>';
    if(head && head.innerHTML!==target) head.innerHTML=target;
  }

  function cleanText(){
    const p=page();if(!p)return;
    const title=p.querySelector('.page-header h1');
    if(title && title.textContent.trim()!=='Khen thưởng') title.textContent='Khen thưởng';
    const desc=p.querySelector('.page-header p');
    if(desc && desc.textContent.trim()!=='Ghi nhận những thành tích, việc tốt và sự tiến bộ của học sinh.') desc.textContent='Ghi nhận những thành tích, việc tốt và sự tiến bộ của học sinh.';
    const add=[...p.querySelectorAll('[data-action="add-reward"],button')].find(x=>/Ghi nhận khen thưởng/i.test(x.textContent||''));
    if(add && add.innerHTML!=='<i class="fa-solid fa-trophy"></i> Ghi nhận khen thưởng') add.innerHTML='<i class="fa-solid fa-trophy"></i> Ghi nhận khen thưởng';
  }

  function run(){
    const p=page();if(!p)return;
    injectStyle();
    hideLegacyTables();
    markCanonicalTable();
    cleanText();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  [150,500,1000,2000].forEach(ms=>setTimeout(run,ms));
})();
