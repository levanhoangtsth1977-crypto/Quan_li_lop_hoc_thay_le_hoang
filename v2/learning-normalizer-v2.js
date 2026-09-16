// Safe SMAS learning normalization helpers. No writes, no side effects.
export function normalizeMatchedLearning(matched=[], headersBySheet=[]){
  const bySheet=Object.fromEntries((headersBySheet||[]).map(x=>[x.sheet,x.headers||[]]));
  return (matched||[]).map(item=>({...item, subjectResults:subjectResults(item.raw,bySheet[item.sheet]||[])}));
}
function canon(v){return String(v??'').trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');}
function subjectResults(row,headers){
  if(!Array.isArray(row)||!Array.isArray(headers))return [];
  const keys=['toan','tieng viet','dao duc','lich su','dia li','tieng anh','tin hoc','khoa hoc','cong nghe','nghe thuat','hoat dong trai nghiem','giao duc the chat'];
  return headers.map((h,i)=>({h:String(h??'').trim(),v:String(row[i]??'').trim(),i})).filter(x=>x.h&&x.v&&keys.some(k=>canon(x.h).includes(k))).map(x=>({subject:x.h,value:x.v,column:x.i}));
}
