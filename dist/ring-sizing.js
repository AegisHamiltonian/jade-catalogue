// Catalogue ni is inner diameter in mm, never a US/JP/other numbered size.
// Circumference is geometry for a round opening, rounded to 0.1 mm; not a fit guarantee.
export const ringSizeRows = Object.freeze([14,15,16,17,18,18.4,19,20,21].map(diameter => Object.freeze({
  diameter,
  circumference: Math.round(Math.PI * diameter * 10) / 10,
})));

const mm = value => value.toFixed(1).replace('.', ',');

export function renderRingSizingGuide() {
  return `<section class="ring-sizing" aria-label="Hình hướng dẫn đo ni nhẫn">
    <details class="sizing-reference ring-reference">
      <summary>Xem cách đo nhẫn & bảng tra theo mm</summary>
      <div class="sizing-reference-body">
        <article class="ring-method">
          <div class="ring-method-heading"><span>01</span><h4>Đã có nhẫn đeo vừa</h4></div>
          <a class="ring-method-visual" href="./assets/size-ring-diameter.webp" target="_blank" rel="noopener noreferrer" aria-label="Xem hình đo lòng nhẫn kích thước đầy đủ"><img src="./assets/size-ring-diameter.webp" width="1672" height="941" alt="Nhẫn đặt phẳng; mũi tên đo ngang tâm từ mép trong bên trái đến mép trong bên phải, không tính thân nhẫn" loading="lazy" decoding="async"><span>Xem hình lớn ↗</span></a>
          <p>Chọn chiếc nhẫn vừa đúng ngón muốn đeo. Đặt phẳng, dùng thước mm đo ngang qua tâm <strong>từ mép trong đến mép trong</strong>; không tính độ dày thân nhẫn.</p>
          <p class="ring-example">Đo được 18,4 mm → tìm ni nhẫn 18,4 trên catalogue.</p>
        </article>
        <article class="ring-method">
          <div class="ring-method-heading"><span>02</span><h4>Chưa có nhẫn để đối chiếu</h4></div>
          <a class="ring-method-visual" href="./assets/size-ring-finger.webp" target="_blank" rel="noopener noreferrer" aria-label="Xem hình đo ngón tay kích thước đầy đủ"><img src="./assets/size-ring-finger.webp" width="1774" height="887" alt="Quấn dải giấy quanh ngón tay và đánh dấu điểm trùng; sau đó trải giấy phẳng cạnh thước để đo đoạn đã quấn" loading="lazy" decoding="async"><span>Xem hình lớn ↗</span></a>
          <p>Quấn dải giấy không co giãn quanh ngón muốn đeo, vừa sát da, không siết chặt. Đánh dấu điểm trùng, trải phẳng và đo đoạn giấy đã quấn bằng thước mm.</p>
          <p>Đây là <strong>chu vi ngón tay</strong>. Gửi số đo cho Lyn để đối chiếu; đừng nhập chu vi vào ô ni. Nếu khớp ngón lớn hơn gốc ngón, hãy gửi cả hai số đo.</p>
        </article>
        <table class="ring-size-table">
          <caption>Đối chiếu đường kính & chu vi lòng nhẫn tròn</caption>
          <thead><tr><th scope="col">Đường kính trong<br><span>Ni nhẫn trên web · mm</span></th><th scope="col">Chu vi lòng trong<br><span>Xấp xỉ · mm</span></th></tr></thead>
          <tbody>${ringSizeRows.map(({diameter,circumference}) => `<tr${diameter===18.4?' class="ring-size-example"':''}><th scope="row">${mm(diameter)}</th><td>${mm(circumference)}</td></tr>`).join('')}</tbody>
        </table>
        <p class="ring-formula">Chu vi ≈ π × đường kính, làm tròn 0,1 mm. Ví dụ: 18,4 mm tương ứng chu vi lòng trong khoảng 57,8 mm. Bảng này dùng mm, không phải cỡ US hay hệ ni khác.</p>
        <p class="sizing-warning">Đo bằng thước thật, không đo theo hình trên màn hình. Đo lại ở vài thời điểm; bản nhẫn rộng và khớp ngón ảnh hưởng độ vừa. Số đo giấy chỉ giúp ước lượng, cần xác nhận với Lyn trước khi chọn.</p>
        <p class="sizing-source">Tham khảo cách đo ngón tay và lòng nhẫn: <a href="https://www.tiffany.com/size-guide/" target="_blank" rel="noopener noreferrer">Tiffany & Co. ↗</a>. Các giá trị chu vi trong bảng được tính từ đường kính theo công thức trên.</p>
      </div>
    </details>
  </section>`;
}
