/* TRIỆU PHÚ HỌC ĐƯỜNG — CURRICULUM CATALOG 1.0
   Danh mục chuẩn: Môn -> Cxx -> tên Chủ đề/Chương.
   Không tạo câu hỏi giả; mục 0 câu chỉ là mục lục để giáo viên biết phạm vi còn thiếu.
*/
(function(){'use strict';
if(window.__LH_CURRICULUM_CATALOG_10__)return;window.__LH_CURRICULUM_CATALOG_10__=true;

var CATALOG={
 math:[
  ['C01','Chủ đề 1. Ôn tập và bổ sung'],
  ['C02','Chủ đề 2. Số thập phân'],
  ['C03','Chủ đề 3. Một số đơn vị đo diện tích'],
  ['C04','Chủ đề 4. Các phép tính với số thập phân'],
  ['C05','Chủ đề 5. Một số hình phẳng. Chu vi và diện tích'],
  ['C06','Chủ đề 6. Ôn tập học kì 1'],
  ['C07','Chủ đề 7. Tỉ số và các bài toán liên quan'],
  ['C08','Chủ đề 8. Thể tích. Đơn vị đo thể tích'],
  ['C09','Chủ đề 9. Diện tích và thể tích của một số hình khối'],
  ['C10','Chủ đề 10. Số đo thời gian, vận tốc. Các bài toán liên quan đến chuyển động đều'],
  ['C11','Chủ đề 11. Một số yếu tố thống kê và xác suất'],
  ['C12','Chủ đề 12. Ôn tập cuối năm']
 ],
 vietnamese:[
  ['C01','Chủ điểm 1. Thế giới tuổi thơ'],
  ['C02','Chủ điểm 2. Thiên nhiên kì thú'],
  ['C03','Chủ điểm 3. Trên con đường học tập'],
  ['C04','Chủ điểm 4. Nghệ thuật muôn màu'],
  ['C05','Chủ điểm 5. Vẻ đẹp cuộc sống'],
  ['C06','Chủ điểm 6. Hương sắc trăm miền'],
  ['C07','Chủ điểm 7. Tiếp bước cha ông'],
  ['C08','Chủ điểm 8. Thế giới của chúng ta']
 ],
 science:[
  ['C01','Chủ đề 1. Chất'],
  ['C02','Chủ đề 2. Năng lượng'],
  ['C03','Chủ đề 3. Thực vật và động vật'],
  ['C04','Chủ đề 4. Vi khuẩn'],
  ['C05','Chủ đề 5. Con người và sức khoẻ'],
  ['C06','Chủ đề 6. Sinh vật và môi trường']
 ],
 history:null
};
window.LH_CURRICULUM=CATALOG;
function txt(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:-]+/g,'').toUpperCase()}
function subject(v){var s=norm(v);if(/^(TOAN|MATH|MATHEMATICS|MATHEMATICS5)$/.test(s))return'math';if(/^(TV|TIENGVIET|VIETNAMESE|VIETNAMESE5)$/.test(s))return'vietnamese';if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE|NATURALSCIENCE5)$/.test(s))return'science';if(/^(LSDL|LSDIALI|LSDL5|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s))return'history';return''}
function code(v){var s=txt(v).toUpperCase(),m=s.match(/(?:^|[-_])C[_-]?(\d{1,2})(?:[-_]|$)/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');var n=norm(v),m2=n.match(/C(\d{1,2})(?:B\d|Q\d|$)/);return m2?'C'+String(Number(m2[1])).padStart(2,'0'):''}
function chapterCode(q){return code(q&&q.topicCode)||code(q&&q.id)||code(q&&q.chapter)||code(q&&q.Chuong)||code(q&&q.topic)}
function lookup(sk,tc){var a=CATALOG[sk];if(!Array.isArray(a))return null;for(var i=0;i<a.length;i++)if(a[i][0]===tc)return{name:a[i][1],code:a[i][0]};return null}
function inject(){var all=Array.isArray(window.LH_ALL_GAME_QUESTIONS)?window.LH_ALL_GAME_QUESTIONS.slice():[];if(!all.length)return false;var counts={};
 all.forEach(function(q){var sk=subject(q.subject||q.Mon||'');var tc=chapterCode(q);if(!sk||!tc)return;var item=lookup(sk,tc);q.subject=sk;q.subjectKey=sk;q.topicCode=tc;q.topicKey=sk+'|'+tc;if(item){q.chapter=item.name;q.Chuong=item.name;q.topic=item.name;q.topicName=item.name}else{q.chapter=txt(q.chapter||q.Chuong||q.topic);q.Chuong=q.chapter;q.topic=q.chapter;q.topicName=q.chapter}counts[sk+'|'+tc]=(counts[sk+'|'+tc]||0)+1;});
 ['math','vietnamese','science'].forEach(function(sk){var a=CATALOG[sk]||[];a.forEach(function(item){var key=sk+'|'+item[0];if(!counts[key])all.push({id:'__CATALOG__'+sk+'_'+item[0],subject:sk,subjectKey:sk,Mon:sk,topicCode:item[0],topicKey:key,chapter:item[1],Chuong:item[1],topic:item[1],topicName:item[1],level:'M1',group:'CATALOG',question:'',options:[],correctAnswer:0,explanation:'',points:0,time:0,status:'CATALOG_ONLY',rawStatus:'CATALOG_ONLY',stt:''});});});
 window.GAME_QUESTIONS=all;window.LH_CURRICULUM_COUNTS=counts;return true;}
function render(){var s=document.getElementById('subject'),c=document.getElementById('chapter'),m=document.getElementById('gameMode');if(!s||!c)return;var sk=subject(s.value)||String(s.value||'').toLowerCase();if(m&&m.value==='mixed'){c.disabled=true;c.innerHTML='<option value="">🌐 Tổng hợp 4 môn</option>';return}var all=Array.isArray(window.LH_ALL_GAME_QUESTIONS)?window.LH_ALL_GAME_QUESTIONS:[];var counts={};all.forEach(function(q){var qs=subject(q.subject||q.Mon||'');var tc=chapterCode(q);if(qs&&tc&&qs===sk&&String(q.status||'').toUpperCase()!=='CATALOG_ONLY')counts[qs+'|'+tc]=(counts[qs+'|'+tc]||0)+1;});var list=CATALOG[sk];if(!Array.isArray(list)){var map={};all.forEach(function(q){var qs=subject(q.subject||q.Mon||'');if(qs!==sk)return;var tc=chapterCode(q),name=txt(q.chapter||q.Chuong||q.topic);if(tc&&!map[tc])map[tc]=name||('Chủ đề '+Number(tc.slice(1)))});list=Object.keys(map).sort(function(a,b){return Number(a.slice(1))-Number(b.slice(1))}).map(function(tc){return[tc,map[tc]]});}var oldCode=(c.selectedOptions&&c.selectedOptions[0]&&c.selectedOptions[0].dataset&&c.selectedOptions[0].dataset.topicCode)||'';c.innerHTML='';var first=document.createElement('option');first.value='';first.textContent='📚 Chọn chủ đề / chương';c.appendChild(first);(list||[]).forEach(function(item){var o=document.createElement('option'),key=sk+'|'+item[0],n=counts[key]||0;o.value=item[1];o.textContent='📘 '+item[1]+' ('+n+' câu)';o.dataset.topicCode=item[0];o.dataset.subject=sk;o.dataset.questionCount=String(n);c.appendChild(o)});c.disabled=false;if(oldCode){Array.prototype.some.call(c.options,function(o){if(o.dataset&&o.dataset.topicCode===oldCode){c.value=o.value;return true}return false})}}
function boot(){if(inject()){render();try{window.dispatchEvent(new CustomEvent('questionBankReady',{detail:{curriculum:true,version:'1.0',catalog:true}}))}catch(e){}setTimeout(render,50);setTimeout(render,250);setTimeout(render,750)}}
window.LHCurriculumCatalog={render:render,inject:inject,getCatalog:function(){return CATALOG}};
window.addEventListener('questionBankReady',function(e){if(e.detail&&e.detail.curriculum)return;setTimeout(boot,120)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,120)},{once:true});else setTimeout(boot,120);
})();