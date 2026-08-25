/* GOOGLE SHEETS RECORDS BRIDGE 20.1 — DELETE FALLBACK */
(function(){'use strict';if(window.__LH_GOOGLE_RECORDS_BRIDGE_2010__)return;window.__LH_GOOGLE_RECORDS_BRIDGE_2010__=true;
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const SCHEMA={DIEM_DANH:['id','studentName','studentId','date','status','note','createdAt','updatedAt'],VI_PHAM:['id','studentName','studentId','date','type','level','status','action','note','createdAt','updatedAt'],KHEN_THUONG:['id','studentName','studentId','date','type','formType','note','createdAt','updatedAt']};
const clean=v=>String(v??'').trim().replace(/\s+/g,' '),now=()=>new Date().toISOString(),today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')},rid=p=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
function jsonp(action,params){return new Promise((resolve,reject)=>{const cb='LH2010_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');let done=false;const end=(e,d)=>{if(done)return;done=true;clearTimeout(t);try{delete window[cb]}catch(_){}s.remove();e?reject(e):resolve(d)};const t=setTimeout(()=>end(Error('Google Apps Script không phản hồi sau 20 giây')),20000);window[cb]=d=>end(null,d);s.onerror=()=>end(Error('Không truy cập được Google Apps Script'));const q=Object.assign({action,callback:cb,_:Date.now()},params||{});s.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');document.head.appendChild(s)})}
function students(){return Array.isArray(window.students)?window.students:Array.isArray(window.classData?.students)?window.classData.students:Array.isArray(window.appData?.students)?window.appData.students:[]}
function resolveStudent(v){const raw=typeof v==='object'?(v.studentId||v.id||v.studentName||v.name):v;const s=students().find(x=>clean(x.id)===clean(raw)||clean(x.studentCode||x.code)===clean(raw)||clean(x.name)===clean(raw));return{id:clean(s?.id||raw),name:clean(v?.studentName||v?.name||s?.name)}}
function normalize(tab,r){if(!SCHEMA[tab])throw Error('Tab không được phép: '+tab);const x=resolveStudent(r||{}),o={};SCHEMA[tab].forEach(k=>o[k]=r?.[k]??'');o.studentId=x.id;o.studentName=x.name;if(!o.id)o.id=rid(tab.toLowerCase());if(!o.studentId)throw Error(tab+': thiếu studentId');if(!o.studentName)throw Error(tab+': không tìm thấy tên học sinh');if(!o.date)o.date=today();if(!o.createdAt)o.createdAt=now();o.updatedAt=now();return o}
function local(tab,r){const map={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords'},list=window[map[tab]];if(!Array.isArray(list))return;const i=list.findIndex(x=>clean(x?.id)===clean(r.id));if(i<0)list.push(r);else list[i]=r;try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences();}catch(_){} }
function toast(ok,msg){if(typeof window.showToast==='function')window.showToast(msg,ok?'success':'error');else console[ok?'log':'error'](msg)}
async function save(tab,r){const rec=normalize(tab,r);const a=await jsonp('save_event',{payload:JSON.stringify({sheet:tab,record:rec})});if(!a?.ok||!(a.saved||a.stored))throw Error(a?.error||'Google Sheets không xác nhận đã lưu');rec.id=a.id||rec.id;local(tab,rec);toast(true,'Đã lưu Google Sheets: '+(rec.studentName||'học sinh'));return{ok:true,id:rec.id,record:rec}}
function same(a,b){return clean(a)===clean(b)}
async function del(tab,id,old){
  try{
    const a=await jsonp('delete_event',{sheet:tab,id:id,recordId:id});
    if(a?.ok&&a.deleted===true){toast(true,'Đã xóa dữ liệu trên Google Sheets.');return a;}
    throw Error(a?.error||'Không xóa được');
  }catch(primary){
    const events=await jsonp('get_events',{});
    const list=Array.isArray(events?.[tab])?events[tab]:[];
    const target=old||{};
    const sid=clean(target.studentId),date=clean(target.date),note=clean(target.note);
    const type=clean(target.type),level=clean(target.level),formType=clean(target.formType),status=clean(target.status);
    const match=list.find(r=>
      (same(r.id,id)) ||
      (sid&&same(r.studentId,sid)&&(!date||same(r.date,date))&&(!note||same(r.note,note))&&(!type||same(r.type,type))&&(!level||same(r.level,level))&&(!formType||same(r.formType,formType))&&(!status||same(r.status,status)))
    );
    if(!match)throw Error(primary?.message||('Không tìm thấy bản ghi tương ứng trong '+tab));
    const a=await jsonp('delete_event',{sheet:tab,id:match.id,recordId:match.id});
    if(!a?.ok||a.deleted!==true)throw Error(a?.error||'Google Sheets không xóa được bản ghi tìm thấy');
    toast(true,'Đã xóa đúng bản ghi trên Google Sheets.');
    return a;
  }
}
window.LH_GOOGLE_SHEETS_V20={version:'20.1',save,delete:del,syncRecord:save};
})();
