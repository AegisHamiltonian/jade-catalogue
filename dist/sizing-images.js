// Reference photos supplied by the shop. No automatic size conversion is derived from them.
const shapes = [
  { image:'size-round-bangle', title:'Bản đũa', alt:'Sơ đồ vòng bản đũa, đường kính lòng trong và tiết diện thân vòng', note:'Phân biệt ni lòng trong với đường kính thân vòng (chốt).' },
  { image:'size-flat-bangle', title:'Bản hẹ', alt:'Sơ đồ vòng bản hẹ, đường kính lòng trong, bản và độ dày', note:'Đọc cả ni lòng trong, kích thước bản và độ dày của từng món.' },
  { image:'size-slender-bangle', title:'Đinh đang', alt:'Sơ đồ vòng đinh đang với dáng thân vòng mảnh', note:'Dáng mảnh không có nghĩa là ni nhỏ; vẫn cần xem lòng trong.' },
  { image:'size-oval-bangle', title:'Quý phi / oval', alt:'Sơ đồ vòng quý phi với hai trục lòng trong dài và ngắn', note:'Hỏi cả hai trục lòng trong: dài × ngắn. Không so bằng một con số ni tròn.' },
];

function photo(image, title, alt, note, width=1440, height=1920) {
  const url=`./assets/${image}.webp`;
  return `<figure class="sizing-figure"><a class="sizing-image-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Xem ảnh ${title} kích thước đầy đủ"><img src="${url}" width="${width}" height="${height}" alt="${alt}" loading="lazy" decoding="async"></a><figcaption><strong>${title}</strong><span>${note}</span><a href="${url}" target="_blank" rel="noopener noreferrer">Xem ảnh đầy đủ ↗</a></figcaption></figure>`;
}

export function renderSizingImages() {
  return `<section class="sizing-references" aria-label="Ảnh tham khảo cách đo và dáng vòng">
    <h3>Ảnh tham khảo cho vòng tay</h3>
    <p>Ảnh do cửa hàng cung cấp. Mở từng mục để xem; bấm vào ảnh để đọc bản lớn. Các bảng số trong ảnh là thông tin tham khảo, cần xác nhận lại với Ngọc Nhà Lyn cho từng món.</p>
    <details class="sizing-reference">
      <summary>01 / Cách đo bàn tay & bảng tham khảo</summary>
      <div class="sizing-reference-body">
        <p class="sizing-warning">Bảng theo cổ tay hoặc chiều rộng bàn tay chỉ giúp trao đổi ban đầu. Không tự chốt ni từ chu vi cổ tay; độ linh hoạt bàn tay, dáng và bản vòng cũng ảnh hưởng độ vừa.</p>
        ${photo('size-hand-reference','Đo bàn tay và xem bảng tham khảo','Ảnh hướng dẫn đo chiều rộng và chu vi bàn tay, kèm bảng ni tham khảo','Gửi số đo, ảnh cách đo và dáng vòng bạn muốn chọn để cửa hàng kiểm tra. Chú ý phân biệt cm với mm.',1080,1920)}
      </div>
    </details>
    <details class="sizing-reference">
      <summary>02 / Phân biệt bản đũa, bản hẹ, đinh đang, quý phi</summary>
      <div class="sizing-reference-body">
        <p>Ni vòng là kích thước lòng trong; “chốt” và độ dày là kích thước thân vòng. Những khoảng số được gọi là “tiêu chuẩn” trên ảnh là cách mô tả của nguồn ảnh, không phải quy chuẩn chung hay cam kết đeo vừa.</p>
        <div class="sizing-grid">${shapes.map(s=>photo(s.image,s.title,s.alt,s.note)).join('')}</div>
        <p class="sizing-source">Nguồn được ghi trên các ảnh dáng vòng: @vongveojadea. Giữ nguyên nội dung và dấu nguồn trên ảnh.</p>
      </div>
    </details>
    <details class="sizing-reference">
      <summary>03 / Tham khảo khi đổi giữa các dáng vòng</summary>
      <div class="sizing-reference-body">
        <p class="sizing-warning">Chênh lệch 1–2 ni trong ảnh là ví dụ tham khảo của nguồn, không phải công thức cố định. Khi đổi dáng hoặc bản dày hơn, hãy xác nhận lại kích thước; vòng oval cần cả trục dài và trục ngắn.</p>
        ${photo('size-shape-reference','Gợi ý đổi ni giữa các dáng vòng','Ảnh ví dụ tham khảo thay đổi ni giữa bản đũa, bản hẹ và quý phi','Không áp dụng máy móc cho mọi bàn tay hoặc mọi kích thước bản vòng. Nguồn ghi trên ảnh: @vongveojadea.')}
      </div>
    </details>
  </section>`;
}
