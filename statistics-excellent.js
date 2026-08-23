/* THỐNG KÊ — HỌC SINH XUẤT SẮC TOÀN DIỆN */
(function () {
  "use strict";
  let busy = false;
  const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const arr = n => Array.isArray(window[n]) ? window[n] : [];
  const sid = r => String(r?.studentId ?? r?.studentID ?? r?.idStudent ?? "");
  const num = v => { if(v===null||v===undefined||v==="") return null; const n=Number(String(v).replace(",",".").replace(/[^0-9.-]/g,"")); return Number.isFinite(n)?n:null; };
  const level = v => { const s=String(v??"").toLowerCase().trim(); if(/mức?\s*1|^m1$|chưa đạt|chua dat|yếu|yeu|cđ/.test(s))return 1; if(/mức?\s*2|^m2$|đạt|dat|trung bình|trung binh/.test(s))return 2; if(/mức?\s*3|^m3$|tốt|tot|khá|kha|hoàn thành|hoan thanh/.test(s))return 3; if(/^t$|excellent|xuất sắc|xuat sac/.test(s))return 4; return null; };
  const qv = r => { let best=null; [r?.nangLuc,r?.năngLực,r?.competency,r?.competencies,r?.phamChat,r?.phẩmChất,r?.quality,r?.qualities,r?.mucDo,r?.mứcĐộ,r?.level,r?.result].forEach(v=>{const n=num(v),l=level(v); if(n!==null)best=best===null?n:Math.max(best,n); if(l!==null)best=best===null?l:Math.max(best,l);}); return best; };
  const avg = rs => { const a=[]; rs.forEach(r=>{const n=num(r?.score??r?.diem??r?.resultScore??r?.average??r?.ketQua); if(n!==null)a.push(n<=10?n*10:Math.min(n,100)); else {const l=level(r?.level??r?.result??r?.mucDo); if(l!==null)a.push(l*25);}}); return a.length?a.reduce((x,y)=>x+y,0)/a.length:null; };
  function rows(){
    const students=Array.isArray(window.students)?window.students:[], at=arr("attendanceRecords"),vi=arr("violationRecords"),re=arr("rewardRecords"),le=arr("learningRecords"),pr=arr("progressRecords"),co=arr("commentRecords");
    return students.map((s,i)=>{const id=String(s?.id??""),a=at.filter(r=>sid(r)===id),v=vi.filter(r=>sid(r)===id),r=re.filter(r=>sid(r)===id),l=le.filter(r=>sid(r)===id),p=pr.filter(r=>sid(r)===id),c=co.filter(r=>sid(r)===id); const absent=a.filter(x=>String(x?.status).toLowerCase()==="absent").length,exc=a.filter(x=>String(x?.status).toLowerCase()==="excused").length; const ls=avg(l),ps=avg(p),qvls=[...c,...p,...l].map(qv).filter(x=>x!==null),qp=qvls.length?Math.min(100,qvls.reduce((x,y)=>x+y,0)/qvls.length*25):null,as=a.length?Math.max(0,100-absent*100/a.length):100,ds=Math.max(0,100-v.length*10),rs=Math.min(100,r.length*20),parts=[[ls,.4],[qp,.2],[ps,.15],[as,.1],[ds,.1],[rs,.05]].filter(x=>x[0]!==null),w=parts.reduce((x,y)=>x+y[1],0),score=w?parts.reduce((x,y)=>x+y[0]*y[1],0)/w:0; return {id,name:String(s?.name??"").trim()||"Chưa có tên",ls,qp,ps,absent,exc,v:v.length,r:r.length,score};}).sort((a,b)=>b.score-a.score||a.absent-b.absent||b.r-a.r||a.name.localeCompare(b.name,"vi"));
  }
  const scoreText=v=>v===null?"—":`${v.toFixed(1)}%`;
  function render(){
    const grid=document.getElementById("statisticsGrid"); if(!grid||busy)return; busy=true;
    try{
      const old=document.getElementById("excellentTopInput"), current=Math.max(1,Math.min(999,Number(old?.value)||5));
      const data=rows(), limit=Math.min(current,data.length), list=data.slice(0,limit);
      grid.innerHTML=`<section class="dashboard-panel excellent-statistics-panel" id="excellentStatisticsPanel"><div class="panel-header"><div><h3>🏆 Học sinh xuất sắc toàn diện</h3><p>Xếp hạng theo học tập, năng lực/phẩm chất, tiến bộ, vắng, vi phạm và khen thưởng.</p></div><label style="display:flex;align-items:center;gap:8px;font-weight:700;white-space:nowrap"><span>Số lượng</span><input id="excellentTopInput" class="period-select" type="number" min="1" max="999" step="1" value="${current}" aria-label="Số học sinh muốn xem"></label></div><div class="table-container"><table class="data-table"><thead><tr><th>Hạng</th><th>Học sinh</th><th>Học tập</th><th>Năng lực / phẩm chất</th><th>Tiến bộ</th><th>Vắng</th><th>Vi phạm</th><th>Khen thưởng</th><th>Điểm toàn diện</th></tr></thead><tbody>${list.length?list.map((r,i)=>`<tr><td><strong>${i+1}</strong></td><td><strong>${esc(r.name)}</strong></td><td>${scoreText(r.ls)}</td><td>${scoreText(r.qp)}</td><td>${scoreText(r.ps)}</td><td>${r.absent}${r.exc?` <small>(phép ${r.exc})</small>`:""}</td><td>${r.v}</td><td>${r.r}</td><td><strong>${r.score.toFixed(1)}%</strong></td></tr>`).join(""):`<tr><td colspan="9"><div class="empty-state"><strong>Chưa có dữ liệu học sinh</strong><p>Hãy đồng bộ dữ liệu lớp trước khi xếp hạng.</p></div></td></tr>`}</tbody></table></div></section>`;
      const input=document.getElementById("excellentTopInput"); if(input){input.addEventListener("change",()=>render()); input.addEventListener("keydown",e=>{if(e.key==="Enter")render();});}
    }finally{setTimeout(()=>busy=false,0);}
  }
  function init(){
    render();
    const grid=document.getElementById("statisticsGrid");
    if(grid){new MutationObserver(()=>{if(!busy)setTimeout(render,0);}).observe(grid,{childList:true});}
    document.addEventListener("click",e=>{if(e.target.closest?.('[data-page="statistics"],[data-page-link="statistics"]'))setTimeout(render,30);});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();
