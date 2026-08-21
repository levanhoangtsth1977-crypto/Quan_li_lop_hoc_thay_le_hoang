/* =========================================================
   HỌC TẬP — GIAI ĐOẠN 1 — MASTER V3
   Phạm vi duy nhất: module Học tập / learning-menu.js
   - 6 môn: Toán, Tiếng Việt, Khoa học, Lịch sử và Địa lí, Công nghệ, Đạo đức
   - 20 nhận xét / môn / mức Tốt-Đạt-Chưa đạt
   - Giao diện nhận xét chọn nhanh, lọc theo môn + mức
   - Lưu / tải lại / lọc / sửa / xóa bản ghi
   - Không thay đổi cấu trúc Google Sheets hiện hữu
   - Ưu tiên API học tập nếu hệ thống đã có; fallback localStorage để dữ liệu không mất khi tải lại
   ========================================================= */
(function () {
  'use strict';
  if (window.__LH_LEARNING_MODULE_V3__) return;
  window.__LH_LEARNING_MODULE_V3__ = true;

  const SUBJECTS = ['Toán','Tiếng Việt','Khoa học','Lịch sử và Địa lí','Công nghệ','Đạo đức'];
  const LEVELS = ['Tốt','Đạt','Chưa đạt'];
  const STORAGE_KEY = 'LH_LEARNING_PHASE1_RECORDS_V3';
  const SUBJECT_ICONS = {
    'Toán':'fa-calculator','Tiếng Việt':'fa-book','Khoa học':'fa-flask',
    'Lịch sử và Địa lí':'fa-earth-asia','Công nghệ':'fa-screwdriver-wrench','Đạo đức':'fa-heart'
  };

  /* 20 câu / môn / mức. Nội dung được viết ngắn, tích cực, dùng trực tiếp cho lớp 5. */
  const COMMENTS = {
    'Toán': {
      'Tốt': [
        'Nắm chắc kiến thức, thực hiện tốt các phép tính và bài toán đã học.',
        'Tính toán chính xác, trình bày bài giải rõ ràng, khoa học.',
        'Vận dụng tốt kiến thức toán học để giải quyết các bài toán.',
        'Phân tích đề tốt và lựa chọn được cách giải phù hợp.',
        'Thực hiện tốt các dạng bài và biết kiểm tra kết quả.',
        'Có tư duy toán học tốt, chủ động tìm cách giải hợp lí.',
        'Hoàn thành tốt yêu cầu học tập và có tiến bộ rõ rệt.',
        'Biết vận dụng linh hoạt kiến thức vào các tình huống thực tế.',
        'Trình bày bài làm sạch sẽ, logic và có tính thuyết phục.',
        'Có khả năng suy luận tốt và giải quyết vấn đề hiệu quả.',
        'Chủ động học tập, tích cực trao đổi khi giải quyết nhiệm vụ.',
        'Nắm vững các dạng toán và vận dụng khá linh hoạt.',
        'Biết phát hiện lỗi và tự điều chỉnh cách làm.',
        'Có tiến bộ tốt về tính chính xác và tốc độ làm bài.',
        'Biết lựa chọn phương pháp giải phù hợp với từng dạng toán.',
        'Thực hiện nhiệm vụ đầy đủ, nghiêm túc và có chất lượng.',
        'Có khả năng vận dụng kiến thức để giải quyết vấn đề mới.',
        'Tự tin trình bày cách làm và giải thích được kết quả.',
        'Có ý thức kiểm tra, đối chiếu và hoàn thiện bài làm.',
        'Duy trì tốt tinh thần học tập và khả năng vận dụng toán học.'
      ],
      'Đạt': [
        'Nắm được kiến thức cơ bản và hoàn thành các bài tập được giao.',
        'Thực hiện được các phép tính và bài toán theo yêu cầu.',
        'Biết vận dụng kiến thức đã học vào giải một số bài toán.',
        'Cơ bản biết phân tích đề và lựa chọn cách giải.',
        'Hoàn thành phần lớn yêu cầu, cần chú ý hơn khi tính toán.',
        'Có tiến bộ trong thực hiện bài tập và trình bày bài giải.',
        'Đáp ứng yêu cầu cơ bản, cần rèn thêm kĩ năng vận dụng.',
        'Biết thực hiện các bước giải theo hướng dẫn.',
        'Nắm được cách làm các dạng toán cơ bản đã học.',
        'Có ý thức kiểm tra bài và sửa lỗi khi được hướng dẫn.',
        'Hoàn thành nhiệm vụ học tập với mức độ phù hợp.',
        'Biết sử dụng kiến thức đã học trong các bài tập quen thuộc.',
        'Có tiến bộ về kĩ năng tính toán và trình bày.',
        'Biết đọc đề và xác định được yêu cầu chính của bài.',
        'Thực hiện được bài toán cơ bản, cần mạnh dạn hơn khi vận dụng.',
        'Có cố gắng trong học tập và hoàn thành nhiệm vụ được giao.',
        'Biết làm theo quy trình giải và trình bày tương đối rõ.',
        'Nắm được những nội dung trọng tâm của bài học.',
        'Có ý thức rèn luyện và sửa những lỗi còn mắc phải.',
        'Đang hình thành tốt kĩ năng vận dụng kiến thức toán học.'
      ],
      'Chưa đạt': [
        'Chưa nắm chắc một số kiến thức, cần tăng cường luyện tập.',
        'Còn nhầm lẫn khi thực hiện phép tính, cần kiểm tra bài kĩ hơn.',
        'Gặp khó khăn khi phân tích đề và lựa chọn cách giải.',
        'Cần rèn thêm kĩ năng tính toán và trình bày bài giải.',
        'Chưa vận dụng tốt kiến thức vào giải quyết bài toán.',
        'Cần chủ động luyện tập và củng cố kiến thức thường xuyên.',
        'Còn lúng túng với các dạng toán mới, cần được hướng dẫn thêm.',
        'Cần rèn kĩ năng đọc hiểu đề trước khi thực hiện bài.',
        'Một số phép tính còn thiếu chính xác, cần kiểm tra lại kết quả.',
        'Cần luyện tập thêm các dạng toán cơ bản đã học.',
        'Chưa trình bày rõ các bước giải, cần thực hiện theo quy trình.',
        'Cần mạnh dạn trao đổi khi chưa hiểu yêu cầu bài toán.',
        'Khả năng vận dụng kiến thức còn hạn chế, cần luyện tập thường xuyên.',
        'Cần chú ý hơn khi đọc đề và xác định dữ kiện.',
        'Một số kiến thức nền chưa vững, cần củng cố từng bước.',
        'Cần rèn thói quen kiểm tra và sửa lỗi sau khi làm bài.',
        'Tiến độ làm bài còn chậm, cần luyện tập thêm.',
        'Cần được hỗ trợ thêm khi giải quyết bài toán có nhiều bước.',
        'Chưa tự tin khi trình bày cách giải, cần luyện tập thường xuyên.',
        'Cần duy trì việc ôn tập hằng ngày để củng cố kiến thức.'
      ]
    },
    'Tiếng Việt': {
      'Tốt': [
        'Đọc rõ ràng, lưu loát và biết thể hiện giọng đọc phù hợp.',
        'Nắm tốt nội dung bài đọc và trả lời câu hỏi chính xác.',
        'Viết bài mạch lạc, dùng từ phù hợp, diễn đạt tự nhiên.',
        'Có vốn từ phong phú và biết sử dụng từ ngữ phù hợp.',
        'Viết câu đúng ngữ pháp, trình bày bài sạch đẹp.',
        'Biết xây dựng bài viết có bố cục rõ ràng và nội dung phù hợp.',
        'Chủ động phát biểu, trao đổi và vận dụng tốt kiến thức tiếng Việt.',
        'Biết lựa chọn từ ngữ giàu hình ảnh và diễn đạt sinh động.',
        'Có khả năng đọc hiểu tốt và biết suy luận từ văn bản.',
        'Bài viết có ý tưởng rõ, bố cục hợp lí và diễn đạt tốt.',
        'Biết sử dụng hình ảnh, từ ngữ phù hợp để làm bài viết hấp dẫn.',
        'Có tiến bộ rõ rệt về đọc, viết và trình bày.',
        'Biết phát hiện và sửa lỗi dùng từ, đặt câu.',
        'Trình bày ý kiến rõ ràng, tự tin và có lí lẽ phù hợp.',
        'Có khả năng tóm tắt và nêu được ý chính của văn bản.',
        'Chủ động đọc sách và tích cực mở rộng vốn từ.',
        'Biết vận dụng kiến thức tiếng Việt vào giao tiếp và viết.',
        'Có ý thức giữ gìn sự trong sáng của tiếng Việt.',
        'Hoàn thành tốt nhiệm vụ đọc, viết và luyện từ câu.',
        'Duy trì tốt hứng thú học tập và khả năng diễn đạt bằng tiếng Việt.'
      ],
      'Đạt': [
        'Đọc đúng và nắm được nội dung cơ bản của bài đọc.',
        'Trả lời được các câu hỏi liên quan đến nội dung bài.',
        'Viết được đoạn văn, bài văn theo yêu cầu.',
        'Biết sử dụng từ ngữ và đặt câu phù hợp với yêu cầu.',
        'Nắm được những kiến thức tiếng Việt cơ bản đã học.',
        'Bài viết cơ bản rõ ý, cần chú ý hơn cách diễn đạt.',
        'Có tiến bộ trong đọc, viết và trình bày bài.',
        'Biết tìm thông tin chính trong văn bản theo hướng dẫn.',
        'Viết được câu và đoạn văn đúng yêu cầu cơ bản.',
        'Biết sắp xếp ý trước khi viết khi có hướng dẫn.',
        'Có ý thức sửa lỗi chính tả và dùng từ.',
        'Hoàn thành các nhiệm vụ đọc hiểu và viết theo yêu cầu.',
        'Biết trao đổi ý kiến về nội dung bài học.',
        'Nắm được một số kiến thức trọng tâm về từ và câu.',
        'Có tiến bộ trong cách diễn đạt và trình bày.',
        'Biết sử dụng từ ngữ phù hợp trong những tình huống quen thuộc.',
        'Đọc tương đối rõ và biết ngắt nghỉ theo hướng dẫn.',
        'Viết được bài có nội dung phù hợp với đề bài.',
        'Có cố gắng trong học tập và hoàn thành nhiệm vụ được giao.',
        'Đang hình thành tốt kĩ năng đọc hiểu và diễn đạt.'
      ],
      'Chưa đạt': [
        'Đọc còn chậm, cần luyện đọc thường xuyên để tăng độ lưu loát.',
        'Chưa nắm chắc nội dung bài đọc, cần chú ý khi tìm thông tin.',
        'Diễn đạt còn hạn chế, cần rèn cách dùng từ và đặt câu.',
        'Bài viết còn thiếu ý, cần lập dàn ý trước khi viết.',
        'Còn mắc lỗi chính tả, cần chú ý kiểm tra bài viết.',
        'Cần tích cực đọc sách và luyện viết để nâng cao kĩ năng.',
        'Cần rèn thêm kĩ năng đọc hiểu và xác định ý chính.',
        'Việc sử dụng từ ngữ còn chưa phù hợp trong một số câu.',
        'Câu văn còn đơn giản, cần luyện cách diễn đạt rõ ý.',
        'Cần chú ý hơn đến bố cục và trình tự khi viết.',
        'Còn lúng túng khi trả lời câu hỏi đọc hiểu.',
        'Cần rèn thêm kĩ năng chính tả và trình bày.',
        'Chưa mạnh dạn trình bày ý kiến trước lớp.',
        'Cần mở rộng vốn từ thông qua đọc sách và luyện tập.',
        'Chưa biết chọn chi tiết phù hợp để phát triển bài viết.',
        'Cần kiểm tra lại bài viết để hạn chế lỗi.',
        'Khả năng diễn đạt còn hạn chế, cần luyện tập thường xuyên.',
        'Cần được hướng dẫn thêm khi xây dựng đoạn văn.',
        'Đọc hiểu chưa ổn định, cần luyện tập theo từng bước.',
        'Cần duy trì thói quen đọc và viết hằng ngày.'
      ]
    },
    'Khoa học': {
      'Tốt': [
        'Nắm chắc kiến thức khoa học và giải thích được các hiện tượng quen thuộc.',
        'Biết quan sát, đặt câu hỏi và đưa ra dự đoán phù hợp.',
        'Vận dụng tốt kiến thức khoa học vào thực tiễn cuộc sống.',
        'Thực hiện tốt các hoạt động khám phá và thí nghiệm.',
        'Biết thu thập, xử lí và trình bày thông tin khoa học.',
        'Chủ động trao đổi, hợp tác và chia sẻ kết quả học tập.',
        'Có ý thức vận dụng kiến thức để bảo vệ sức khỏe và môi trường.',
        'Biết nêu bằng chứng và giải thích kết quả quan sát hợp lí.',
        'Có khả năng liên hệ kiến thức khoa học với thực tế.',
        'Thực hành cẩn thận, tuân thủ tốt các yêu cầu an toàn.',
        'Chủ động đặt câu hỏi và tìm cách giải thích hiện tượng.',
        'Biết trình bày kết quả tìm hiểu khoa học rõ ràng.',
        'Có tiến bộ tốt về kĩ năng quan sát và thực hành.',
        'Biết phân tích thông tin và rút ra kết luận phù hợp.',
        'Tích cực hợp tác trong các hoạt động khám phá.',
        'Có ý thức chăm sóc sức khỏe và bảo vệ môi trường.',
        'Biết vận dụng kiến thức để giải quyết tình huống thực tế.',
        'Chủ động tìm hiểu thêm những vấn đề khoa học gần gũi.',
        'Hoàn thành tốt các nhiệm vụ thực hành và khám phá.',
        'Duy trì tốt tinh thần học hỏi và tư duy khoa học.'
      ],
      'Đạt': [
        'Nắm được các kiến thức khoa học cơ bản đã học.',
        'Nhận biết và giải thích được một số hiện tượng quen thuộc.',
        'Thực hiện được các hoạt động tìm hiểu khoa học theo hướng dẫn.',
        'Biết quan sát và trình bày kết quả tìm hiểu.',
        'Biết liên hệ một số kiến thức khoa học với thực tế.',
        'Hoàn thành các nhiệm vụ học tập được giao.',
        'Có tiến bộ trong quan sát, thực hành và trao đổi ý kiến.',
        'Biết sử dụng thông tin đã học để trả lời câu hỏi cơ bản.',
        'Thực hiện được các bước khám phá theo hướng dẫn.',
        'Biết ghi lại và trình bày kết quả quan sát.',
        'Có ý thức tuân thủ quy tắc an toàn khi thực hành.',
        'Biết hợp tác với bạn trong hoạt động nhóm.',
        'Hoàn thành phần lớn yêu cầu của bài học.',
        'Biết liên hệ kiến thức với một số tình huống quen thuộc.',
        'Có cố gắng trong các hoạt động thực hành.',
        'Nắm được nội dung trọng tâm và đang hình thành kĩ năng khoa học.',
        'Biết đặt câu hỏi khi được gợi ý.',
        'Có tiến bộ trong trình bày kết quả tìm hiểu.',
        'Biết quan sát và mô tả những gì đã phát hiện.',
        'Có ý thức học tập và hoàn thành nhiệm vụ được giao.'
      ],
      'Chưa đạt': [
        'Chưa nắm chắc một số kiến thức, cần ôn tập thường xuyên.',
        'Cần tích cực quan sát và tham gia các hoạt động khám phá.',
        'Gặp khó khăn khi giải thích một số hiện tượng khoa học.',
        'Cần rèn kĩ năng thu thập và trình bày thông tin.',
        'Chưa biết vận dụng tốt kiến thức vào những tình huống thực tế.',
        'Cần chủ động học tập và thực hành để củng cố kiến thức.',
        'Còn lúng túng khi thực hiện các bước khám phá khoa học.',
        'Cần chú ý hơn khi quan sát và ghi lại kết quả.',
        'Chưa biết rút ra kết luận từ thông tin đã quan sát.',
        'Cần rèn kĩ năng sử dụng từ ngữ khoa học cơ bản.',
        'Chưa mạnh dạn đặt câu hỏi và trao đổi trong giờ học.',
        'Cần tuân thủ tốt hơn các yêu cầu an toàn khi thực hành.',
        'Khả năng liên hệ kiến thức với thực tế còn hạn chế.',
        'Cần luyện tập thêm cách trình bày kết quả tìm hiểu.',
        'Chưa chủ động tham gia hoạt động nhóm.',
        'Cần được hướng dẫn thêm khi xử lí thông tin khoa học.',
        'Một số kiến thức nền chưa vững, cần củng cố từng bước.',
        'Cần tăng cường thực hành để hình thành kĩ năng.',
        'Chưa tự tin khi giải thích kết quả quan sát.',
        'Cần duy trì việc ôn tập và khám phá khoa học thường xuyên.'
      ]
    },
    'Lịch sử và Địa lí': {
      'Tốt': [
        'Nắm chắc các sự kiện lịch sử và biết sắp xếp theo trình tự.',
        'Hiểu được ý nghĩa của các sự kiện lịch sử đã học.',
        'Xác định tốt vị trí và đặc điểm của các khu vực trên bản đồ.',
        'Biết khai thác thông tin từ bản đồ, lược đồ và tranh ảnh.',
        'Có khả năng liên hệ kiến thức với thực tế địa phương và đất nước.',
        'Chủ động tìm hiểu và trình bày tốt các nội dung lịch sử, địa lí.',
        'Có ý thức trân trọng lịch sử, văn hóa và quê hương, đất nước.',
        'Biết phân tích nguyên nhân và kết quả của các sự kiện tiêu biểu.',
        'Có khả năng khai thác tốt thông tin từ bản đồ và lược đồ.',
        'Biết so sánh các đặc điểm địa lí và rút ra nhận xét.',
        'Trình bày kiến thức lịch sử rõ ràng, có hệ thống.',
        'Chủ động tìm hiểu thêm về quê hương và đất nước.',
        'Có tiến bộ rõ rệt trong ghi nhớ và vận dụng kiến thức.',
        'Biết liên hệ sự kiện lịch sử với những bài học hiện nay.',
        'Có ý thức giữ gìn và phát huy giá trị văn hóa dân tộc.',
        'Biết xác định thông tin quan trọng trong tư liệu lịch sử.',
        'Hoàn thành tốt nhiệm vụ đọc bản đồ, lược đồ và tranh ảnh.',
        'Tích cực trao đổi và bảo vệ ý kiến bằng thông tin phù hợp.',
        'Biết vận dụng kiến thức để giải thích một số vấn đề thực tế.',
        'Duy trì tốt hứng thú tìm hiểu lịch sử và địa lí.'
      ],
      'Đạt': [
        'Nhớ được những sự kiện và nhân vật lịch sử cơ bản.',
        'Hiểu được nội dung chính của các bài học lịch sử.',
        'Nhận biết được một số đặc điểm địa lí của Việt Nam.',
        'Đọc và khai thác được thông tin cơ bản từ bản đồ.',
        'Biết liên hệ một số kiến thức với thực tế cuộc sống.',
        'Hoàn thành các nhiệm vụ học tập theo yêu cầu.',
        'Có tiến bộ trong ghi nhớ và trình bày kiến thức.',
        'Biết xác định một số thông tin quan trọng trong bài học.',
        'Nhận biết được vị trí của một số địa danh trên bản đồ.',
        'Biết trình bày các sự kiện theo trình tự cơ bản.',
        'Có thể nêu được đặc điểm chính của một khu vực địa lí.',
        'Biết khai thác thông tin từ tranh ảnh và lược đồ khi được hướng dẫn.',
        'Có ý thức tìm hiểu lịch sử và địa lí quê hương.',
        'Hoàn thành phần lớn yêu cầu của bài học.',
        'Biết liên hệ kiến thức với những tình huống quen thuộc.',
        'Có tiến bộ trong cách ghi nhớ và trình bày.',
        'Biết sử dụng bản đồ ở mức độ cơ bản.',
        'Có cố gắng trong học tập và hoàn thành nhiệm vụ.',
        'Nắm được những nội dung trọng tâm của bài học.',
        'Đang hình thành tốt kĩ năng tìm hiểu lịch sử và địa lí.'
      ],
      'Chưa đạt': [
        'Chưa nhớ chắc một số sự kiện, nhân vật lịch sử đã học.',
        'Cần rèn kĩ năng xác định vị trí và khai thác bản đồ.',
        'Gặp khó khăn khi trình bày nguyên nhân và ý nghĩa sự kiện.',
        'Chưa biết liên hệ tốt kiến thức địa lí với thực tế.',
        'Cần hệ thống hóa kiến thức để ghi nhớ lâu hơn.',
        'Cần tích cực đọc tài liệu và tham gia hoạt động học tập.',
        'Còn nhầm lẫn về trình tự của một số sự kiện lịch sử.',
        'Cần luyện kĩ năng đọc chú giải và xác định thông tin trên bản đồ.',
        'Chưa nắm chắc đặc điểm của một số vùng và địa danh.',
        'Cần rèn cách trình bày nguyên nhân, diễn biến và kết quả sự kiện.',
        'Chưa biết chọn thông tin quan trọng từ tư liệu.',
        'Cần tích cực quan sát bản đồ, tranh ảnh và lược đồ.',
        'Khả năng liên hệ kiến thức với thực tế còn hạn chế.',
        'Cần được hướng dẫn thêm khi so sánh các đặc điểm địa lí.',
        'Chưa tự tin khi trình bày kiến thức trước lớp.',
        'Cần củng cố kiến thức nền theo từng chủ đề.',
        'Ghi nhớ kiến thức chưa ổn định, cần ôn tập thường xuyên.',
        'Cần rèn kĩ năng đọc hiểu tư liệu lịch sử và địa lí.',
        'Chưa chủ động tham gia trao đổi về nội dung bài học.',
        'Cần duy trì việc ôn tập và tìm hiểu lịch sử, địa lí thường xuyên.'
      ]
    },
    'Công nghệ': {
      'Tốt': [
        'Nắm tốt kiến thức công nghệ và biết vận dụng vào thực tế.',
        'Thực hiện đúng quy trình và sử dụng dụng cụ an toàn.',
        'Có kĩ năng thực hành tốt, cẩn thận và chính xác.',
        'Chủ động tìm hiểu cách sử dụng các sản phẩm công nghệ.',
        'Biết lựa chọn và sử dụng sản phẩm công nghệ phù hợp.',
        'Có ý thức giữ gìn dụng cụ và bảo đảm an toàn khi thực hành.',
        'Hoàn thành tốt nhiệm vụ thực hành và biết chia sẻ kết quả.',
        'Biết lập kế hoạch và thực hiện nhiệm vụ công nghệ theo quy trình.',
        'Có khả năng phát hiện và khắc phục một số lỗi đơn giản.',
        'Thực hành khéo léo, chính xác và có ý thức tiết kiệm vật liệu.',
        'Biết vận dụng kiến thức công nghệ để giải quyết vấn đề thực tế.',
        'Chủ động tìm hiểu cách sử dụng sản phẩm an toàn và hiệu quả.',
        'Có tiến bộ tốt về kĩ năng thực hành và thiết kế.',
        'Biết đánh giá sản phẩm theo những tiêu chí phù hợp.',
        'Có ý thức bảo quản dụng cụ và giữ gìn môi trường học tập.',
        'Tích cực hợp tác khi thực hiện nhiệm vụ thực hành.',
        'Biết trình bày quy trình và kết quả thực hành rõ ràng.',
        'Có khả năng lựa chọn giải pháp phù hợp với nhiệm vụ.',
        'Hoàn thành tốt nhiệm vụ và thể hiện tinh thần trách nhiệm.',
        'Duy trì tốt sự cẩn thận, sáng tạo và an toàn khi thực hành.'
      ],
      'Đạt': [
        'Nắm được những kiến thức công nghệ cơ bản đã học.',
        'Thực hiện được các thao tác theo hướng dẫn.',
        'Biết sử dụng một số sản phẩm công nghệ phù hợp.',
        'Có ý thức giữ gìn dụng cụ và bảo đảm an toàn.',
        'Hoàn thành được nhiệm vụ thực hành theo yêu cầu.',
        'Biết vận dụng một số kiến thức vào cuộc sống.',
        'Có tiến bộ trong kĩ năng thực hành và sử dụng dụng cụ.',
        'Biết thực hiện các bước công việc theo quy trình.',
        'Có ý thức tiết kiệm và bảo quản vật liệu.',
        'Biết hợp tác với bạn trong hoạt động thực hành.',
        'Hoàn thành phần lớn yêu cầu của nhiệm vụ.',
        'Biết sử dụng dụng cụ đúng mục đích khi được hướng dẫn.',
        'Có cố gắng trong thực hành và hoàn thành sản phẩm.',
        'Biết nhận xét sản phẩm ở mức độ cơ bản.',
        'Có ý thức tuân thủ quy tắc an toàn.',
        'Biết liên hệ một số kiến thức công nghệ với cuộc sống.',
        'Có tiến bộ về sự khéo léo và chính xác khi thao tác.',
        'Biết trình bày kết quả thực hành theo hướng dẫn.',
        'Có tinh thần trách nhiệm với nhiệm vụ được giao.',
        'Đang hình thành tốt kĩ năng thực hành và sử dụng công nghệ.'
      ],
      'Chưa đạt': [
        'Chưa nắm chắc một số kiến thức công nghệ, cần ôn tập thêm.',
        'Thao tác thực hành còn chậm, cần luyện tập theo quy trình.',
        'Cần chú ý hơn đến quy tắc an toàn khi thực hành.',
        'Chưa vận dụng tốt kiến thức công nghệ vào thực tế.',
        'Cần chủ động hơn trong các hoạt động thực hành.',
        'Cần rèn thêm kĩ năng sử dụng và bảo quản dụng cụ.',
        'Còn lúng túng khi thực hiện các bước theo quy trình.',
        'Cần được hướng dẫn thêm để sử dụng dụng cụ đúng cách.',
        'Chưa chú ý đầy đủ đến yêu cầu an toàn khi thực hành.',
        'Kĩ năng thao tác còn hạn chế, cần luyện tập thường xuyên.',
        'Cần rèn thói quen kiểm tra sản phẩm sau khi hoàn thành.',
        'Chưa biết lựa chọn dụng cụ phù hợp với nhiệm vụ.',
        'Cần chú ý hơn đến việc giữ gìn và bảo quản vật liệu.',
        'Chưa tự tin khi thực hiện nhiệm vụ thực hành.',
        'Cần tích cực hợp tác và trao đổi trong hoạt động nhóm.',
        'Chưa biết vận dụng kiến thức công nghệ vào tình huống thực tế.',
        'Cần rèn thêm sự cẩn thận và chính xác khi thao tác.',
        'Chưa hoàn thành đầy đủ yêu cầu của sản phẩm thực hành.',
        'Cần được hỗ trợ thêm khi thực hiện nhiệm vụ mới.',
        'Cần duy trì luyện tập thường xuyên để hình thành kĩ năng.'
      ]
    },
    'Đạo đức': {
      'Tốt': [
        'Biết thực hiện tốt những việc làm phù hợp với chuẩn mực đạo đức.',
        'Có ý thức trách nhiệm với bản thân, gia đình, thầy cô và bạn bè.',
        'Biết tôn trọng, yêu thương và giúp đỡ mọi người xung quanh.',
        'Có ý thức giữ gìn nội quy và thực hiện tốt trách nhiệm của mình.',
        'Biết phân biệt việc làm đúng, việc làm chưa đúng và lựa chọn phù hợp.',
        'Chủ động vận dụng những điều đã học vào các tình huống thực tế.',
        'Có tiến bộ tốt trong nhận thức và thực hành các chuẩn mực đạo đức.',
        'Biết ứng xử lịch sự, tôn trọng và phù hợp với mọi người.',
        'Có tinh thần trách nhiệm, biết giữ lời hứa và thực hiện cam kết.',
        'Biết hợp tác, chia sẻ và hỗ trợ bạn bè trong học tập.',
        'Có ý thức bảo vệ của công và giữ gìn môi trường chung.',
        'Biết tự nhận xét và điều chỉnh hành vi phù hợp.',
        'Chủ động thực hiện những việc tốt trong gia đình và nhà trường.',
        'Biết giải quyết tình huống đạo đức bằng cách lựa chọn phù hợp.',
        'Có ý thức tôn trọng sự khác biệt và quyền của người khác.',
        'Thực hiện tốt nội quy, quy định và trách nhiệm của học sinh.',
        'Biết quan tâm, chia sẻ với những người gặp khó khăn.',
        'Có khả năng liên hệ bài học đạo đức với hành vi hằng ngày.',
        'Tích cực nêu ý kiến và bảo vệ điều đúng bằng cách phù hợp.',
        'Duy trì tốt phẩm chất trách nhiệm, nhân ái và trung thực.'
      ],
      'Đạt': [
        'Nhận biết được những hành vi phù hợp với chuẩn mực đạo đức.',
        'Biết thực hiện những việc làm phù hợp với bản thân và tập thể.',
        'Biết tôn trọng và giữ gìn mối quan hệ với mọi người.',
        'Có ý thức thực hiện nội quy của lớp và trường.',
        'Biết phân biệt một số hành vi đúng và chưa đúng.',
        'Biết thể hiện sự quan tâm, chia sẻ với bạn bè.',
        'Có tiến bộ trong thực hiện trách nhiệm của học sinh.',
        'Biết giữ gìn đồ dùng cá nhân và tài sản chung.',
        'Có ý thức nói lời phù hợp và cư xử lịch sự.',
        'Biết hợp tác với bạn trong các hoạt động chung.',
        'Có cố gắng vận dụng bài học vào tình huống quen thuộc.',
        'Biết nhận lỗi và sửa lỗi khi được nhắc nhở.',
        'Thực hiện được những việc tốt phù hợp với khả năng.',
        'Biết tôn trọng ý kiến của người khác.',
        'Có ý thức giữ gìn môi trường lớp học và trường học.',
        'Hoàn thành nhiệm vụ được giao với tinh thần trách nhiệm.',
        'Biết lựa chọn cách ứng xử phù hợp trong những tình huống quen thuộc.',
        'Có tiến bộ trong giao tiếp và hợp tác với bạn bè.',
        'Nắm được những nội dung cơ bản của bài học đạo đức.',
        'Đang hình thành tốt thói quen ứng xử văn minh, trách nhiệm.'
      ],
      'Chưa đạt': [
        'Chưa thực hiện ổn định những hành vi phù hợp với chuẩn mực đạo đức.',
        'Cần chú ý hơn khi thực hiện nội quy của lớp và trường.',
        'Cần rèn thói quen tôn trọng, lắng nghe và chia sẻ với bạn.',
        'Chưa nhận biết đầy đủ một số hành vi đúng và chưa đúng.',
        'Cần chủ động hơn trong việc thực hiện trách nhiệm của mình.',
        'Cần rèn cách ứng xử lịch sự và phù hợp với mọi người.',
        'Chưa biết vận dụng tốt bài học vào một số tình huống thực tế.',
        'Cần chú ý giữ gìn tài sản cá nhân và tài sản chung.',
        'Cần rèn thói quen nhận lỗi và sửa lỗi khi mắc sai sót.',
        'Chưa chủ động hợp tác và chia sẻ trong hoạt động chung.',
        'Cần được hướng dẫn thêm khi giải quyết tình huống đạo đức.',
        'Cần tích cực tham gia hoạt động tập thể để rèn kĩ năng.',
        'Chưa duy trì ổn định việc thực hiện nhiệm vụ được giao.',
        'Cần chú ý hơn đến lời nói và cách ứng xử với bạn bè.',
        'Cần rèn ý thức giữ gìn môi trường lớp học và trường học.',
        'Chưa tự tin trình bày cách xử lí tình huống phù hợp.',
        'Cần tăng cường liên hệ bài học với hành vi hằng ngày.',
        'Cần được nhắc nhở để thực hiện trách nhiệm đầy đủ hơn.',
        'Cần rèn tính trung thực, trách nhiệm và tinh thần hợp tác.',
        'Cần duy trì luyện tập các hành vi tốt để hình thành thói quen.'
      ]
    }
  };

  const clean = v => String(v == null ? '' : v).trim().replace(/\s+/g,' ');
  const esc = v => clean(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uid = () => 'HT_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,9);
  const today = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const fmtDate = v => { const s=clean(v); if(!s)return ''; const d=new Date(s); if(!isNaN(d.getTime()))return d.toLocaleDateString('vi-VN'); return s; };

  function getStudents(){
    const a = Array.isArray(window.students) ? window.students : [];
    const b = Array.isArray(window.GOOGLE_SHEETS_STUDENTS) ? window.GOOGLE_SHEETS_STUDENTS : [];
    const list = a.length ? a : b;
    return list.filter(s=>s && clean(s.id) && clean(s.name));
  }

  function loadLocal(){
    try { const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); return Array.isArray(x)?x:[]; }
    catch(e){ return []; }
  }
  function saveLocal(list){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(list)); }catch(e){} }
  let records = loadLocal();
  window.learningRecords = records;

  function normalizeRecord(r){
    return {
      id:clean(r.id)||uid(), studentId:clean(r.studentId), date:clean(r.date)||today(),
      subject:clean(r.subject||r.mon), content:clean(r.content||r.noiDung||r.topic),
      resultType:clean(r.resultType||r.loaiKetQua), result:clean(r.result), level:clean(r.level||r.mucDat),
      comment:clean(r.comment||r.nhanXet), note:clean(r.note||r.ghiChu), createdAt:r.createdAt||new Date().toISOString(), updatedAt:new Date().toISOString()
    };
  }

  function persist(){
    saveLocal(records); window.learningRecords=records;
    if(window.APP_DATA) window.APP_DATA.learning=records;
    window.dispatchEvent(new CustomEvent('learning-data-updated',{detail:records}));
  }

  function remoteSave(rec){
    /* Chỉ dùng API học tập nếu hệ thống hiện tại đã cung cấp; không tự tạo/chạm cấu trúc Sheet. */
    try{
      if(typeof window.saveLearningRecord==='function') return Promise.resolve(window.saveLearningRecord(rec));
      if(typeof window.saveLearningResult==='function') return Promise.resolve(window.saveLearningResult(rec));
      if(typeof window.saveRecordToGoogleSheets==='function' && window.GOOGLE_LEARNING_API) return Promise.resolve(window.saveRecordToGoogleSheets('HOC_TAP',rec));
    }catch(e){ return Promise.reject(e); }
    return Promise.resolve(null);
  }

  function remoteDelete(rec){
    try{
      if(typeof window.deleteLearningRecord==='function') return Promise.resolve(window.deleteLearningRecord(rec.id));
    }catch(e){ return Promise.reject(e); }
    return Promise.resolve(null);
  }

  function injectStyle(){
    if(document.getElementById('lh-learning-v3-style'))return;
    const s=document.createElement('style'); s.id='lh-learning-v3-style'; s.textContent=`
      #page-learning .lh-learn-wrap{display:grid;gap:18px}
      #page-learning .lh-learn-panel{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;box-shadow:0 5px 20px rgba(15,23,42,.05)}
      #page-learning .lh-learn-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      #page-learning .lh-field{display:flex;flex-direction:column;gap:7px}
      #page-learning .lh-field.full{grid-column:1/-1}
      #page-learning .lh-field label{font-size:13px;font-weight:700;color:#475569}
      #page-learning .lh-field input,#page-learning .lh-field select,#page-learning .lh-field textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;background:#fff;font:inherit;color:#0f172a}
      #page-learning .lh-field textarea{min-height:92px;resize:vertical}
      #page-learning .lh-levels{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      #page-learning .lh-level{border:1px solid #cbd5e1;border-radius:10px;background:#fff;padding:10px 8px;font-weight:800;cursor:pointer;text-align:center}
      #page-learning .lh-level.active{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}
      #page-learning .lh-comment-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
      #page-learning .lh-comment-tools{display:flex;gap:8px;align-items:center}
      #page-learning .lh-comment-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:310px;overflow:auto;padding-right:3px}
      #page-learning .lh-comment-option{border:1px solid #e2e8f0;background:#f8fafc;border-radius:10px;padding:10px;text-align:left;cursor:pointer;color:#334155;line-height:1.45}
      #page-learning .lh-comment-option:hover,#page-learning .lh-comment-option.active{border-color:#2563eb;background:#eff6ff;color:#1e40af}
      #page-learning .lh-comment-count{font-size:12px;color:#64748b}
      #page-learning .lh-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
      #page-learning .lh-btn{border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}
      #page-learning .lh-btn.primary{background:#2563eb;color:#fff}.lh-btn.secondary{background:#f1f5f9;color:#334155}.lh-btn.danger{background:#fee2e2;color:#991b1b}
      #page-learning .lh-filterbar{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px}
      #page-learning .lh-table-wrap{overflow:auto}.lh-table{width:100%;border-collapse:collapse;min-width:850px}.lh-table th,.lh-table td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}.lh-table th{font-size:12px;color:#64748b;background:#f8fafc}.lh-table td{font-size:13px}.lh-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}.lh-pill.good{background:#dcfce7;color:#166534}.lh-pill.ok{background:#dbeafe;color:#1d4ed8}.lh-pill.bad{background:#fee2e2;color:#991b1b}
      #page-learning .lh-empty{text-align:center;padding:30px;color:#64748b}
      #page-learning .lh-subject-icon{display:inline-flex;width:28px;height:28px;border-radius:8px;align-items:center;justify-content:center;background:#eff6ff;color:#2563eb;margin-right:6px}
      @media(max-width:760px){#page-learning .lh-learn-grid,#page-learning .lh-comment-list,#page-learning .lh-filterbar{grid-template-columns:1fr}.lh-field.full{grid-column:auto}#page-learning .lh-panel{padding:14px}.lh-levels{grid-template-columns:1fr}}
    `; document.head.appendChild(s);
  }

  function section(){ return document.getElementById('page-learning'); }

  function build(){
    const el=section(); if(!el)return;
    injectStyle();
    el.innerHTML=`
      <div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-book-open"></i> Theo dõi học tập</span><h1>Học tập</h1><p>Ghi nhận kết quả học tập và theo dõi sự tiến bộ của từng học sinh.</p></div><div class="page-actions"><button type="button" class="button primary" id="lhLearningNew"><i class="fa-solid fa-plus"></i> Ghi nhận kết quả</button></div></div>
      <div class="lh-learn-wrap">
        <section class="lh-learn-panel" id="lhLearningFormPanel" hidden>
          <div class="section-heading"><div><h2>📝 Ghi nhận kết quả</h2><p>Chọn môn → mức đánh giá → nhận xét phù hợp. Có thể sửa câu trước khi lưu.</p></div></div>
          <div class="lh-learn-grid">
            <div class="lh-field"><label for="lhDate">Ngày</label><input id="lhDate" type="date" value="${today()}"></div>
            <div class="lh-field"><label for="lhStudent">Học sinh</label><select id="lhStudent"><option value="">Chọn học sinh</option></select></div>
            <div class="lh-field"><label for="lhSubject">Môn học</label><select id="lhSubject"><option value="">Chọn môn học</option>${SUBJECTS.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div>
            <div class="lh-field"><label for="lhResultType">Loại kết quả</label><select id="lhResultType"><option value="MUC_DAT">Mức đạt</option><option value="DIEM">Điểm</option></select></div>
            <div class="lh-field" id="lhScoreField"><label for="lhScore">Điểm</label><input id="lhScore" type="number" min="0" max="10" step="0.1" placeholder="0–10"></div>
            <div class="lh-field"><label>Mức đánh giá</label><div class="lh-levels" id="lhLevels">${LEVELS.map(x=>`<button type="button" class="lh-level" data-level="${esc(x)}">${x}</button>`).join('')}</div></div>
            <div class="lh-field full"><label for="lhContent">Nội dung đánh giá</label><input id="lhContent" placeholder="Ví dụ: Bài 1, tuần 2, kiểm tra thường xuyên..."></div>
            <div class="lh-field full">
              <div class="lh-comment-head"><label for="lhComment">Nhận xét</label><div class="lh-comment-tools"><span class="lh-comment-count" id="lhCommentCount">Chọn môn và mức để hiện nhận xét</span><button type="button" class="lh-btn secondary" id="lhShuffleComment">🔄 Đổi gợi ý</button></div></div>
              <div class="lh-comment-list" id="lhCommentList"><div class="lh-empty">Chọn môn và mức đánh giá để xem nhận xét phù hợp.</div></div>
              <textarea id="lhComment" placeholder="Chọn một nhận xét ở trên hoặc nhập nhận xét riêng..."></textarea>
            </div>
            <div class="lh-field full"><label for="lhNote">Ghi chú</label><input id="lhNote" placeholder="Ghi chú thêm nếu cần..."></div>
          </div>
          <div class="lh-actions" style="margin-top:14px"><button type="button" class="lh-btn secondary" id="lhCancel">Hủy</button><button type="button" class="lh-btn primary" id="lhSave">💾 Lưu kết quả</button></div>
        </section>
        <section class="lh-learn-panel">
          <div class="section-heading"><div><h2>Tình hình học tập</h2><p id="lhRecordSummary">0 lượt đánh giá</p></div></div>
          <div class="lh-filterbar"><input id="lhSearch" placeholder="🔎 Tìm học sinh..."><select id="lhFilterSubject"><option value="">Tất cả môn học</option>${SUBJECTS.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select><select id="lhFilterLevel"><option value="">Tất cả mức</option>${LEVELS.map(x=>`<option value="${esc(x)}">${x}</option>`).join('')}</select><select id="lhFilterPeriod"><option value="all">Tất cả thời gian</option><option value="week">Tuần này</option><option value="month">Tháng này</option><option value="semester">Học kỳ</option></select></div>
          <div class="lh-table-wrap"><table class="lh-table"><thead><tr><th>STT</th><th>Ngày</th><th>Học sinh</th><th>Môn</th><th>Nội dung</th><th>Kết quả</th><th>Nhận xét</th><th>Thao tác</th></tr></thead><tbody id="lhRows"></tbody></table></div>
        </section>
      </div>`;
    populateStudents(); bind(); render();
  }

  function populateStudents(){
    const s=document.getElementById('lhStudent'); if(!s)return;
    const old=s.value; const list=getStudents();
    s.innerHTML='<option value="">Chọn học sinh</option>'+list.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
    if(old)s.value=old;
  }

  let selectedLevel=''; let editingId=''; let commentPool=[];
  function bind(){
    const q=id=>document.getElementById(id);
    q('lhLearningNew').onclick=()=>{editingId='';q('lhLearningFormPanel').hidden=false;resetForm();populateStudents();q('lhDate').value=today();q('lhStudent').focus();};
    q('lhCancel').onclick=()=>{q('lhLearningFormPanel').hidden=true;editingId='';};
    q('lhSubject').onchange=refreshComments;
    q('lhResultType').onchange=()=>{q('lhScoreField').style.display=q('lhResultType').value==='DIEM'?'flex':'none';};
    q('lhShuffleComment').onclick=refreshComments;
    q('lhSearch').oninput=render; q('lhFilterSubject').onchange=render; q('lhFilterLevel').onchange=render; q('lhFilterPeriod').onchange=render;
    q('lhSave').onclick=saveForm;
    q('lhLevels').querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{selectedLevel=b.dataset.level;q('lhLevels').querySelectorAll('.lh-level').forEach(x=>x.classList.toggle('active',x===b));refreshComments();});
  }

  function resetForm(){
    const ids=['lhStudent','lhSubject','lhContent','lhScore','lhComment','lhNote']; ids.forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    const rt=document.getElementById('lhResultType');if(rt)rt.value='MUC_DAT';
    selectedLevel=''; editingId='';
    document.querySelectorAll('#lhLevels .lh-level').forEach(x=>x.classList.remove('active'));
    refreshComments();
  }

  function refreshComments(){
    const sub=clean(document.getElementById('lhSubject')?.value), level=selectedLevel;
    const box=document.getElementById('lhCommentList'), count=document.getElementById('lhCommentCount'); if(!box)return;
    commentPool=(COMMENTS[sub]&&COMMENTS[sub][level])?COMMENTS[sub][level].slice():[];
    if(!sub||!level){box.innerHTML='<div class="lh-empty">Chọn môn và mức đánh giá để xem nhận xét phù hợp.</div>';count.textContent='Chưa chọn';return;}
    /* Hiển thị 8 câu mỗi lần, đổi gợi ý sẽ lấy 8 câu khác. */
    const offset=Math.floor(Math.random()*commentPool.length); const show=commentPool.map((_,i)=>commentPool[(offset+i)%commentPool.length]).slice(0,8);
    count.textContent=`${commentPool.length} nhận xét · đang hiện ${show.length} gợi ý`;
    box.innerHTML=show.map(x=>`<button type="button" class="lh-comment-option">${esc(x)}</button>`).join('');
    box.querySelectorAll('.lh-comment-option').forEach(b=>b.onclick=()=>{document.getElementById('lhComment').value=b.textContent;box.querySelectorAll('.lh-comment-option').forEach(x=>x.classList.remove('active'));b.classList.add('active');});
  }

  function periodMatch(date,period){
    if(period==='all')return true; const d=new Date(date); if(isNaN(d.getTime()))return true; const now=new Date();
    if(period==='week'){const n=new Date(now);const day=n.getDay()||7;n.setDate(n.getDate()-day+1);n.setHours(0,0,0,0);return d>=n;}
    if(period==='month')return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
    if(period==='semester')return d.getFullYear()===now.getFullYear()&&(d.getMonth()<=5?d.getMonth()<=5:true);
    return true;
  }

  function filtered(){
    const search=clean(document.getElementById('lhSearch')?.value).toLowerCase(); const sub=clean(document.getElementById('lhFilterSubject')?.value); const lev=clean(document.getElementById('lhFilterLevel')?.value); const per=document.getElementById('lhFilterPeriod')?.value||'all';
    const students=getStudents(); const names=new Map(students.map(s=>[clean(s.id),clean(s.name)]));
    return records.filter(r=>!sub||r.subject===sub).filter(r=>!lev||r.level===lev).filter(r=>periodMatch(r.date,per)).filter(r=>{const n=names.get(r.studentId)||r.studentName||'';return !search||n.toLowerCase().includes(search)||r.comment.toLowerCase().includes(search)||r.content.toLowerCase().includes(search);}).map(r=>Object.assign({},r,{studentName:names.get(r.studentId)||r.studentName||r.studentId})).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }

  function render(){
    const tbody=document.getElementById('lhRows');if(!tbody)return;const list=filtered();
    const summary=document.getElementById('lhRecordSummary');if(summary)summary.textContent=`${list.length} lượt đánh giá · ${records.length} lượt đã lưu`;
    if(!list.length){tbody.innerHTML='<tr><td colspan="8"><div class="lh-empty">Chưa có dữ liệu học tập phù hợp.</div></td></tr>';return;}
    tbody.innerHTML=list.map((r,i)=>{const cls=r.level==='Tốt'?'good':r.level==='Đạt'?'ok':'bad';const result=r.resultType==='DIEM'&&r.result?`Điểm ${esc(r.result)}`:esc(r.level||r.result||'—');return `<tr><td>${i+1}</td><td>${esc(fmtDate(r.date))}</td><td><strong>${esc(r.studentName)}</strong></td><td><span class="lh-subject-icon"><i class="fa-solid ${SUBJECT_ICONS[r.subject]||'fa-book'}"></i></span>${esc(r.subject)}</td><td>${esc(r.content||'—')}</td><td><span class="lh-pill ${cls}">${result}</span></td><td>${esc(r.comment||'—')}${r.note?`<br><small>${esc(r.note)}</small>`:''}</td><td><button type="button" class="lh-btn secondary" data-edit="${esc(r.id)}">Sửa</button> <button type="button" class="lh-btn danger" data-delete="${esc(r.id)}">Xóa</button></td></tr>`;}).join('');
    tbody.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editRecord(b.dataset.edit));
    tbody.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteRecord(b.dataset.delete));
  }

  function editRecord(id){
    const r=records.find(x=>x.id===id);if(!r)return;const panel=document.getElementById('lhLearningFormPanel');panel.hidden=false;editingId=id;
    document.getElementById('lhDate').value=r.date||today();document.getElementById('lhStudent').value=r.studentId;document.getElementById('lhSubject').value=r.subject;document.getElementById('lhResultType').value=r.resultType||'MUC_DAT';document.getElementById('lhContent').value=r.content||'';document.getElementById('lhScore').value=r.resultType==='DIEM'?r.result||'':'';document.getElementById('lhComment').value=r.comment||'';document.getElementById('lhNote').value=r.note||'';
    selectedLevel=r.level||'';document.querySelectorAll('#lhLevels .lh-level').forEach(b=>b.classList.toggle('active',b.dataset.level===selectedLevel));document.getElementById('lhScoreField').style.display=document.getElementById('lhResultType').value==='DIEM'?'flex':'none';refreshComments();panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function saveForm(){
    const q=id=>document.getElementById(id);const studentId=clean(q('lhStudent').value),subject=clean(q('lhSubject').value),comment=clean(q('lhComment').value),date=clean(q('lhDate').value)||today(),type=clean(q('lhResultType').value),score=clean(q('lhScore').value),content=clean(q('lhContent').value),note=clean(q('lhNote').value);
    if(!studentId||!subject||!selectedLevel||!comment){alert('Vui lòng chọn học sinh, môn học, mức đánh giá và nhận xét.');return;}
    if(type==='DIEM'&&(score===''||Number(score)<0||Number(score)>10)){alert('Điểm phải từ 0 đến 10.');return;}
    const old=editingId?records.find(x=>x.id===editingId):null;const rec=normalizeRecord({id:editingId||uid(),studentId,date,subject,content,resultType:type,result:type==='DIEM'?score:selectedLevel,level:selectedLevel,comment,note,createdAt:old?.createdAt||new Date().toISOString()});
    const idx=records.findIndex(x=>x.id===rec.id);if(idx>=0)records[idx]=rec;else records.unshift(rec);persist();
    try{await remoteSave(rec);}catch(e){console.warn('[LH-LEARNING] API học tập không khả dụng, dữ liệu cục bộ vẫn được giữ:',e.message);}
    document.getElementById('lhLearningFormPanel').hidden=true;editingId='';render();
    if(typeof window.showToast==='function')window.showToast('Đã lưu kết quả học tập','success');
  }

  async function deleteRecord(id){
    const r=records.find(x=>x.id===id);if(!r)return;if(!confirm('Xóa lượt đánh giá này?'))return;
    records=records.filter(x=>x.id!==id);persist();try{await remoteDelete(r);}catch(e){console.warn('[LH-LEARNING] Xóa từ API học tập không khả dụng:',e.message);}render();
  }

  function expose(){
    window.renderLearning=render; window.refreshLearning=render; window.openLearningForm=()=>{document.getElementById('lhLearningNew')?.click();};
    window.getLearningRecords=()=>records.slice();
    window.setLearningRecords=list=>{records=(Array.isArray(list)?list:[]).map(normalizeRecord);persist();render();};
    window.LEARNING_PHASE1_API={subjects:SUBJECTS,levels:LEVELS,comments:COMMENTS,getRecords:()=>records.slice(),render,refresh:render};
  }

  function init(){
    build();expose();
    window.addEventListener('google-sheets-data-ready',e=>{const h=e.detail&&e.detail.HOC_TAP;if(Array.isArray(h)&&h.length){records=h.map(normalizeRecord);persist();render();}populateStudents();});
    window.addEventListener('learning-module-ready',render);
    window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){records=loadLocal();window.learningRecords=records;render();}});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();