// V2 learning normalizer: convert SMAS rows into stable per-subject records without inventing values.
const canon=v=>String(v??'').replace(/\s+/g,' ').trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'');

const SUBJECT_KEYS=[
  ['toán','Toán'],['tieng viet','Tiếng Việt'],['dao duc','Đạo đức'],
  ['lich su va dia li','Lịch sử và Địa lí'],['lich su','Lịch sử'],['dia li','Địa lí'],
  ['tieng anh','Tiếng Anh'],['tin hoc','Tin học'],['khoa hoc','Khoa học'],
  ['cong nghe','Công nghệ'],['nghe thuat','Nghệ thuật'],
  ['hoat dong trai nghiem','Hoạt động trải nghiệm'],['giao duc the chat','Giáo dục thể chất']
];

const PROFILE_KEYS=['pham chat','nang luc'];

function classifyHeader(h){
  const x=canon(h);
  const subject=SUBJECT_KEYS.find(([k])=>x.includes(canon(k)));
  if(subject)return{type:'subject',name:subject[1]};
  const profile=PROFILE_KEYS.find(k=>x.includes(canon(k)));
  if(profile)return{type:'profile',name:profile==='pham chat'?'Phẩm chất':'Năng lực'};
  return null;
}

export function normalizeLearningRows(matched=[],headersBySheet=[]){
  const headerMap=new Map((headersBySheet||[]).map(x=>[x.sheet,x.headers||[]]));
  return (matched||[]).map(item=>{
    const headers=headerMap.get(item.sheet)||[];
    const row=Array.isArray(item.raw)?item.raw:[];
    const subjectResults=[];
    const profileResults=[];
    for(let i=0;i<headers.length;i++){
      const h=String(headers[i]??'').trim();
      const v=String(row[i]??'').trim();
      if(!h||!v)continue;
      const c=classifyHeader(h);
      if(c?.type==='subject')subjectResults.push({subject:c.name,header:h,value:v,column:i});
      else if(c?.type==='profile')profileResults.push({category:c.name,header:h,value:v,column:i});
    }
    return {...item,subjectResults,profileResults};
  });
}

export function buildLearningRows(normalized=[],stage='GK1',importedAt=new Date().toISOString(),importBatchId=''){
  const out=[];
  for(const item of normalized||[]){
    for(const r of item.subjectResults||[]){
      out.push({
        id:`LRN_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`,
        studentId:item.studentId,
        stage,
        subject:r.subject,
        header:r.header,
        value:r.value,
        source:item.sheet,
        sourceRow:item.rowIndex,
        importedAt,
        importBatchId
      });
    }
  }
  return out;
}

export function buildLearningProfiles(normalized=[],stage='GK1',importedAt=new Date().toISOString(),importBatchId=''){
  return (normalized||[]).filter(x=>(x.profileResults||[]).length).map(item=>({
    id:`LRP_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`,
    studentId:item.studentId,
    stage,
    source:item.sheet,
    sourceRow:item.rowIndex,
    results:item.profileResults,
    importedAt,
    importBatchId
  }));
}
