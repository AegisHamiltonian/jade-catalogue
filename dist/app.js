import { renderSizingImages } from './sizing-images.js';
import { config } from './config.js';
import { repository, isPreview } from './repository.js';
import { categoryNames, supplyNames, money, escapeHTML as e, safeMedia, filterProducts, groupByBatch, sizeLabel, inquiryText, productURL } from './catalogue.js';
const $ = selector => document.querySelector(selector);
const state = { products:[], saved:[], filters:{category:'',q:'',supply:'',price:'',color:'',texture:'',size:'',sort:'newest',savedOnly:false}, busy:false, modalProduct:null, lastUpdate:0 };
try { const ids=JSON.parse(localStorage.getItem('ngan-giang-saved') || '[]'); if(Array.isArray(ids)) state.saved=ids.filter(x=>typeof x==='string').slice(0,1000); } catch {}
let toastTimer;
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent=message; $('#toast').hidden=false; toastTimer=setTimeout(()=>{$('#toast').hidden=true;},4000); }
function syncSaved() {
  $('#saved-count').textContent=state.saved.length; $('#saved-count').hidden=!state.saved.length;
  $('#saved-toggle').setAttribute('aria-pressed',state.filters.savedOnly);
  document.querySelectorAll('[data-save]').forEach(b=>{ const yes=state.saved.includes(b.dataset.save); b.setAttribute('aria-pressed',yes); b.setAttribute('aria-label',`${yes?'Bỏ lưu':'Lưu'} ${b.dataset.title || 'món ngọc'}`); });
}
function card(p) {
  const saved=state.saved.includes(p.id);
  return `<article class="product-card"><div class="product-photo"><button class="product-open" data-product="${e(p.sku)}" aria-label="Xem ${e(p.title)}, mã ${e(p.sku)}"><img src="${e(safeMedia(p.thumbnail_url))}" width="600" height="600" alt="${e(p.title)}" loading="lazy"></button><span class="badge ${e(p.supply)}"><span class="status-dot"></span>${supplyNames[p.supply] || 'Liên hệ'}</span><button class="save-product icon-button" data-save="${e(p.id)}" data-title="${e(p.title)}" aria-label="${saved?'Bỏ lưu':'Lưu'} ${e(p.title)}" aria-pressed="${saved}"><svg><use href="#i-heart"/></svg></button><span class="photo-hover-label">Ngắm kỹ món ngọc <span>↗</span></span></div><div class="product-info"><div class="product-topline"><span>${e(categoryNames[p.category] || 'Ngọc')}</span><span>${e(p.sku.toUpperCase())}</span></div><h3><button data-product="${e(p.sku)}">${e(p.title)}</button></h3><p class="product-attributes"><span>${e(sizeLabel(p))}</span>${p.jade_texture ? `<span>${e(p.jade_texture)}</span>`:''}</p><div class="product-price"><strong>${money(p.price_vnd)}</strong><button data-product="${e(p.sku)}">Xem chi tiết <span>↗</span></button></div></div></article>`;
}
function render() {
  const products=filterProducts(state.products,{...state.filters,saved:state.saved});
  $('#result-count').textContent=`${products.length} món ngọc${state.filters.savedOnly?' đã lưu':''} · ${isPreview?'Dữ liệu mẫu':'Cập nhật '+new Date(state.lastUpdate).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}`;
  $('#total-products').textContent=state.products.length;
  $('#product-list').setAttribute('aria-busy','false');
  if (!products.length && !state.products.length) $('#product-list').innerHTML=`<div class="empty-state"><h3>Bộ sưu tập đang được cập nhật.</h3><p>Ngọc Nhà Lyn sẽ đăng ảnh và thông tin từng món ngọc tại đây.<br>Bạn có thể vào nhóm Zalo để xem các món hiện có, hoặc gọi hotline để hỏi trực tiếp.</p><a class="button primary" href="${config.zaloGroupUrl}" target="_blank" rel="noopener noreferrer">Vào nhóm Zalo Ngọc Nhà Lyn <svg><use href="#i-arrow-up"/></svg></a></div>`;
  else if (!products.length) $('#product-list').innerHTML=`<div class="empty-state"><h3>${state.filters.savedOnly?'Góc nhỏ dành cho món bạn thương.':'Chưa gặp món ngọc phù hợp.'}</h3><p>${state.filters.savedOnly?'Chạm biểu tượng trái tim trên mỗi món để lưu lại trên thiết bị này.':'Thử đổi ni, màu hoặc khoảng giá để ngắm thêm những lựa chọn khác.'}</p><button class="button primary" data-reset>Xem toàn bộ bộ sưu tập <svg><use href="#i-arrow"/></svg></button></div>`;
  else if (state.filters.sort==='newest') $('#product-list').innerHTML=Object.entries(groupByBatch(products)).map(([date,items])=>`<section class="batch" aria-label="Đợt ngày ${e(date)}"><div class="batch-heading"><span class="small-line"></span><strong>Đợt ngọc ${new Date(date+'T12:00:00+07:00').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}</strong><span class="batch-count">/ ${items.length} món ngọc</span></div><div class="product-grid">${items.map(card).join('')}</div></section>`).join('');
  else $('#product-list').innerHTML=`<div class="product-grid">${products.map(card).join('')}</div>`;
  const active=Object.entries(state.filters).some(([k,v])=>!['sort','category'].includes(k)&&v);
  $('#active-filters').hidden=!active; $('#active-filter-label').textContent=state.filters.savedOnly?'Đang ngắm các món đã lưu':'Đang lọc theo lựa chọn của bạn';
  syncSaved();
}
function populateOptions() {
  for (const [key,id,label] of [['jade_color','color','Màu ngọc'],['jade_texture','texture','Chất ngọc']]) {
    const current=state.filters[id]; const values=[...new Set(state.products.map(p=>p[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
    $('#'+id).innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${e(v)}">${e(v)}</option>`).join('');
    if(values.includes(current)) $('#'+id).value=current; else state.filters[id]='';
  }
  updateSizeOptions();
}
function updateSizeOptions() {
  const cat=state.filters.category;
  $('#size-filter').hidden=!['vong','nhan'].includes(cat);
  const values=[...new Set(state.products.filter(p=>p.category===cat&&p.ni_tay!=null).map(p=>Number(p.ni_tay)))].sort((a,b)=>a-b);
  $('#size').innerHTML='<option value="">Ni tay (mm)</option>'+values.map(v=>`<option value="${v}">${v.toLocaleString('vi-VN')} mm (±0,5)</option>`).join('');
  if(state.filters.size && values.includes(Number(state.filters.size))) $('#size').value=state.filters.size; else state.filters.size='';
}
function syncURL() {
  const u=new URL(location.href); for(const key of ['q','category','supply','price','color','texture','size','sort']) { const value=state.filters[key]; if(value && !(key==='sort'&&value==='newest'))u.searchParams.set(key,value);else u.searchParams.delete(key); } history.replaceState(null,'',u);
}
function resetFilters() {
  state.filters={category:'',q:'',supply:'',price:'',color:'',texture:'',size:'',sort:'newest',savedOnly:false}; $('#filters').reset(); $('#sort').value='newest'; updateSizeOptions(); syncCategories();syncURL();render();
}
function syncCategories() { document.querySelectorAll('[data-category]').forEach(b=>{const active=b.dataset.category===state.filters.category;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);}); }
async function load({quiet=false}={}) {
  if(state.busy)return;state.busy=true;
  try { const products=await repository.list();state.products=products;state.lastUpdate=Date.now();populateOptions();render();$('#connection-notice').hidden=true; }
  catch(err) {
    $('#product-list').setAttribute('aria-busy','false');
    $('#connection-notice').hidden=false;$('#connection-notice').textContent=state.products.length?'Chưa lấy được cập nhật mới. Tình trạng trên màn hình có thể đã thay đổi; vui lòng xác nhận với cửa hàng.':'Không tải được bộ sưu tập. Vui lòng thử lại hoặc xem nhóm Zalo hoặc gọi hotline 0979 628 889.';
    if(!state.products.length){$('#result-count').textContent='Chưa kết nối được dữ liệu';$('#product-list').innerHTML='<div class="empty-state"><h3>Hẹn bạn một chút, ngọc đang về.</h3><p>Không thể lấy dữ liệu cửa hàng lúc này.</p><button class="button primary" data-retry>Thử lại</button></div>';}
    if(!quiet)toast(err.message);
  } finally {state.busy=false;}
}
const materialNames={unknown:'Chưa công bố',jadeite:'Jadeite',nephrite:'Nephrite',other:'Vật liệu khác'};
const treatmentNames={unknown:'Chưa có kết luận công bố',a:'A — tự nhiên / có thể phủ sáp',b:'B — tẩy và ngấm polymer',c:'C — nhuộm màu',bc:'B+C — tẩy, ngấm và nhuộm',other:'Xem phiếu kiểm định'};
function renderDetail(p) {
  state.modalProduct=p;
  const images=[...new Set([p.thumbnail_url,...(p.gallery_urls || [])])].map(safeMedia).filter(Boolean);
  $('#product-detail').innerHTML=`<button class="dialog-close icon-button" data-close="product-dialog" aria-label="Đóng chi tiết"><svg><use href="#i-close"/></svg></button><div class="product-detail-grid"><div class="detail-media"><img class="detail-hero" id="detail-image" src="${e(images[0]||'')}" alt="${e(p.title)}" width="800" height="800">${images.length>1?`<div class="detail-gallery" role="group" aria-label="Thư viện ảnh">${images.map((url,i)=>`<button data-gallery="${e(url)}" aria-label="Xem ảnh ${i+1}"><img src="${e(url)}" alt="Góc ảnh ${i+1}" loading="lazy"></button>`).join('')}</div>`:''}${safeMedia(p.video_url)?`<video src="${e(safeMedia(p.video_url))}" controls preload="none" aria-label="Video sản phẩm ${e(p.sku)}"></video>`:''}<p class="detail-caption">Màu ngọc có thể khác theo ánh sáng và màn hình. Hãy hỏi thêm ảnh/video trước khi chọn.</p></div><div class="detail-copy"><p class="eyebrow">${e(categoryNames[p.category])} / MÃ ${e(p.sku.toUpperCase())}</p><h2 id="detail-title">${e(p.title)}</h2><span class="badge ${e(p.supply)}"><span class="status-dot"></span>${supplyNames[p.supply]}</span><p class="detail-price">${money(p.price_vnd)}</p><dl class="detail-specs"><div><dt>${p.ni_tay===null?'Kích thước':'Đường kính trong'}</dt><dd>${e(sizeLabel(p))}</dd></div>${p.dimensions&&p.ni_tay!==null?`<div><dt>Kích thước bản</dt><dd>${e(p.dimensions)}</dd></div>`:''}<div><dt>Màu ngọc</dt><dd>${e(p.jade_color || 'Chưa công bố')}</dd></div><div><dt>Chất ngọc (tên thương mại)</dt><dd>${e(p.jade_texture || 'Chưa công bố')}</dd></div><div><dt>Vật liệu</dt><dd>${e(materialNames[p.jade_material] || 'Chưa công bố')}</dd></div><div><dt>Thông tin xử lý</dt><dd>${e(treatmentNames[p.treatment] || 'Chưa công bố')}</dd></div>${p.certificate_lab?`<div><dt>Đơn vị kiểm định</dt><dd>${e(p.certificate_lab)}</dd></div>`:''}${p.certificate_number?`<div><dt>Mã phiếu</dt><dd>${e(p.certificate_number)}</dd></div>`:''}</dl>${safeMedia(p.certificate_url)?`<a class="text-link" href="${e(safeMedia(p.certificate_url))}" target="_blank" rel="noopener noreferrer">Xem phiếu kiểm định ↗</a>`:''}<p class="description">${e(p.description || 'Xem thêm trong nhóm Zalo Ngọc Nhà Lyn, hoặc gọi hotline để hỏi riêng về món ngọc này.')}</p><div class="inquiry-box"><strong>Nội dung hỏi món</strong><p id="inquiry-content">${e(inquiryText(p,productURL(p.sku,location.href)))}</p><button data-copy-inquiry>Sao chép nội dung hỏi món</button></div><a class="button primary" href="${config.zaloGroupUrl}" target="_blank" rel="noopener noreferrer">${p.supply==='sold'?'Tìm mẫu tương tự trong nhóm Zalo':p.supply==='order'?'Hỏi đặt mẫu trong nhóm Zalo':'Hỏi món trong nhóm Zalo'} <svg><use href="#i-arrow-up"/></svg></a><p class="detail-note">Sao chép nội dung phía trên rồi dán vào nhóm Zalo để hỏi món. Nếu cần tư vấn trực tiếp, gọi hotline bên dưới. Cửa hàng xác nhận tình trạng trước giao dịch; xem catalogue chưa giữ hàng.</p><div class="detail-links"><a href="tel:+84${config.phone.slice(1)}">Gọi 0979 628 889</a><button data-copy-link>Sao chép liên kết ↗</button></div></div></div>`;
  $('#product-dialog').setAttribute('aria-labelledby','detail-title');
}
let opening=0;
async function openProduct(sku,{updateURL=true,refreshOnly=false}={}) {
  const ticket=++opening;
  if(!$('#product-dialog').open){$('#product-detail').innerHTML='<div class="detail-copy"><p>Đang xem lại tình trạng sản phẩm…</p><button class="text-button" data-close="product-dialog">Đóng</button></div>';$('#product-dialog').showModal();}
  try {
    const p=await repository.get(sku);if(ticket!==opening)return;
    if(!p){$('#product-detail').innerHTML='<div class="detail-copy"><h2>Món ngọc hiện không hiển thị.</h2><p>Cửa hàng có thể đã ẩn hoặc cập nhật sản phẩm.</p><button class="text-button" data-close="product-dialog">Về bộ sưu tập</button></div>';return;}
    if(refreshOnly&&state.modalProduct?.updated_at===p.updated_at)return;
    renderDetail(p);
    if(!refreshOnly){$('#product-dialog').scrollTop=0;$('#product-dialog').querySelector('[data-close]').focus({preventScroll:true});}
    if(updateURL){const u=new URL(location.href);u.searchParams.set('san-pham',sku);history.replaceState(null,'',u);}
  } catch { if(ticket!==opening)return;$('#product-detail').innerHTML=`<div class="detail-copy"><h2>Chưa kiểm tra được tình trạng.</h2><p>Vui lòng thử lại, hỏi trong nhóm Zalo hoặc gọi hotline về mã ${e(sku)}.</p><a class="button primary" href="${config.zaloGroupUrl}" target="_blank" rel="noopener noreferrer">Vào nhóm Zalo ↗</a><button class="text-button" data-close="product-dialog">Đóng</button></div>`; }
}
const guides={
  size:`<p class="eyebrow">GÓC NHỎ CHỌN NGỌC</p><h2>Vừa tay, mới thật <em>an nhiên.</em></h2><h3>Vòng tay: xem đường kính trong</h3><ol><li>Nếu đã có một chiếc vòng cứng đeo vừa, đặt lên mặt phẳng và đo đường kính phía trong, không đo tính cả bản ngọc.</li><li>Đo bằng milimét. Ví dụ: 54 mm được hiển thị là ni 54. Vòng bầu cần hỏi cả hai trục trong và dáng vòng.</li><li>Chưa từng đeo vòng cứng? Nhắn Ngọc Nhà Lyn để được hướng dẫn đo bàn tay và thử ni. Độ rộng bàn tay khi đi qua vòng quan trọng hơn chu vi cổ tay.</li></ol><h3>Nhẫn: đường kính trong khác ni vòng</h3><p>Dùng chiếc nhẫn đang đeo vừa, đo đường kính lòng nhẫn theo mm. Ni 18,4 ở catalogue này nghĩa là đường kính trong 18,4 mm, không phải cỡ US hay một bảng ni khác.</p><div class="callout"><p>Không tự quy đổi chu vi cổ tay thành ni vòng. Bản rộng, dáng vòng và độ linh hoạt bàn tay đều ảnh hưởng độ vừa. Bộ lọc ±0,5 mm chỉ giúp tìm mẫu gần ni, không đảm bảo đeo vừa.</p></div><p class="source-note">Tham khảo nguyên tắc đo đường kính trong của <a href="https://www.mkjadejewelry.com/pages/bangle-size-info" target="_blank" rel="noopener noreferrer">Mason-Kay</a>. Luôn xác nhận ni với cửa hàng trước khi giao dịch.</p>${renderSizingImages()}`,
  jade:`<p class="eyebrow">HIỂU CHẤT NGỌC</p><h2>Không chỉ là <em>một màu xanh.</em></h2><p>“Jade” là tên gọi dùng cho jadeite và nephrite. Trong giao dịch, tên “cẩm thạch”, “phỉ thúy” cần đi cùng thông tin vật liệu cụ thể, thay vì chỉ dựa vào tên bán hàng.</p><h3>Màu sắc · Độ trong · Kết cấu</h3><p>Đây là ba yếu tố quan trọng khi quan sát jadeite. Các tên như “nếp mịn”, “nếp băng” là cách mô tả thương mại; chúng không tự chứng minh vật liệu hay tình trạng xử lý.</p><h3>Hiểu thông tin xử lý A / B / C</h3><p>A thường chỉ jadeite tự nhiên hoặc chỉ đánh bóng bằng sáp. B đã tẩy và ngấm polymer; C đã nhuộm màu. B+C kết hợp các xử lý này. Những ký hiệu này không phải thang điểm đẹp hoặc giá trị.</p><div class="callout"><p>Ảnh, màu sắc hay tên thương mại không thay thế kiểm định. Khi cần xác thực, hãy xem phiếu có đơn vị, mã nhận diện và kết luận gắn với chính món ngọc bạn chọn.</p></div><p class="source-note">Nguồn: <a href="https://www.gia.edu/jade" target="_blank" rel="noopener noreferrer">GIA — Jade</a>, <a href="https://www.gia.edu/jade-quality-factor" target="_blank" rel="noopener noreferrer">các yếu tố chất lượng</a> và <a href="https://www.gia.edu/FAQ/gia-faq-b-jade" target="_blank" rel="noopener noreferrer">thông tin xử lý</a>.</p>`,
  care:`<p class="eyebrow">GIỮ GÌN NGỌC</p><h2>Nâng niu những điều <em>bền lâu.</em></h2><ol><li>Làm sạch nhẹ bằng nước ấm pha xà phòng dịu; lau khô với khăn mềm.</li><li>Tránh va đập, nhiệt cao và hóa chất mạnh. Cất riêng trong túi mềm để hạn chế cọ xát.</li><li>Nếu chưa biết món ngọc có qua xử lý không, tránh tự làm sạch bằng máy siêu âm hoặc hơi nước.</li></ol><div class="callout"><p>Hỏi cửa hàng cách chăm sóc phù hợp với vật liệu, xử lý và phần kim loại của từng món.</p></div><p class="source-note">Tham khảo <a href="https://www.gia.edu/jade-care-cleaning" target="_blank" rel="noopener noreferrer">GIA — Jade Care and Cleaning Guide</a>.</p>`,
  policies:`<p class="eyebrow">THÔNG TIN MUA & NHẬN HÀNG</p><h2>Cùng rõ ràng, <em>trước khi chọn.</em></h2><p>Website là catalogue để bạn xem mẫu, giá, ni và tình trạng. Ghé nhóm Zalo Ngọc Nhà Lyn để xem đợt hàng mới và hỏi về sản phẩm. Khi cần trao đổi trực tiếp, gọi hotline 0979 628 889.</p><h3>Ba trạng thái trên catalogue</h3><ul><li><strong>Hàng có sẵn:</strong> đang được cửa hàng niêm yết là còn. Hãy xác nhận lại trước khi chuyển tiền.</li><li><strong>Nhận đặt:</strong> cần hỏi cửa hàng về thời gian, giá xác nhận và điều kiện đặt.</li><li><strong>Đã hết hàng:</strong> lưu để tham khảo. Bạn có thể hỏi một mẫu tương tự.</li></ul><p>Việc lưu yêu thích hoặc xem chi tiết chưa tạo đơn và chưa giữ hàng. Phí vận chuyển, điều kiện đổi trả, đặt cọc, thanh toán và kiểm định cần được cửa hàng xác nhận trước khi giao dịch.</p>`,
  privacy:`<p class="eyebrow">QUYỀN RIÊNG TƯ</p><h2>Ngắm ngọc, <em>thật nhẹ nhàng.</em></h2><p>Khách không cần tạo tài khoản. Website không nhận thông tin thanh toán và không có biểu mẫu thu số điện thoại khách.</p><p>Danh sách yêu thích được lưu trong trình duyệt trên thiết bị của bạn; bạn có thể bỏ lưu từng món hoặc xóa dữ liệu trang để xóa toàn bộ. Các lựa chọn lọc có thể xuất hiện trong liên kết bạn chia sẻ.</p><p>Khi vào nhóm Zalo, thông tin bạn đăng có thể được thành viên nhóm xem. Nếu cần trao đổi trực tiếp, hãy gọi hotline của cửa hàng. Các dịch vụ bên thứ ba có chính sách riêng. Nhà cung cấp hosting và dữ liệu có thể ghi nhật ký kỹ thuật để vận hành dịch vụ.</p>`
};
function openGuide(key) {$('#guide-content').innerHTML=(guides[key] || guides.size)+`<a class="button primary" href="${config.zaloGroupUrl}" target="_blank" rel="noopener noreferrer">Vào nhóm Zalo Ngọc Nhà Lyn <svg><use href="#i-arrow-up"/></svg></a><p class="guide-hotline"><a href="tel:+84${config.phone.slice(1)}">Gọi hotline · 0979 628 889</a></p>`;if(!$('#guide-dialog').open)$('#guide-dialog').showModal();$('#guide-dialog').scrollTop=0;}
async function copy(text, success) {try{await navigator.clipboard.writeText(text);toast(success);}catch{toast('Chưa sao chép tự động được. Bạn có thể chọn và sao chép nội dung đang hiển thị.');}}
document.addEventListener('click',event=>{
  const b=event.target.closest('button, a');if(!b)return;
  if(b.hasAttribute('data-product'))openProduct(b.dataset.product);
  if(b.hasAttribute('data-save')){const id=b.dataset.save;state.saved=state.saved.includes(id)?state.saved.filter(v=>v!==id):[...state.saved,id];try{localStorage.setItem('ngan-giang-saved',JSON.stringify(state.saved));}catch{toast('Trình duyệt không cho lưu lâu dài; danh sách chỉ giữ trong lượt xem này.');}syncSaved();if(state.filters.savedOnly)render();}
  if(b.hasAttribute('data-close'))$('#'+b.dataset.close).close();
  if(b.hasAttribute('data-reset'))resetFilters();
  if(b.hasAttribute('data-retry'))load();
  if(b.hasAttribute('data-guide'))openGuide(b.dataset.guide);
  if(b.hasAttribute('data-gallery'))$('#detail-image').src=b.dataset.gallery;
  if(b.hasAttribute('data-copy-inquiry')&&state.modalProduct)copy(inquiryText(state.modalProduct,productURL(state.modalProduct.sku,location.href)),'Đã sao chép nội dung. Vào nhóm Zalo và dán để hỏi Ngọc Nhà Lyn.');
  if(b.hasAttribute('data-copy-link')&&state.modalProduct)copy(productURL(state.modalProduct.sku,location.href),'Đã sao chép liên kết món ngọc.');
  if(b.hasAttribute('data-category')){state.filters.category=b.dataset.category;state.filters.size='';updateSizeOptions();syncCategories();syncURL();render();}
});
$('#filters').addEventListener('submit',event=>event.preventDefault());
$('#filters').addEventListener('input',event=>{if(event.target.name){state.filters[event.target.name]=event.target.value;syncURL();render();}});
$('#sort').addEventListener('change',event=>{state.filters.sort=event.target.value;syncURL();render();});
$('#reset-filters').addEventListener('click',resetFilters);
$('#search-open').addEventListener('click',()=>{$('#bo-suu-tap').scrollIntoView();$('#search').focus({preventScroll:true});});
$('#saved-toggle').addEventListener('click',()=>{state.filters.savedOnly=!state.filters.savedOnly;render();$('#bo-suu-tap').scrollIntoView();});
$('#size-guide-open').addEventListener('click',()=>openGuide('size'));
$('#menu-toggle').addEventListener('click',()=>{const open=$('#mobile-nav').hidden;$('#mobile-nav').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',open);});
$('#mobile-nav').addEventListener('click',event=>{if(event.target.closest('a')){$('#mobile-nav').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');}});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
$('#product-dialog').addEventListener('close',()=>{opening++;state.modalProduct=null;$('#product-detail').querySelectorAll('video').forEach(v=>v.pause());const u=new URL(location.href);u.searchParams.delete('san-pham');history.replaceState(null,'',u);});
function refreshVisible(){if(!document.hidden&&!isPreview){load({quiet:true});if($('#product-dialog').open&&state.modalProduct)openProduct(state.modalProduct.sku,{updateURL:false,refreshOnly:true});}}
window.addEventListener('focus',refreshVisible);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVisible();});
setInterval(refreshVisible,60000);
const params=new URLSearchParams(location.search);
for(const key of ['q','category','supply','price','color','texture','size','sort'])if(params.has(key))state.filters[key]=params.get(key);
if(!['','vong','nhan','mat_day','khac'].includes(state.filters.category))state.filters.category='';
for(const key of ['q','supply','price'])$('#'+(key==='q'?'search':key)).value=state.filters[key];
if(!['newest','price-up','price-down'].includes(state.filters.sort))state.filters.sort='newest';$('#sort').value=state.filters.sort;syncCategories();
$('#preview-notice').hidden=!isPreview;
syncSaved();await load();
if(params.get('san-pham'))await openProduct(params.get('san-pham'),{updateURL:false});
