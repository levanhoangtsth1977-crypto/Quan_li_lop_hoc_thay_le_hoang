/* TIỆN ÍCH — SCHEMA V4 FIX
   Mẫu chuẩn: STT | Họ và tên | Giới tính | Xếp loại | Ghi chú
   Hỗ trợ Markdown table, TSV, CSV, pipe, semicolon.
   T/H được hiểu lần lượt là Tốt / Hoàn thành và dùng để cân bằng sơ đồ.
   Chỉ hoạt động trong menu Tiện ích; không ghi dữ liệu Google Sheets.
*/
(function(){
  'use strict';
  if(window.__LH_UTIL_SCHEMA_V4__) return;
  window.__LH_UTIL_SCHEMA_V4__=true;

  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  const norm=v=>clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');

  function split(line){
    let s=String(line??'').trim();
    if(!s) return [];
    if(s.startsWith('|')) s=s.slice(1);
    if(s.endsWith('|')) s=s.slice(0,-1);
    if(s.includes('\t')) return s.split('\t').map(clean);
    if(s.includes('|')) return s.split('|').map(clean);
    if(s.includes(';')) return s.split(';').map(clean);
    const out=[]; let cur=''; let quoted=false;
    for(let i=0;i<s.length;i++){
      const c=s[i];
      if(c==='"'){
        if(quoted && s[i+1]==='"'){cur+='"';i++;}
        else quoted=!quoted;
      } else if(c===',' && !quoted){out.push(clean(cur));cur='';}
      else cur+=c;
    }
    out.push(clean(cur));
    return out;
  }

  function isDividerRow(r){
    return r.length>0 && r.every(v=>/^:?-{2,}:?$/.test(clean(v)));
  }

  function findHeader(rows){
    for(let i=0;i<Math.min(rows.length,5);i++){
      const h=rows[i].map(norm);
      const name=h.findIndex(x=>x==='ho va ten'||x==='ho ten'||x.includes('ho va ten')||x.includes('ho ten')||x.includes('hoc sinh'));
      const level=h.findIndex(x=>x==='xep loai'||x.includes('xep loai')||x.includes('trinh do')||x==='level');
      if(name>=0) return {row:i,name,level};
    }
    return {row:-1,name:1,level:3};
  }

  function parse(text){
    const rows=String(text||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n').map(split).filter(r=>r.length && r.some(Boolean));
    if(!rows.length) throw new Error('Tệp không có dữ liệu.');
    const h=findHeader(rows);
    const data=[];
    for(let i=0;i<rows.length;i++){
      if(i===h.row || isDividerRow(rows[i])) continue;
      const r=rows[i];
      const name=clean(r[h.name]||'');
      if(!name) continue;
      const lv=clean(r[h.level]||'');
      const stt=clean(r[0]||'');
      if(/^\d+$/.test(stt) && !name) continue;
      data.push({
        id:`UPLOAD-${String(data.length+1).padStart(3,'0')}`,
        studentCode:`UPLOAD-${String(data.length+1).padStart(3,'0')}`,
        name,
        gender:clean(r[2]||''),
        xepLoai:lv || 'H',
        note:clean(r[4]||''),
        source:'utilities-schema-v4'
      });
    }
    if(!data.length) throw new Error('Không tìm thấy dữ liệu theo mẫu: STT | Họ và tên | Giới tính | Xếp loại | Ghi chú.');
    return data;
  }

  function rank(v){
    const s=norm(v);
    if(s==='t'||s.startsWith('t ')) return 2;
    if(s==='h'||s.startsWith('h ')) return 1;
    if(/tot|gioi|xuat sac/.test(s)) return 2;
    if(/hoan thanh|dat|kha/.test(s)) return 1;
    return 1;
  }

  function levelLabel(v){
    const s=norm(v);
    if(s==='t') return 'T';
    if(s==='h') return 'H';
    return clean(v)||'H';
  }

  function shuffle(a){
    const x=a.slice();
    for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}
    return x;
  }

  function buildLayout(list){
    const work=shuffle(list);
    const pairs=[];
    while(work.length){
      const first=work.shift();
      let best=-1,bestDiff=Infinity;
      for(let i=0;i<work.length;i++){
        const d=Math.abs(rank(first.xepLoai)-rank(work[i].xepLoai));
        if(d<bestDiff){bestDiff=d;best=i;if(d===0)break;}
      }
      pairs.push([first,best>=0?work.splice(best,1)[0]:null]);
    }
    const cols=Array.from({length:4},()=>[]);
    pairs.forEach((p,i)=>cols[i%4].push(p));
    return `<div class="lh-layout-toolbar"><span><b>${list.length}</b> học sinh · <b>${pairs.length}</b> bàn · <b>4</b> tổ · <b>2 HS/bàn</b></span><button class="button secondary" id="lhSchemaShuffle" type="button"><i class="fa-solid fa-shuffle"></i> Xếp lại</button></div><div class="lh-classroom lh-four-columns">${cols.map((col,c)=>`<div class="lh-column"><div class="lh-group-title">Tổ ${c+1} <small>(${col.length} bàn)</small></div>${col.map((p,i)=>`<div class="lh-desk"><span class="lh-row">${i+1}</span><div class="lh-seat">${p[0]?`<b>${esc(p[0].name)}</b><small>Xếp loại: ${esc(levelLabel(p[0].xepLoai))}</small>`:'—'}</div><div class="lh-seat">${p[1]?`<b>${esc(p[1].name)}</b><small>Xếp loại: ${esc(levelLabel(p[1].xepLoai))}</small>`:'—'}</div></div>`).join('')}</div>`).join('')}</div><p class="lh-note">Dữ liệu tải lên chỉ dùng để xếp sơ đồ lớp/xếp tổ. Không ghi, không sửa, không xóa dữ liệu gốc.</p>`;
  }

  function install(){
    const btn=document.getElementById('lhLevelUpload');
    if(!btn || btn.__LH_SCHEMA_V4__) return;
    btn.__LH_SCHEMA_V4__=true;
    const fresh=btn.cloneNode(true); btn.replaceWith(fresh);
    const input=document.createElement('input');
    input.type='file'; input.accept='.csv,.tsv,.txt'; input.style.display='none';
    input.id='lhSchemaV4File'; document.body.appendChild(input);
    let uploaded=[];
    fresh.onclick=()=>input.click();
    input.onchange=async()=>{
      const file=input.files&&input.files[0]; input.value=''; if(!file)return;
      try{
        uploaded=parse(await file.text());
        window.__LH_UTIL_SCHEMA_V4_DATA__=uploaded;
        const status=document.getElementById('lhUploadStatus');
        if(status){status.innerHTML=`Đã tải lên <b>${uploaded.length}</b> học sinh · Mẫu 5 cột · Xếp loại T/H`;status.classList.add('ready');}
        const root=document.getElementById('lhUtilityWorkspace');
        if(root) root.innerHTML=`<div class="lh-upload-preview"><div class="lh-preview-head"><b>Danh sách đã đọc</b><span>${uploaded.length}/42 học sinh</span></div><div class="lh-preview-table"><table><thead><tr><th>STT</th><th>Họ và tên</th><th>Giới tính</th><th>Xếp loại</th><th>Ghi chú</th></tr></thead><tbody>${uploaded.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.name)}</td><td>${esc(s.gender)}</td><td><b>${esc(levelLabel(s.xepLoai))}</b></td><td>${esc(s.note)}</td></tr>`).join('')}</tbody></table></div><div class="lh-preview-actions"><button class="button primary" id="lhSchemaCreateLayout" type="button"><i class="fa-solid fa-diagram-project"></i> Tạo sơ đồ lớp học</button></div></div>`;
        const create=document.getElementById('lhSchemaCreateLayout');
        if(create) create.onclick=()=>{if(root){root.innerHTML=buildLayout(uploaded);const sh=document.getElementById('lhSchemaShuffle');if(sh)sh.onclick=()=>{root.innerHTML=buildLayout(uploaded);const b=document.getElementById('lhSchemaShuffle');if(b)b.onclick=()=>{root.innerHTML=buildLayout(uploaded);};};}};
      }catch(err){alert(err?.message||'Không thể đọc tệp.');}
    };
  }

  function watch(){install();[250,700,1500].forEach(ms=>setTimeout(install,ms));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true}); else watch();
  const mo=new MutationObserver(()=>install());
  if(document.body)mo.observe(document.body,{subtree:true,childList:true});
})();
