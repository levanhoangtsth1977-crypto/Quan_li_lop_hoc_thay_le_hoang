(function(){
  "use strict";
  const FIX_VERSION="1.0.0";
  let timer=null;
  function students(){try{if(typeof window.getStudentsSafe==="function"){const s=window.getStudentsSafe();if(Array.isArray(s))return s;}if(Array.isArray(window.students))return window.students;if(Array.isArray(window.classData?.students))return window.classData.students;}catch(e){console.error("StudentLinksFix",e)}return []}
  function getLink(s){try{if(typeof window.getStudentLink==="function"){const v=window.getStudentLink(s);if(typeof v==="string")return v;if(v&&typeof v.url==="string")return v.url;if(v&&typeof v.href==="string")return v.href;}}catch(e){console.error("getStudentLink",e)}return typeof s.link==="string"?s.link:""}
  function isControl(el){return /mở\s*\/\s*sao chép link/i.test((el.textContent||"").trim())}
  function findPage(){return document.querySelector('[data-page-section="student-links"]')||document.getElementById("page-student-links")||Array.from(document.querySelectorAll("section,main,div")).find(x=>/link học sinh/i.test(x.textContent||"")&&x.querySelector("a,button"));}
  function findRowAndList(page){
    const controls=Array.from(page.querySelectorAll("a,button")).filter(isControl);
    if(!controls.length)return null;
    const first=controls[0];
    let row=null;
    for(let el=first;el&&el!==page;el=el.parentElement){
      const own=Array.from(el.querySelectorAll("a,button")).filter(isControl);
      if(own.length!==1)continue;
      const p=el.parentElement;
      if(!p)continue;
      const siblings=Array.from(p.children).filter(c=>Array.from(c.querySelectorAll("a,button")).some(isControl));
      if(siblings.length>=2){row=el;break;}
    }
    if(!row)return null;
    return {row,list:row.parentElement,controls};
  }
  function bindControl(control,link){
    if(link){control.dataset.studentLink=link;if(control.tagName==="A"){control.href=link;control.target="_blank";control.rel="noopener noreferrer";}}
    control.addEventListener("click",function(ev){
      const href=this.dataset.studentLink||this.getAttribute("href")||"";
      if(!href)return;
      if(this.tagName!=="A")ev.preventDefault();
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(href).then(()=>{if(typeof window.showToast==="function")window.showToast("Đã sao chép link học sinh","success");}).catch(()=>{});}
      if(this.tagName!=="A")window.open(href,"_blank","noopener,noreferrer");
    });
  }
  function fillRow(row,student,index,oldName){
    const clone=row.cloneNode(true);
    const name=String(student?.name||student?.fullName||`Học sinh ${index+1}`);
    const link=getLink(student);
    clone.querySelectorAll("*").forEach(el=>{
      if(el.children.length===0&&el.textContent&&oldName&&el.textContent.includes(oldName))el.textContent=el.textContent.split(oldName).join(name);
      if(el.tagName==="A"&&el.textContent.trim().toLowerCase().includes("mở")){el.dataset.studentLink=link;if(link){el.href=link;el.target="_blank";el.rel="noopener noreferrer";}bindControl(el,link);}
      else if(el.tagName==="BUTTON"&&isControl(el)){el.dataset.studentLink=link;bindControl(el,link);}
    });
    clone.querySelectorAll("[data-student-name]").forEach(el=>el.textContent=name);
    clone.querySelectorAll("[data-student-id]").forEach(el=>el.dataset.studentId=String(student?.id??""));
    const controls=Array.from(clone.querySelectorAll("a,button")).filter(isControl);
    controls.forEach(c=>bindControl(c,link));
    return clone;
  }
  function render(){
    const page=findPage();if(!page)return;
    const listInfo=findRowAndList(page);if(!listInfo)return;
    const data=students();if(!data.length)return;
    const controls=listInfo.controls;
    if(controls.length===data.length)return;
    const row=listInfo.row;const list=listInfo.list;
    const oldName=String(data[0]?.name||data[0]?.fullName||"");
    const frag=document.createDocumentFragment();
    data.forEach((s,i)=>frag.appendChild(fillRow(row,s,i,oldName)));
    list.replaceChildren(frag);
    const visible=Array.from(list.querySelectorAll("a,button")).filter(isControl).length;
    console.info(`[StudentLinksFix ${FIX_VERSION}] ${visible}/${data.length} links`);
    if(typeof window.showToast==="function")window.showToast(`Đã hiển thị đầy đủ ${visible} link học sinh`,"success");
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(render,80)}
  document.addEventListener("DOMContentLoaded",schedule,{once:true});
  window.addEventListener("load",schedule,{once:true});
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  setTimeout(schedule,300);setTimeout(schedule,1000);setTimeout(schedule,2500);
})();
