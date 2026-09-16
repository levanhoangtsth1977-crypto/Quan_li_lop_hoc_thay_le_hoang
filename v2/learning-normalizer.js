// V2 learning normalizer: convert SMAS rows to stable per-subject records without inventing values.
export function normalizeLearningRows(matched=[], headersBySheet=[]){
  const headerMap=new Map((headersBySheet||[]).map(x=>[x.sheet,x.headers||[]]));
  return matched.map(item=>{
    const headers=headerMap.get(item.sheet)||[];
    const row=Array.isArray(item.raw)?item.raw:[];
    const subjects=[];
    for(let i=0;i<headers.length;i++){
      const h=String(headers[i]??'').trim();
      const v=String(row[i]??'').trim();
      if(!h||!v)continue;
      if(isSubjectHeader(h))subjects.push({subject:h,value:v,column:i});
    }
    return {...item,subjectResults:subjects};
  });
}
function isSubjectHeader(h){
  const x=h.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const keys=['toan','tieng viet','dao duc','lich su','dia li','lich su va dia li','tieng anh','tin hoc','khoa hoc','cong nghe','nghe thuat','hoat dong trai nghiem','giao duc the chat'];
  return keys.some(k=>x.includes(k));
}

export function buildLearningRows(normalized=[],stage='GK1',importedAt=new Date().toISOString()){
  const out=[];
  for(const item of normalized){
    for(const r of item.subjectResults||[]){
      out.push({
        id:`LRN_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`,
        studentId:item.studentId,
        stage,
        subject:r.subject,
        value:r.value,
        source:item.sheet,
        sourceRow:item.rowIndex,
        importedAt
      });
    }
  }
  return out;
}
