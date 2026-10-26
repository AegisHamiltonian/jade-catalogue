import {usesDiameter} from './catalogue.js';

// One form-to-product path for new entries and edits. Fields removed from the UI
// retain their stored values; saving another field must never erase old evidence.
export function productFromForm(data,{editing=null,images=[],published=true}={}) {
  const nullable=name=>String(data.get(name)||'').trim()||null;
  const category=data.get('category');
  const product={
    sku:String(data.get('sku')||'').trim(),title:String(data.get('title')||'').trim(),
    category,supply:data.get('supply'),price_vnd:Number(data.get('price_vnd')),
    batch_date:data.get('batch_date'),ni_tay:usesDiameter(category)?Number(data.get('ni_tay')):null,
    bead_diameter_mm:category==='vong_chuoi'&&nullable('bead_diameter_mm')!==null?Number(data.get('bead_diameter_mm')):null,
    dimensions:nullable('dimensions'),jade_texture:nullable('jade_texture'),jade_color:nullable('jade_color'),
    jade_material:data.get('jade_material'),treatment:data.get('treatment'),
    certificate_lab:editing?.certificate_lab??null,certificate_url:editing?.certificate_url??null,
    certificate_number:nullable('certificate_number'),description:nullable('description'),
    thumbnail_url:images[0]||'',gallery_urls:images.slice(1),video_url:nullable('video_url'),is_published:published,
  };
  if(editing)product.id=editing.id;
  return product;
}
