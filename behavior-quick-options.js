/* BEHAVIOR QUICK OPTIONS 2.0
 * Chỉ thay danh mục lựa chọn trong 2 form Vi phạm/Khen thưởng.
 * Không thay đổi router, Data Engine hay cấu trúc bản ghi.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_QUICK_OPTIONS_20__) return;
  window.__LH_BEHAVIOR_QUICK_OPTIONS_20__=true;

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

  const REWARDS = [
    ['returned-lost-item','Nhặt được của rơi, trả lại người mất'],
    ['help-difficult','Chủ động giúp đỡ bạn khi gặp khó khăn'],
    ['help-learning','Chủ động hỗ trợ bạn trong học tập'],
    ['help-teacher','Tích cực hỗ trợ thầy cô trong công việc chung'],
    ['share-supplies','Chia sẻ đồ dùng học tập với bạn'],
    ['support-peer','Biết nhường nhịn và giúp đỡ bạn'],
    ['care-plants','Chủ động chăm sóc, bảo vệ cây xanh'],
    ['pick-up-trash','Chủ động nhặt rác, giữ gìn vệ sinh chung'],
    ['self-duty','Tự giác thực hiện nhiệm vụ trực nhật'],
    ['protect-property','Giữ gìn, bảo quản tốt tài sản chung'],
    ['report-incident','Kịp thời báo giáo viên khi phát hiện sự việc bất thường'],
    ['safety-help','Chủ động hỗ trợ bạn thực hiện đúng quy định an toàn'],
    ['mediate-conflict','Chủ động giúp bạn giải quyết mâu thuẫn'],
    ['team-activity','Tích cực tham gia các hoạt động tập thể'],
    ['community-support','Tích cực tham gia hoạt động chia sẻ, hỗ trợ cộng đồng'],
    ['save-resources','Tự giác tiết kiệm điện, nước'],
    ['shared-books','Giữ gìn tốt sách vở, đồ dùng dùng chung'],
    ['good-idea','Có cách làm sáng tạo, hiệu quả trong học tập'],
    ['contest-achievement','Đạt thành tích trong hội thi, cuộc thi hoặc phong trào'],
    ['other','Khác']
  ];

  function apply(selectId, items){
    const el=document.getElementById(selectId);
    if(!el) return false;
    const current=el.value;
    el.replaceChildren(new Option('Chọn nội dung',''));
    items.forEach(([value,label])=>el.add(new Option(label,value)));
    if(items.some(x=>x[0]===current)) el.value=current;
    return true;
  }

  function applyAll(){
    apply('violationType',VIOLATIONS);
    apply('rewardType',REWARDS);
  }

  window.LH_BEHAVIOR_QUICK_OPTIONS={VIOLATIONS,REWARDS,applyAll};

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyAll,{once:true});
  else applyAll();
  [300,1000,2500].forEach(ms=>setTimeout(applyAll,ms));
})();