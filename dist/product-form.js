import {sizeNumbers} from './product-size.js';

// One form-to-product path for new entries and edits. Fields removed from the UI
// retain their stored values; saving another field must never erase old evidence.
export function productFromForm(data,{editing=null,images=[],published=true}={}) {
  const nullable=name=>String(data.get(name)||'').trim()||null;
  const category=data.get('category');
  const size=nullable('size_mm'),numbers=sizeNumbers(category,size);
  const product={
    sku:String(data.get('sku')||'').trim(),title:String(data.get('title')||'').trim(),
    category,supply:data.get('supply'),price_vnd:Number(data.get('price_vnd')),
    batch_date:data.get('batch_date'),size_mm:size,ni_tay:numbers.ni_tay,bead_diameter_mm:numbers.bead_diameter_mm,
    dimensions:editing?.dimensions??null,jade_texture:nullable('jade_texture'),jade_color:nullable('jade_color'),
    jade_material:data.get('jade_material'),treatment:data.get('treatment'),
    certificate_lab:editing?.certificate_lab??null,certificate_url:editing?.certificate_url??null,
    certificate_number:nullable('certificate_number'),description:nullable('description'),
    thumbnail_url:images[0]||'',gallery_urls:images.slice(1),video_url:nullable('video_url'),is_published:published,
  };
  if(editing)product.id=editing.id;
  return product;
}
