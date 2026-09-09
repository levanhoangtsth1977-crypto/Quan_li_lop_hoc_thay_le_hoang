/* BEHAVIOR QUICK OPTIONS 1.0
 * Chỉ thay danh mục lựa chọn trong 2 form Vi phạm/Khen thưởng.
 * Không thay đổi router, Data Engine hay cấu trúc bản ghi.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_QUICK_OPTIONS_10__) return;
  window.__LH_BEHAVIOR_QUICK_OPTIONS_10__=true;

  const VIOLATIONS = [
    ['lineup','Không thực hiện đúng quy định khi xếp hàng'],
    ['duty','Chưa thực hiện trực nhật theo phân công'],
    ['school-supplies','Quên đồ dùng học tập'],
    ['preparation','Chưa chuẩn bị bài'],
    ['assignment','Chưa hoàn thành nhiệm vụ học tập'],
    ['focus','Không tập trung trong giờ học'],
    ['talking','Nói chuyện riêng'],
    ['off-task','Làm việc riêng trong giờ học'],
    ['disorder','Mất trật tự'],
    ['individual-task','Không thực hiện nhiệm vụ cá nhân'],
    ['group-work','Không thực hiện nhiệm vụ nhóm'],
    ['participation','Chưa tích cực tham gia hoạt động học tập'],
    ['class-rules','Chưa chấp hành nội quy lớp học'],
    ['school-rules','Chưa chấp hành nội quy nhà trường'],
    ['peer-conduct','Ứng xử chưa phù hợp với bạn bè'],
    ['language','Lời nói chưa phù hợp'],
    ['cleanliness','Chưa giữ gìn vệ sinh trường lớp'],
    ['property','Chưa giữ gìn, bảo quản đồ dùng và tài sản chung'],
    ['device-use','Sử dụng thiết bị học tập chưa đúng quy định'],
    ['safety','Vi phạm quy định an toàn']
  ];

  const REWARDS = [
    ['returned-lost-item','Nhặt được của rơi, trả người mất'],
    ['help-difficult','Giúp đỡ bạn khi gặp khó khăn'],
    ['help-learning','Chủ động giúp bạn trong học tập'],
    ['help-teacher','Giúp đỡ thầy cô trong công việc chung'],
    ['share-supplies','Chia sẻ đồ dùng học tập với bạn'],
    ['support-peer','Nhường nhịn và hỗ trợ bạn'],
    ['care-plants','Bảo vệ, chăm sóc cây xanh của lớp/trường'],
    ['pick-up-trash','Chủ động nhặt rác, giữ gìn vệ sinh chung'],
    ['self-duty','Tự giác thực hiện nhiệm vụ trực nhật'],
    ['protect-property','Bảo quản tốt tài sản chung của lớp'],
    ['report-incident','Phát hiện và báo giáo viên khi có sự việc bất thường'],
    ['safety-help','Có hành động giúp đảm bảo an toàn cho bạn'],
    ['mediate-conflict','Chủ động hòa giải, giúp bạn giải quyết mâu thuẫn'],
    ['team-activity','Tích cực tham gia hoạt động tập thể'],
    ['volunteer','Tích cực tham gia hoạt động thiện nguyện, chia sẻ'],
    ['save-resources','Có ý thức tiết kiệm điện, nước'],
    ['shared-books','Có ý thức giữ gìn sách vở, đồ dùng dùng chung'],
    ['good-idea','Có sáng kiến/cách làm hay trong học tập'],
    ['contest-achievement','Có thành tích trong hội thi, cuộc thi hoặc phong trào'],
    ['commendable-deed','Có việc làm tốt đáng tuyên dương']
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