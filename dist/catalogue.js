import { config } from './config.js';
import {sizeNumbers,formatSize} from './product-size.js';
export const categoryNames = { vong_chuoi: 'Vòng chuỗi', vong: 'Vòng bản', nhan: 'Nhẫn', mat_day: 'Mặt dây / Hoa tai', charm: 'Phụ kiện charm ngọc', khac: 'Ngọc khác' };
export const usesDiameter = category => ['vong','nhan'].includes(category);
export const priceRanges = Object.freeze({
  under500: Object.freeze({label:'< 500k',min:0,max:500000,includeMax:false}),
  '500to1': Object.freeze({label:'500k – 1 triệu',min:500000,max:1000000,includeMax:false}),
  '1to2': Object.freeze({label:'1 – 2 triệu',min:1000000,max:2000000,includeMax:true}),
  over2: Object.freeze({label:'Trên 2 triệu',min:2000000,max:Infinity,includeMin:false}),
});
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
  const range = Object.hasOwn(priceRanges,filters.price) ? priceRanges[filters.price] : null;
  const filtered = products.filter(p => p.is_published &&
    (!filters.category || p.category === filters.category) &&
    (!filters.supply || p.supply === filters.supply) &&
    (!filters.color || p.jade_color === filters.color) &&
    (!filters.texture || p.jade_texture === filters.texture) &&
    (!filters.savedOnly || filters.saved?.includes(p.id)) &&
    (!q || normalize([p.sku, p.title, p.size_mm, p.jade_color, p.jade_texture, categoryNames[p.category]].join(' ')).includes(q)) &&
    (!range || ((range.includeMin===false ? p.price_vnd > range.min : p.price_vnd >= range.min) && (range.includeMax ? p.price_vnd <= range.max : p.price_vnd < range.max))) &&
    // Size is category-scoped: never mix ring and bangle diameters.
    (!filters.size || (usesDiameter(filters.category) && p.ni_tay != null && Math.abs(Number(p.ni_tay) - Number(filters.size)) <= 0.5)));
  return filtered.sort(filters.sort === 'price-up' ? (a,b) => a.price_vnd - b.price_vnd : filters.sort === 'price-down' ? (a,b) => b.price_vnd - a.price_vnd : (a,b) => b.batch_date.localeCompare(a.batch_date) || b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
}
export function groupByBatch(products) {
  return products.reduce((groups, p) => { (groups[p.batch_date] ??= []).push(p); return groups; }, {});
}
export function sizeLabel(p) {
  return formatSize(p.size_mm);
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
  if (p.size_mm!=null && (typeof p.size_mm!=='string'||p.size_mm.length>150)) errors.push('Size tối đa 150 ký tự.');
  if (usesDiameter(p.category) && !String(p.size_mm??'').trim()) errors.push('Cần nhập Size (mm) cho nhẫn hoặc vòng bản.');
  const numbers=sizeNumbers(p.category,p.size_mm);
  if(!numbers.valid || (p.ni_tay??null)!==numbers.ni_tay || (p.bead_diameter_mm??null)!==numbers.bead_diameter_mm) errors.push('Số đo không khớp với Size (mm).');
  if (!safeMedia(p.thumbnail_url)) errors.push('Cần chọn ảnh bìa và tải ảnh thành công trước khi lưu.');
  if (p.gallery_urls?.some(url => !safeMedia(url))) errors.push('Ảnh thư viện cần dùng URL HTTPS hợp lệ.');
  if (p.video_url && !safeMedia(p.video_url)) errors.push('Video cần dùng URL HTTPS hợp lệ.');
  if (p.certificate_url && !safeMedia(p.certificate_url)) errors.push('Phiếu kiểm định cần dùng URL HTTPS hợp lệ.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.batch_date || '') || !Number.isFinite(Date.parse(p.batch_date))) errors.push('Ngày lên hàng không hợp lệ.');
  if (!['unknown','jadeite','nephrite','other'].includes(p.jade_material)) errors.push('Vật liệu không hợp lệ.');
  if (!['unknown','a','b','c','bc','other'].includes(p.treatment)) errors.push('Thông tin xử lý không hợp lệ.');
  if (p.treatment !== 'unknown' && !p.certificate_number?.trim()) errors.push('Cần mã phiếu kiểm định khi công bố kết luận xử lý.');
  return errors;
}
