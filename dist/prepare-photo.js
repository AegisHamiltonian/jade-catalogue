const supported=/^(image\/(jpeg|png|webp|heic|heif|heic-sequence|heif-sequence))$/i;
export function admitPhoto(file){
  if(!supported.test(file.type||'')&&!/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name||''))throw new Error('Chọn ảnh JPG, PNG, WebP hoặc HEIC từ thư viện.');
  if(file.size>40*1024*1024)throw new Error('Ảnh gốc vượt 40 MB. Chọn bản ảnh nhỏ hơn để tải.');
}
export async function preparePhoto(file,{signal}={}){
  admitPhoto(file);if(signal?.aborted)throw new DOMException('Đã dừng','AbortError');
  const url=URL.createObjectURL(file),image=new Image();let timer;
  try{
    await new Promise((resolve,reject)=>{
      const abort=()=>{image.src='';reject(new DOMException('Đã dừng','AbortError'));};
      const finish=fn=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);image.onload=null;image.onerror=null;fn();};
      image.onload=()=>finish(resolve);
      image.onerror=()=>finish(()=>reject(new Error(/heic|heif/i.test(file.type+file.name)?'Trình duyệt chưa đọc được ảnh HEIC này. Chọn bản JPG/PNG của ảnh rồi tải lại.':'Không đọc được ảnh này. Chọn lại ảnh từ thư viện.')));
      signal?.addEventListener('abort',abort,{once:true});
      timer=setTimeout(()=>finish(()=>reject(new Error('Đọc ảnh quá lâu. Chọn lại ảnh hoặc thử bản JPG/PNG.'))),45000);
      image.src=url;
    });
    if(signal?.aborted)throw new DOMException('Đã dừng','AbortError');
    const width=image.naturalWidth,height=image.naturalHeight;
    if(!width||!height||width*height>64000000)throw new Error('Ảnh quá lớn để xử lý trên điện thoại. Chọn ảnh có độ phân giải thấp hơn.');
    if(/image\/(jpeg|png|webp)$/i.test(file.type)&&file.size<=2.5*1024*1024&&Math.max(width,height)<=2000)return file;
    const ratio=Math.min(1,2000/Math.max(width,height)),canvas=document.createElement('canvas');
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    const context=canvas.getContext('2d');if(!context)throw new Error('Không chuẩn bị được ảnh. Thử chọn lại ảnh.');
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const png=/image\/(png|webp)/i.test(file.type),type=png?'image/png':'image/jpeg';
    let blob=await new Promise(resolve=>canvas.toBlob(resolve,type,.9));
    if(blob?.size>8*1024*1024&&Math.max(canvas.width,canvas.height)>1600){
      const resized=document.createElement('canvas'),scale=1600/Math.max(canvas.width,canvas.height);resized.width=Math.round(canvas.width*scale);resized.height=Math.round(canvas.height*scale);
      resized.getContext('2d').drawImage(canvas,0,0,resized.width,resized.height);blob=await new Promise(resolve=>resized.toBlob(resolve,type,.9));resized.width=resized.height=0;
    }
    canvas.width=canvas.height=0;
    if(signal?.aborted)throw new DOMException('Đã dừng','AbortError');
    if(!blob||blob.size>8*1024*1024)throw new Error('Ảnh vẫn quá lớn sau khi chuẩn bị. Chọn bản nhỏ hơn 8 MB.');
    return new File([blob],(file.name||'anh').replace(/\.[^.]+$/,'')+(type==='image/png'?'.png':'.jpg'),{type:blob.type,lastModified:file.lastModified});
  }finally{clearTimeout(timer);image.src='';URL.revokeObjectURL(url);}
}
