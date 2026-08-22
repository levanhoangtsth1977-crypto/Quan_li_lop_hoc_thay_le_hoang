/* AI GIÁO VIÊN — KHO NHẬN XÉT MASTER 1.0
 * Độc lập với CSDL hiện tại. Không thay đổi Google Sheets schema.
 * Tự ánh xạ điểm tham khảo -> mức -> nhận xét; giáo viên luôn có quyền sửa.
 */
(function(){
'use strict';
if(window.__LH_AI_COMMENTS_ENGINE_V1__)return;
window.__LH_AI_COMMENTS_ENGINE_V1__=true;

const KEY='LH_AI_COMMENTS_MASTER_V1';
const SUBJECTS=['Toán','Tiếng Việt','Khoa học','Lịch sử và Địa lí','Công nghệ','Đạo đức'];
const COMPETENCIES=['Tự chủ và tự học','Giao tiếp và hợp tác','Giải quyết vấn đề và sáng tạo','Năng lực ngôn ngữ','Năng lực toán học','Năng lực khoa học','Năng lực công nghệ'];
const QUALITIES=['Yêu nước','Nhân ái','Chăm chỉ','Trung thực','Trách nhiệm'];
const LEVELS=['Tốt','Đạt','Chưa đạt'];
const LEVEL_LABEL={Tốt:'Tốt (T)',Đạt:'Đạt (H)', 'Chưa đạt':'Chưa đạt (C)'};
const FOCUS={
 'Toán':'kiến thức, kĩ năng tính toán, suy luận và giải toán',
 'Tiếng Việt':'đọc, viết, nói, nghe và sử dụng tiếng Việt',
 'Khoa học':'quan sát, tìm hiểu và vận dụng kiến thức khoa học',
 'Lịch sử và Địa lí':'tìm hiểu lịch sử, địa lí và quê hương đất nước',
 'Công nghệ':'thực hành, kĩ thuật, sử dụng dụng cụ và an toàn',
 'Đạo đức':'chuẩn mực đạo đức, ứng xử và trách nhiệm',
 'Tự chủ và tự học':'tự quản lí việc học và chủ động tự học',
 'Giao tiếp và hợp tác':'trao đổi, lắng nghe và phối hợp với bạn',
 'Giải quyết vấn đề và sáng tạo':'phân tích tình huống, tìm cách giải quyết và sáng tạo',
 'Năng lực ngôn ngữ':'sử dụng tiếng Việt để đọc, viết, nói và nghe',
 'Năng lực toán học':'tư duy, lập luận, mô hình hóa và giải quyết vấn đề toán học',
 'Năng lực khoa học':'nhận thức, tìm hiểu tự nhiên và vận dụng kiến thức khoa học',
 'Năng lực công nghệ':'nhận thức, thiết kế, thực hành và sử dụng công nghệ',
 'Yêu nước':'tình yêu quê hương, đất nước và ý thức giữ gìn truyền thống',
 'Nhân ái':'sự yêu thương, tôn trọng và chia sẻ với mọi người',
 'Chăm chỉ':'tinh thần học tập, rèn luyện và kiên trì',
 'Trung thực':'sự ngay thẳng, trung thực trong học tập và ứng xử',
 'Trách nhiệm':'ý thức thực hiện nhiệm vụ và trách nhiệm với tập thể'
};

const BANK={
Tốt:[
 'Nắm vững {f}, thực hiện nhiệm vụ chính xác và chủ động.',
 'Vận dụng tốt {f} vào các nhiệm vụ học tập và tình huống quen thuộc.',
 'Có tiến bộ rõ rệt, biết tự kiểm tra và điều chỉnh khi thực hiện {f}.',
 'Thực hiện tốt yêu cầu cần đạt, trình bày kết quả rõ ràng về {f}.',
 'Chủ động tìm hiểu, biết liên hệ thực tế và mở rộng {f}.',
 'Có khả năng giải thích, trao đổi và bảo vệ ý kiến về {f}.',
 'Hoàn thành nhiệm vụ đầy đủ, chính xác và có trách nhiệm trong {f}.',
 'Biết vận dụng linh hoạt {f} để giải quyết nhiệm vụ mới.',
 'Tự tin, tích cực và có ý thức tự học trong {f}.',
 'Biết hợp tác hiệu quả với bạn khi thực hiện nhiệm vụ về {f}.',
 'Kết quả học tập ổn định, thể hiện tốt {f}.',
 'Biết phát hiện và sửa lỗi để nâng cao kết quả về {f}.',
 'Có hứng thú học tập và tích cực khám phá {f}.',
 'Thực hiện nhiệm vụ nhanh, chính xác và phù hợp với yêu cầu về {f}.',
 'Biết lựa chọn cách làm phù hợp khi vận dụng {f}.',
 'Có khả năng vận dụng kiến thức, kĩ năng về {f} vào thực tế.',
 'Thể hiện rõ sự tiến bộ và tự tin trong {f}.',
 'Hoàn thành tốt nhiệm vụ được giao và biết hỗ trợ bạn về {f}.',
 'Có tinh thần trách nhiệm, chủ động và sáng tạo trong {f}.',
 'Đáp ứng tốt yêu cầu cần đạt và có khả năng vận dụng {f}.'
],
Đạt:[
 'Nắm được kiến thức, kĩ năng cơ bản về {f} và hoàn thành yêu cầu chính.',
 'Thực hiện được nhiệm vụ về {f} khi có hướng dẫn phù hợp.',
 'Có cố gắng và từng bước tiến bộ trong {f}.',
 'Hiểu được nội dung trọng tâm liên quan đến {f}.',
 'Biết vận dụng {f} vào một số tình huống quen thuộc.',
 'Hoàn thành phần lớn nhiệm vụ học tập về {f}.',
 'Có ý thức sửa lỗi sau khi được góp ý về {f}.',
 'Kĩ năng cơ bản về {f} đang đáp ứng yêu cầu.',
 'Cần mạnh dạn hơn khi trình bày ý kiến về {f}.',
 'Biết hợp tác với bạn trong một số nhiệm vụ về {f}.',
 'Có tiến bộ nhưng kết quả về {f} chưa thật ổn định.',
 'Cần duy trì thói quen học tập thường xuyên đối với {f}.',
 'Hoàn thành yêu cầu cơ bản về {f}.',
 'Biết liên hệ {f} với một số tình huống gần gũi.',
 'Có ý thức tự học nhưng cần duy trì đều hơn khi học {f}.',
 'Cần luyện tập thêm để nâng cao chất lượng nhiệm vụ về {f}.',
 'Thực hiện nhiệm vụ về {f} khá đầy đủ.',
 'Đang hình thành và củng cố kĩ năng vận dụng {f}.',
 'Đáp ứng yêu cầu cơ bản về {f} và có khả năng tiến bộ thêm.',
 'Cần tăng tính chính xác và sự chủ động khi thực hiện {f}.'
],
'Cần cố gắng':[
 'Chưa nắm chắc một số kiến thức, kĩ năng cơ bản về {f}.',
 'Cần được hướng dẫn thêm để hoàn thành nhiệm vụ về {f}.',
 'Kết quả thực hiện {f} chưa ổn định, cần luyện tập thường xuyên hơn.',
 'Cần củng cố kiến thức nền tảng liên quan đến {f}.',
 'Việc vận dụng {f} còn hạn chế, cần thêm thời gian thực hành.',
 'Cần chủ động hơn trong quá trình thực hiện nhiệm vụ về {f}.',
 'Chưa hoàn thành đầy đủ yêu cầu liên quan đến {f}.',
 'Cần rèn thói quen học tập thường xuyên hơn đối với {f}.',
 'Kĩ năng cơ bản liên quan đến {f} chưa vững.',
 'Cần chú ý hơn khi thực hiện các yêu cầu về {f}.',
 'Cần được hỗ trợ khi thực hiện nhiệm vụ mới về {f}.',
 'Cần duy trì sự tập trung tốt hơn trong {f}.',
 'Cần biết tự kiểm tra và sửa lỗi khi thực hiện {f}.',
 'Cần luyện tập thêm để đáp ứng yêu cầu về {f}.',
 'Việc trình bày kết quả liên quan đến {f} còn chưa rõ ràng.',
 'Cần phối hợp tốt hơn khi thực hiện nhiệm vụ về {f}.',
 'Có cố gắng nhưng kết quả về {f} chưa đáp ứng yêu cầu.',
 'Cần kế hoạch hỗ trợ và luyện tập phù hợp về {f}.',
 'Cần tăng cường thực hành để củng cố {f}.',
 'Cần tiếp tục cố gắng, rèn luyện và hoàn thiện {f}.'
]};

function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function esc(v){return clean(v).replace(/[&<>\'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function uid(){return'NX_'+Date.now()+'_'+Math.random().toString(36).slice(2,9)}
function today(){const d=new Date();return d.toISOString().slice(0,10)}
function students(){return Array.isArray(window.students)?window.students:Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:[]}
function levelFromScore(v){const n=Number(String(v).replace(',','.'));if(!Number.isFinite(n)||n<0||n>10)return'';if(n>=9)return'Tốt';if(n>=7)return'Đạt';return'Chưa đạt'}
function scoreRange(level){return level==='Tốt'?'9–10':level==='Đạt'?'7–8,9':'0–6,9'}
function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}
function makeComment(subject,level,studentId){const bank=BANK[level==='Chưa đạt'?'Cần cố gắng':level]||BANK.Đạt;const i=hash(String(studentId||'')+subject+level)%bank.length;return bank[i].replace('{f}',FOCUS[subject]||subject)}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
let records=load();
function persist(){localStorage.setItem(KEY,JSON.stringify(records));window.AI_TEACHER_COMMENTS=records;window.dispatchEvent(new CustomEvent('ai-comments-updated',{detail:records}))}
function addStyle(){if(document.getElementById('lhAiCommentsStyle'))return;const s=document.createElement('style');s.id='lhAiCommentsStyle';s.textContent=`#lhAiCommentsModal{position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;padding:12px}.lhac-box{width:min(900px,100%);max-height:95vh;overflow:auto;background:#fff;border-radius:18px;padding:18px;box-shadow:0 25px 70px rgba(0,0,0,.3)}.lhac-title{font-size:21px;font-weight:800;margin:0 0 4px}.lhac-sub{color:#64748b;margin:0 0 16px}.lhac-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lhac-field{display:flex;flex-direction:column;gap:6px}.lhac-full{grid-column:1/-1}.lhac-field label{font-weight:700;font-size:14px}.lhac-field select,.lhac-field input,.lhac-field textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:11px;font-size:15px}.lhac-level{padding:10px;border-radius:10px;border:2px solid #cbd5e1;background:#fff;font-weight:800}.lhac-level.auto{border-color:#2563eb;background:#eff6ff}.lhac-comment{width:100%;text-align:left;padding:10px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:9px;margin-bottom:7px}.lhac-actions{display:flex;gap:8px;justify-content:flex-end;position:sticky;bottom:0;background:#fff;padding-top:12px;margin-top:12px}.lhac-actions button{border:0;border-radius:10px;padding:12px 16px;font-weight:800}.lhac-save{background:#2563eb;color:#fff}.lhac-cancel{background:#e2e8f0}.lhac-info{padding:10px;border-radius:10px;background:#f8fafc;color:#475569}.lhac-ok{color:#166534;font-weight:700}.lhac-bad{color:#b91c1c;font-weight:700}@media(max-width:600px){#lhAiCommentsModal{padding:0;align-items:flex-end}.lhac-box{width:100%;max-height:96vh;border-radius:18px 18px 0 0}.lhac-grid{grid-template-columns:1fr}.lhac-full{grid-column:auto}.lhac-actions{padding-bottom:calc(8px + env(safe-area-inset-bottom))}.lhac-save{flex:1}}`;document.head.appendChild(s)}
function close(){document.getElementById('lhAiCommentsModal')?.remove()}
function open(){addStyle();close();const ss=students();const m=document.createElement('div');m.id='lhAiCommentsModal';m.innerHTML=`<div class="lhac-box"><h2 class="lhac-title">🤖 Kho nhận xét AI giáo viên</h2><p class="lhac-sub">Tự chọn nhận xét theo môn, năng lực, phẩm chất và tự ánh xạ điểm → mức đạt.</p><div class="lhac-grid"><div class="lhac-field"><label>Ngày</label><input id="lhacDate" type="date" value="${today()}"></div><div class="lhac-field"><label>Học sinh</label><select id="lhacStudent"><option value="">Chọn học sinh</option>${ss.map(x=>`<option value="${esc(x.id||x.studentId)}">${esc(x.name||x.studentName)}</option>`).join('')}</select></div><div class="lhac-field"><label>Loại đánh giá</label><select id="lhacType"><option value="subject">Môn học</option><option value="competency">Năng lực</option><option value="quality">Phẩm chất</option></select></div><div class="lhac-field"><label>Nội dung đánh giá</label><select id="lhacTarget"><option value="">Chọn nội dung</option></select></div><div class="lhac-field"><label>Điểm tham khảo (0–10)</label><input id="lhacScore" type="number" min="0" max="10" step="0.1" placeholder="Nhập điểm để tự xác định mức"></div><div class="lhac-field"><label>Mức đạt</label><select id="lhacLevel"><option value="">Tự xác định từ điểm</option>${LEVELS.map(x=>`<option value="${x}">${LEVEL_LABEL[x]}</option>`).join('')}</select></div><div class="lhac-field lhac-full"><div id="lhacMapping" class="lhac-info">Nhập điểm hoặc chọn mức đạt. Hệ thống không tự gán nếu chưa có dữ liệu.</div></div><div class="lhac-field lhac-full"><label>Kho 20 nhận xét phù hợp</label><div id="lhacBank"></div></div><div class="lhac-field lhac-full"><label>Nhận xét sẽ lưu</label><textarea id="lhacComment" rows="4" placeholder="Chọn một câu trong kho hoặc tự nhập..."></textarea></div><div class="lhac-field lhac-full"><label>Nội dung minh chứng / ghi chú</label><input id="lhacNote" placeholder="Ví dụ: Phân số, đọc hiểu, hợp tác nhóm..."></div><div class="lhac-field lhac-full"><div id="lhacError" class="lhac-bad"></div></div></div><div class="lhac-actions"><button type="button" class="lhac-cancel" id="lhacCancel">Hủy</button><button type="button" class="lhac-save" id="lhacSave">💾 Lưu nhận xét</button></div></div>`;document.body.appendChild(m);const type=m.querySelector('#lhacType'),target=m.querySelector('#lhacTarget'),score=m.querySelector('#lhacScore'),level=m.querySelector('#lhacLevel'),student=m.querySelector('#lhacStudent');function fillTargets(){const arr=type.value==='subject'?SUBJECTS:type.value==='competency'?COMPETENCIES:QUALITIES;target.innerHTML='<option value="">Chọn nội dung</option>'+arr.map(x=>`<option>${esc(x)}</option>`).join('');render()}
function render(){const t=target.value,sid=student.value,lv=levelFromScore(score.value);if(score.value!==''&&lv)level.value=lv;const use=level.value||lv;const map=document.getElementById('lhacMapping');map.innerHTML=score.value!==''&&lv?`Điểm <b>${esc(score.value)}</b> → <b>${LEVEL_LABEL[lv]}</b> <span>(${scoreRange(lv)})</span>`:'Chọn điểm hoặc mức đạt để tạo nhận xét.';const bank=document.getElementById('lhacBank');if(!t||!use){bank.innerHTML='<div class="lhac-info">Chọn nội dung và mức đạt để hiển thị 20 câu.</div>';return}const arr=BANK[use==='Chưa đạt'?'Cần cố gắng':use].map(x=>x.replace('{f}',FOCUS[t]||t));bank.innerHTML=arr.map((x,i)=>`<button type="button" class="lhac-comment" data-i="${i}">${i+1}. ${esc(x)}</button>`).join('');bank.querySelectorAll('.lhac-comment').forEach(b=>b.onclick=()=>{document.getElementById('lhacComment').value=arr[Number(b.dataset.i)]})}
[type,target,score,level,student].forEach(x=>x.addEventListener('change',render));score.addEventListener('input',render);type.addEventListener('change',fillTargets);m.querySelector('#lhacCancel').onclick=close;m.querySelector('#lhacSave').onclick=()=>{const err=document.getElementById('lhacError');err.textContent='';const t=target.value,sid=student.value,lv=level.value||levelFromScore(score.value),comment=document.getElementById('lhacComment').value.trim();if(!sid)return err.textContent='Chưa chọn học sinh.';if(!t)return err.textContent='Chưa chọn nội dung đánh giá.';if(!lv)return err.textContent='Chưa có mức đạt.';if(!comment)return err.textContent='Chưa chọn hoặc nhập nhận xét.';const s=ss.find(x=>String(x.id||x.studentId)===String(sid));const r={id:uid(),studentId:sid,studentName:s?.name||s?.studentName||sid,date:document.getElementById('lhacDate').value||today(),category:type.value,target:t,score:score.value===''?null:Number(score.value),level:lv,levelCode:lv==='Tốt'?'T':lv==='Đạt'?'H':'C',comment,note:document.getElementById('lhacNote').value.trim(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),source:'AI_COMMENT_BANK'};records.unshift(r);persist();close();if(typeof window.showToast==='function')window.showToast('Đã lưu nhận xét AI.');else alert('Đã lưu nhận xét AI.')};fillTargets()}
function bind(){document.addEventListener('click',e=>{const b=e.target.closest('[data-action="ai-comments"], [data-action="add-comment"]');if(b){e.preventDefault();e.stopImmediatePropagation();open()}},{capture:true});const page=document.querySelector('[data-page-section="comments"]');if(page&&!page.dataset.lhacBound){page.dataset.lhacBound='1';const btn=Array.from(page.querySelectorAll('button')).find(b=>clean(b.textContent).toLowerCase().includes('thêm nhận xét'));if(btn)btn.addEventListener('click',e=>{e.preventDefault();open()},{capture:true})}}
window.LH_AI_COMMENTS={open,close,records:()=>records,subjects:SUBJECTS,competencies:COMPETENCIES,qualities:QUALITIES,levels:LEVELS,levelFromScore,makeComment};window.AI_TEACHER_COMMENTS=records;
function init(){addStyle();bind();setTimeout(bind,1000);setTimeout(bind,3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
