/* BEHAVIOR QUICK OPTIONS 2.1
 * CHỈ thay danh mục lựa chọn trong form Vi phạm.
 * Không thay đổi menu Khen thưởng, router, Data Engine hay cấu trúc bản ghi.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_QUICK_OPTIONS_21__) return;
  window.__LH_BEHAVIOR_QUICK_OPTIONS_21__=true;

  const VIOLATIONS = [
    ['talking-disorder','Nói chuyện riêng, gây mất trật tự trong lớp học'],
    ['duty','Chưa thực hiện nhiệm vụ trực nhật theo phân công'],
    ['school-supplies','Quên mang đồ dùng học tập'],
    ['preparation','Chưa chuẩn bị bài trước khi đến lớp'],
    ['assignment','Chưa hoàn thành bài tập được giao'],
    ['focus','Chưa chú ý, tập trung trong giờ học'],
    ['late-submit','Quên nộp bài hoặc nộp bài chưa đúng yêu cầu'],
    ['assigned-task-late','Chưa hoàn thành phần việc được phân công đúng thời hạn'],
    ['leave-seat','Ra khỏi chỗ ngồi khi chưa được phép'],
    ['change-seat','Tự ý đổi chỗ ngồi'],
    ['incomplete-learning-task','Chưa thực hiện đầy đủ nhiệm vụ học tập trên lớp'],
    ['passive-learning','Chưa chủ động tham gia hoạt động học tập'],
    ['class-rules','Chưa thực hiện đúng nội quy lớp học'],
    ['school-rules','Chưa thực hiện đúng nội quy nhà trường'],
    ['peer-conduct','Ứng xử chưa phù hợp với bạn'],
    ['inappropriate-language','Sử dụng lời nói chưa phù hợp'],
    ['cleanliness','Chưa giữ gìn vệ sinh lớp học, trường học'],
    ['property','Chưa giữ gìn, bảo quản đồ dùng và tài sản chung'],
    ['dangerous-play','Chơi các trò nguy hiểm, gây mất an toàn'],
    ['other','Khác']
  ];

  function applyViolationOptions(){
    const el=document.getElementById('violationType');
    if(!el) return false;
    const current=el.value;
    el.replaceChildren(new Option('Chọn nội dung',''));
    VIOLATIONS.forEach(([value,label])=>el.add(new Option(label,value)));
    if(VIOLATIONS.some(x=>x[0]===current)) el.value=current;
    return true;
  }

  window.LH_BEHAVIOR_QUICK_OPTIONS={VIOLATIONS,applyViolationOptions};

  function boot(){
    applyViolationOptions();
    [300,1000,2500].forEach(ms=>setTimeout(applyViolationOptions,ms));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();