import { config } from './config.js';
export const categoryNames = { vong: 'Vòng tay', nhan: 'Nhẫn', mat_day: 'Mặt dây', khac: 'Ngọc khác' };
export const supplyNames = { stock: 'Hàng có sẵn', order: 'Nhận đặt', sold: 'Đã hết hàng' };
export const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeMedia = value => {
  if (!value) return '';
  if (/^\.\/assets\/[a-z0-9.-]+$/i.test(value)) return value;
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
};
export function filterProducts(products, filters = {}) {
  const q = normalize(filters.q);
  const filtered = products.filter(p => p.is_published &&
    (!filters.category || p.category === filters.category) &&
    (!filters.supply || p.supply === filters.supply) &&
    (!filters.color || p.jade_color === filters.color) &&
    (!filters.texture || p.jade_texture === filters.texture) &&
    (!filters.savedOnly || filters.saved?.includes(p.id)) &&
    (!q || normalize([p.sku, p.title, p.jade_color, p.jade_texture, categoryNames[p.category]].join(' ')).includes(q)) &&
    (!filters.price || (filters.price === 'under2' ? p.price_vnd < 2000000 : filters.price === '2to5' ? p.price_vnd >= 2000000 && p.price_vnd <= 5000000 : p.price_vnd > 5000000)) &&
    // Size is category-scoped: never mix ring and bangle diameters.
    (!filters.size || (['vong','nhan'].includes(filters.category) && p.ni_tay != null && Math.abs(Number(p.ni_tay) - Number(filters.size)) <= 0.5)));
  return filtered.sort(filters.sort === 'price-up' ? (a,b) => a.price_vnd - b.price_vnd : filters.sort === 'price-down' ? (a,b) => b.price_vnd - a.price_vnd : (a,b) => b.batch_date.localeCompare(a.batch_date) || b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
}
export function groupByBatch(products) {
  return products.reduce((groups, p) => { (groups[p.batch_date] ??= []).push(p); return groups; }, {});
}
export function sizeLabel(p) {
  return p.ni_tay == null ? (p.dimensions || 'Xem kích thước') : `Ni ${Number(p.ni_tay).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} mm`;
}
export function inquiryText(p, url) {
  const prefix = p.supply === 'sold' ? 'Em muốn tìm một mẫu tương tự' : p.supply === 'order' ? 'Em muốn hỏi thời gian và điều kiện đặt mẫu' : 'Em muốn xem thêm ảnh/video và hỏi tình trạng';
  return `Chào ${config.brand}, ${prefix} ${p.title} (mã ${p.sku}). ${sizeLabel(p)}; giá niêm yết ${money(p.price_vnd)}.\n${url}`;
}
export function productURL(sku, locationHref) {
  const u = new URL(locationHref); u.search = ''; u.searchParams.set('san-pham', sku); u.hash = ''; return u.href;
}
export function validateProduct(p) {
  const errors = [];
  if (!/^[a-zA-Z0-9._-]{1,32}$/.test(p.sku || '')) errors.push('Mã sản phẩm gồm 1–32 chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.');
  if (!p.title?.trim() || p.title.length > 150) errors.push('Tên sản phẩm cần có và tối đa 150 ký tự.');
  if (!Object.hasOwn(categoryNames, p.category)) errors.push('Loại sản phẩm không hợp lệ.');
  if (!Object.hasOwn(supplyNames, p.supply)) errors.push('Tình trạng không hợp lệ.');
  if (!Number.isSafeInteger(p.price_vnd) || p.price_vnd <= 0) errors.push('Giá cần là số nguyên VNĐ lớn hơn 0.');
  if (['vong','nhan'].includes(p.category) && (!Number.isFinite(p.ni_tay) || p.ni_tay <= 0 || p.ni_tay >= 1000)) errors.push('Nhẫn và vòng cần đường kính trong tính bằng mm.');
  if (['mat_day','khac'].includes(p.category) && p.ni_tay !== null) errors.push('Mặt dây và ngọc khác không dùng ni tay.');
  if (!safeMedia(p.thumbnail_url)) errors.push('Cần một ảnh đại diện HTTPS hợp lệ.');
  if (p.gallery_urls?.some(url => !safeMedia(url))) errors.push('Ảnh thư viện cần dùng URL HTTPS hợp lệ.');
  if (p.video_url && !safeMedia(p.video_url)) errors.push('Video cần dùng URL HTTPS hợp lệ.');
  if (p.certificate_url && !safeMedia(p.certificate_url)) errors.push('Phiếu kiểm định cần dùng URL HTTPS hợp lệ.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.batch_date || '') || !Number.isFinite(Date.parse(p.batch_date))) errors.push('Ngày lên hàng không hợp lệ.');
  if (!['unknown','jadeite','nephrite','other'].includes(p.jade_material)) errors.push('Vật liệu không hợp lệ.');
  if (!['unknown','a','b','c','bc','other'].includes(p.treatment)) errors.push('Thông tin xử lý không hợp lệ.');
  if (p.treatment !== 'unknown' && (!p.certificate_lab?.trim() || !p.certificate_number?.trim() || !p.certificate_url)) errors.push('Chỉ ghi kết luận xử lý khi có đơn vị, mã và phiếu kiểm định.');
  return errors;
}
