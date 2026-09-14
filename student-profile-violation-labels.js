/* STUDENT PROFILE VIOLATION LABELS 1.0
 * Chỉ áp dụng cho trang hồ sơ học sinh dùng chung với phụ huynh.
 * Chuyển mã loại vi phạm thành nội dung tiếng Việt rõ ràng.
 * Giữ nguyên dữ liệu gốc trong Google Sheets; chỉ chuẩn hóa bản sao hiển thị.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_PROFILE_VIOLATION_LABELS_10__)return;
  window.__LH_STUDENT_PROFILE_VIOLATION_LABELS_10__=true;

  const isProfile=/\/student-profile\.html(?:$|[?#])/.test(location.pathname);
  if(!isProfile)return;

  const S=v=>String(v??'').trim().replace(/\s+/g,' ');
  const LABELS=Object.freeze({
    'talking-disorder':'Nói chuyện riêng, gây mất trật tự trong lớp học',
    'duty':'Chưa thực hiện nhiệm vụ trực nhật theo phân công',
    'school-supplies':'Quên mang đồ dùng học tập',
    'preparation':'Chưa chuẩn bị bài trước khi đến lớp',
    'assignment':'Chưa hoàn thành bài tập được giao',
    'focus':'Chưa chú ý, tập trung trong giờ học',
    'late-submit':'Đánh nhau với bạn',
    'assigned-task-late':'Chưa hoàn thành phần việc được phân công đúng thời hạn',
    'leave-seat':'Ra khỏi chỗ ngồi khi chưa được phép',
    'change-seat':'Đánh bạn',
    'incomplete-learning-task':'Chưa thực hiện đầy đủ nhiệm vụ học tập trên lớp',
    'passive-learning':'Chưa chủ động tham gia hoạt động học tập',
    'class-rules':'Chưa thực hiện đúng nội quy lớp học',
    'school-rules':'Chưa thực hiện đúng nội quy nhà trường',
    'peer-conduct':'Ứng xử chưa phù hợp với bạn',
    'inappropriate-language':'Sử dụng lời nói chưa phù hợp',
    'cleanliness':'Chưa giữ gìn vệ sinh lớp học, trường học',
    'property':'Chưa giữ gìn, bảo quản đồ dùng và tài sản chung',
    'dangerous-play':'Chơi các trò nguy hiểm, gây mất an toàn',
    'other':'Khác'
  });

  const REMINDERS=Object.freeze({
    'talking-disorder':'Đề nghị phụ huynh nhắc học sinh giữ trật tự, tập trung và không nói chuyện riêng trong giờ học.',
    'duty':'Đề nghị phụ huynh nhắc học sinh thực hiện đầy đủ nhiệm vụ trực nhật theo phân công.',
    'school-supplies':'Đề nghị phụ huynh nhắc học sinh chuẩn bị đầy đủ đồ dùng học tập trước khi đến lớp.',
    'preparation':'Đề nghị phụ huynh nhắc học sinh chuẩn bị bài đầy đủ trước khi đến lớp.',
    'assignment':'Đề nghị phụ huynh nhắc học sinh hoàn thành bài tập được giao đúng yêu cầu.',
    'focus':'Đề nghị phụ huynh nhắc học sinh chú ý, tập trung và hoàn thành nhiệm vụ trong giờ học.',
    'late-submit':'Đề nghị phụ huynh phối hợp nhắc học sinh không đánh nhau, biết kiềm chế cảm xúc và giải quyết mâu thuẫn bằng lời nói phù hợp.',
    'assigned-task-late':'Đề nghị phụ huynh nhắc học sinh hoàn thành phần việc được phân công đúng thời hạn.',
    'leave-seat':'Đề nghị phụ huynh nhắc học sinh chỉ rời chỗ khi được phép hoặc khi có lý do chính đáng.',
    'change-seat':'Đề nghị phụ huynh phối hợp nhắc học sinh không đánh bạn, biết tôn trọng và giải quyết mâu thuẫn an toàn.',
    'incomplete-learning-task':'Đề nghị phụ huynh nhắc học sinh thực hiện đầy đủ các nhiệm vụ học tập trên lớp.',
    'passive-learning':'Đề nghị phụ huynh khuyến khích học sinh chủ động tham gia các hoạt động học tập.',
    'class-rules':'Đề nghị phụ huynh nhắc học sinh thực hiện đúng nội quy lớp học.',
    'school-rules':'Đề nghị phụ huynh nhắc học sinh thực hiện đúng nội quy nhà trường.',
    'peer-conduct':'Đề nghị phụ huynh nhắc học sinh ứng xử lịch sự, tôn trọng và phù hợp với bạn bè.',
    'inappropriate-language':'Đề nghị phụ huynh nhắc học sinh sử dụng lời nói lịch sự, phù hợp với thầy cô và bạn bè.',
    'cleanliness':'Đề nghị phụ huynh nhắc học sinh giữ gìn vệ sinh lớp học và trường học.',
    'property':'Đề nghị phụ huynh nhắc học sinh giữ gìn, bảo quản đồ dùng và tài sản chung.',
    'dangerous-play':'Đề nghị phụ huynh nhắc học sinh không chơi các trò nguy hiểm và luôn thực hiện đúng quy định an toàn.',
    'other':'Đề nghị phụ huynh xem thêm ghi chú của giáo viên để phối hợp nhắc nhở học sinh.'
  });

  const codeOf=r=>S(r?.type||r?.content||r?.noiDung).toLowerCase();
  const labelOf=r=>LABELS[codeOf(r)]||S(r?.type||r?.content||r?.noiDung)||'Ghi nhận vi phạm';
  const reminderOf=r=>{
    const code=codeOf(r);
    const note=S(r?.note);
    if(note)return 'Chi tiết giáo viên ghi nhận: '+note;
    return REMINDERS[code]||('Đề nghị phụ huynh phối hợp nhắc học sinh khắc phục: '+labelOf(r).toLocaleLowerCase('vi')+'.');
  };

  function mapRows(rows){
    return (Array.isArray(rows)?rows:[]).map(r=>({...r,rawType:r?.type,displayType:labelOf(r),displayReminder:reminderOf(r)}));
  }

  function applyData(data){
    if(!data||!Array.isArray(data.VI_PHAM))return data;
    const mapped=mapRows(data.VI_PHAM);
    data.VI_PHAM=mapped.map(r=>({...r,type:r.displayType,action: r.action||r.displayReminder}));
    if(data.tabs&&Array.isArray(data.tabs.VI_PHAM))data.tabs.VI_PHAM=data.VI_PHAM;
    if(Array.isArray(window.violationRecords))window.violationRecords.splice(0,window.violationRecords.length,...data.VI_PHAM);
    return data;
  }

  window.LHProfileViolationLabel=labelOf;
  window.LHProfileViolationReminder=reminderOf;
  window.addEventListener('google-sheets-data-ready',e=>applyData(e?.detail));
})();
