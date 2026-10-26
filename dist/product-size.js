// size_mm is the editable source. Numeric columns are derived search indexes only.
export function sizeNumbers(category,size) {
  const result={ni_tay:null,bead_diameter_mm:null,valid:true};
  const text=String(size??'').trim();
  const diameter=['vong','nhan'].includes(category);
  if(!diameter&&category!=='vong_chuoi')return result;
  const pattern=diameter?/^(?:ni\s*)?([0-9]+(?:[.,][0-9]+)?)(?:\s*mm)?(?:\s*[·;|].*)?$/i:/^(?:hạt\s*)?([0-9]+(?:[.,][0-9]+)?)(?:\s*mm)?(?:\s*[·;|].*)?$/i;
  const match=text.match(pattern);
  if(!match)return result; // Multiple unlabelled dimensions are not an inner diameter.
  const number=Number(match[1].replace(',','.'));
  if(number<=0||number>=1000)return {...result,valid:false};
  result[diameter?'ni_tay':'bead_diameter_mm']=number;
  return result;
}

export function formatSize(size) {
  const text=String(size??'').trim();
  if(!text)return 'Liên hệ size';
  return /^[\d\s.,×xX*/–—-]+$/u.test(text)?text+' mm':text;
}
