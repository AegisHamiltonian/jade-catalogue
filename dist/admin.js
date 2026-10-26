import { PhotoQueue } from './photo-queue.js';
import { preparePhoto, admitPhoto } from './prepare-photo.js';
import { productFromForm } from './product-form.js';
import { repository, isPreview } from './repository.js';
import { money, categoryNames, sizeLabel, supplyNames, escapeHTML as e, safeMedia, normalize, validateProduct } from './catalogue.js';
const $=s=>document.querySelector(s);
const form=$('#product-form');
let products=[],editing=null,pending=0,dirty=false,user=null,saving=false,videoController=null,videoFile=null,videoError='';
const photos=new PhotoQueue({upload:(...args)=>repository.upload(...args),prepare:preparePhoto,admit:admitPhoto,onChange:()=>{renderMedia();syncBusy();renderUploadStatus();if(!saving)$('#editor-message').textContent='';}});
const isBusy=()=>pending>0||photos.busy;
const field=name=>form.elements.namedItem(name);
const vietnamDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function message(text,ok=false){$('#admin-message').textContent=text;$('#admin-message').classList.toggle('success',ok);}
function syncBusy(){
 $('#save-product').disabled=pending>0||photos.busy||photos.hasErrors||!!videoError;
 $('#photo-upload').disabled=pending>0;$('#video-upload').disabled=pending>0;
 field('video_url').readOnly=!!videoController;
 $('#cancel-uploads').hidden=!photos.busy&&!videoController;
 $('#retry-video').hidden=!videoError||!videoFile||!!videoController;
 $('#remove-video-selection').hidden=!videoError||!videoFile||!!videoController;
}
function setPending(delta){pending+=delta;syncBusy();}
function renderUploadStatus(){
 const total=photos.items.length,ready=photos.items.filter(i=>i.status==='ready').length,active=photos.items.find(i=>['preparing','uploading'].includes(i.status));
 $('#upload-message').textContent=active?`Ảnh ${photos.items.indexOf(active)+1}/${total}: ${active.status==='preparing'?'Đang chuẩn bị ảnh…':active.progress>=99?'Đang chờ máy chủ xác nhận…':'Đang tải '+active.progress+'%…'}`:photos.hasErrors?`Đã tải ${ready}/${total} ảnh. Bấm Thử lại hoặc gỡ ảnh bị lỗi trước khi lưu.`:total?`${total} ảnh đã sẵn sàng. Ảnh đầu tiên là ảnh bìa.`:'Chọn ảnh; ảnh đầu tiên sẽ tự làm ảnh bìa.';
}
function resetMedia(){photos.reset();videoFile=null;videoError='';$('#video-upload-message').textContent='';syncBusy();}

function renderList(){
 const q=normalize($('#admin-search').value);
 const list=products.filter(p=>normalize(p.sku+' '+p.title).includes(q));
 $('#admin-list').innerHTML=list.length?list.map(p=>`<article class="admin-row"><img src="${e(safeMedia(p.thumbnail_url))}" alt="${e(p.title)}" width="72" height="72"><div><h3>${e(p.title)}</h3><p>${e(p.sku)} · ${e(categoryNames[p.category])}${p.size_mm?' · Size: '+e(sizeLabel(p)):''}</p></div><span class="admin-price">${money(p.price_vnd)}</span><div class="status-label"><b>${e(supplyNames[p.supply])}</b><small class="${p.is_published?'':'unpublished'}">${p.is_published?'Đang hiển thị':'Đã ẩn trên catalogue'}</small></div><button class="button outline" data-edit="${e(p.id)}">Chỉnh sửa</button></article>`).join(''):'<div class="empty-state"><h3>Chưa có món ngọc nào.</h3><p>Đăng món mới hoặc thử tìm một mã khác.</p></div>';
}
async function reload(){products=await repository.adminList();renderList();}
async function login(event){
 event.preventDefault();const button=event.submitter;button.disabled=true;$('#login-message').textContent='Đang kiểm tra tài khoản và quyền quản trị…';
 const data=new FormData(event.target);
 try{user=await repository.signIn(data.get('email'),data.get('password'));event.target.reset();await reload();$('#login-panel').hidden=true;$('#dashboard').hidden=false;$('#admin-identity').textContent='Đã đăng nhập: '+user.email;$('#login-message').textContent='';}
 catch(err){await repository.signOut().catch(()=>{});user=null;$('#login-message').textContent=err.message;}
 finally{button.disabled=false;}
}
function updateSizeField(){field('size_mm').required=['vong','nhan'].includes(field('category').value);}
function renderMedia(){
 $('#media-previews').innerHTML=photos.items.map((item,i)=>`<div class="media-preview ${i===0?'is-cover':''} ${item.status==='error'?'is-error':''}">${item.preview||safeMedia(item.url)?`<img src="${e(item.preview||safeMedia(item.url))}" alt="Ảnh sản phẩm ${i+1}" loading="lazy">`:`<div class="media-placeholder">Chưa đọc được ảnh</div>`}<span class="media-role">${i===0?'Ảnh bìa':'Ảnh '+(i+1)}</span><span class="media-filename">${e(item.name)}</span><span class="media-status" role="status">${item.status==='ready'?'Đã tải xong':item.status==='preparing'?'Đang chuẩn bị…':item.status==='uploading'?'Đang tải '+item.progress+'%':item.status==='error'?e(item.error):'Đang chờ tải'}</span>${item.status==='error'?`<button type="button" data-retry-media="${e(item.id)}">Thử lại ảnh này</button>`:''}${i>0?`<button type="button" data-cover="${e(item.id)}">Đặt làm ảnh bìa</button>`:''}<button type="button" data-remove-media="${e(item.id)}">Gỡ ảnh</button></div>`).join('');
}

function openEditor(product=null){
 if(isBusy())return;
 message('');form.reset();editing=product?structuredClone(product):null;dirty=false;
 const initial=product||{category:'vong_chuoi',supply:'stock',jade_material:'unknown',treatment:'unknown',batch_date:vietnamDate(),is_published:true};
 for(const [name,value]of Object.entries(initial)){const el=field(name);if(!el)continue;if(el.type==='checkbox')el.checked=value;else el.value=value??'';}
 videoFile=null;videoError='';$('#video-upload-message').textContent='';
 photos.reset(product?[product.thumbnail_url,...(product.gallery_urls||[])].filter(Boolean):[]);
 $('#editor-title').textContent=product?'Chỉnh sửa '+product.sku:'Đăng món ngọc mới';$('#delete-product').hidden=!product;$('#editor-message').textContent='';updateSizeField();renderUploadStatus();$('#editor-dialog').showModal();$('#editor-dialog').scrollTop=0;
}
function requestClose(){
 if(isBusy()){$('#editor-message').textContent='Đang tải tệp hoặc lưu dữ liệu. Có thể bấm Dừng tải nếu cần.';return;}
 if(dirty)$('#discard-dialog').showModal();else{resetMedia();$('#editor-dialog').close();}
}
function readProduct(){
 return productFromForm(new FormData(form),{editing,images:photos.urls,published:field('is_published').checked});
}
async function save(event){
 event.preventDefault();if(isBusy()||photos.hasErrors||videoError){renderUploadStatus();return;}
 const product=readProduct();const errors=validateProduct(product);if(errors.length){$('#editor-message').textContent=errors.join('\n');return;}
 saving=true;form.inert=true;setPending(1);$('#editor-message').textContent='Đang lưu sản phẩm…';
 let saved=false;
 try{await repository.save(product,editing?.updated_at);saved=true;dirty=false;$('#editor-dialog').close();message('Đã lưu sản phẩm. Catalogue sẽ hiển thị theo trạng thái chị vừa chọn.',true);}
 catch(err){$('#editor-message').textContent=err.message;}
 finally{saving=false;form.inert=false;setPending(-1);}
 if(saved){resetMedia();}
 if(saved)try{await reload();}catch{message('Sản phẩm đã được lưu nhưng chưa tải lại được danh sách. Bấm Tải lại để xem.');}
}
async function uploadPhotos(event){
 const files=Array.from(event.target.files||[]);event.target.value='';if(!files.length)return;
 dirty=true;$('#editor-message').textContent='';
 try{await photos.add(files);}catch(error){$('#upload-message').textContent=error.message;}
}
async function uploadVideoFile(){
 if(!videoFile||pending)return;
 const file=videoFile;videoError='';videoController=new AbortController();setPending(1);dirty=true;$('#editor-message').textContent='';
 $('#video-upload-message').textContent='Đang tải video…';
 try{field('video_url').value=await repository.upload(file,'videos',{signal:videoController.signal,onProgress:percent=>{$('#video-upload-message').textContent=percent>=99?'Đang chờ máy chủ xác nhận video…':`Đang tải video ${percent}%…`;}});videoFile=null;$('#video-upload-message').textContent='Video đã tải xong. Bấm Lưu sản phẩm để công bố.';}
 catch(error){videoError=error.name==='AbortError'?'Đã dừng tải video. Có thể thử lại hoặc gỡ video đang chọn.':error.message;$('#video-upload-message').textContent=videoError;}
 finally{videoController=null;setPending(-1);}
}
async function uploadVideo(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;videoFile=file;await uploadVideoFile();}

$('#login-form').addEventListener('submit',login);
$('#logout').addEventListener('click',async()=>{try{await repository.signOut();}catch{}finally{user=null;products=[];$('#dashboard').hidden=true;$('#login-panel').hidden=false;$('#admin-list').innerHTML='';message('');}});
$('#admin-refresh').addEventListener('click',async event=>{event.target.disabled=true;try{await reload();message('Đã tải lại danh sách.',true);}catch(err){message(err.message);}finally{event.target.disabled=false;}});
$('#new-product').addEventListener('click',()=>openEditor());
$('#admin-search').addEventListener('input',renderList);
$('#admin-list').addEventListener('click',event=>{const b=event.target.closest('[data-edit]');if(b)openEditor(products.find(p=>p.id===b.dataset.edit));});
field('category').addEventListener('change',updateSizeField);
form.addEventListener('input',event=>{dirty=true;if(!saving)$('#editor-message').textContent='';if(event.target.name==='video_url'&&videoError){videoFile=null;videoError='';$('#video-upload-message').textContent='Đang dùng liên kết video chị vừa nhập.';syncBusy();}});
form.addEventListener('submit',save);
$('#photo-upload').addEventListener('change',uploadPhotos);
$('#video-upload').addEventListener('change',uploadVideo);
$('#media-previews').addEventListener('click',event=>{
 if(saving)return;const remove=event.target.closest('[data-remove-media]'),cover=event.target.closest('[data-cover]'),retry=event.target.closest('[data-retry-media]');
 if(remove)photos.remove(remove.dataset.removeMedia);if(cover)photos.cover(cover.dataset.cover);if(retry)photos.retry(retry.dataset.retryMedia);
 if(remove||cover||retry)dirty=true;
});
$('#cancel-uploads').addEventListener('click',()=>{photos.pause();videoController?.abort();});
$('#retry-video').addEventListener('click',uploadVideoFile);
$('#remove-video-selection').addEventListener('click',()=>{videoFile=null;videoError='';$('#video-upload-message').textContent='Đã gỡ video đang chọn; liên kết video đã lưu được giữ nguyên.';syncBusy();});

document.querySelectorAll('.close-editor').forEach(b=>b.addEventListener('click',requestClose));
$('#editor-dialog').addEventListener('cancel',event=>{event.preventDefault();requestClose();});
$('#continue-edit').addEventListener('click',()=>$('#discard-dialog').close());
$('#discard-edit').addEventListener('click',()=>{dirty=false;resetMedia();$('#discard-dialog').close();$('#editor-dialog').close();});
$('#delete-product').addEventListener('click',()=>{if(isBusy()||!editing)return;$('#delete-name').textContent=editing.sku+' · '+editing.title;$('#delete-dialog').showModal();});
$('#cancel-delete').addEventListener('click',()=>$('#delete-dialog').close());
$('#confirm-delete').addEventListener('click',async event=>{
 if(!editing||isBusy())return;event.target.disabled=true;setPending(1);let deleted=false;
 try{await repository.remove(editing);deleted=true;dirty=false;$('#delete-dialog').close();$('#editor-dialog').close();message('Đã xóa sản phẩm; ảnh và lịch sử thay đổi vẫn được giữ.',true);}
 catch(err){$('#delete-dialog').close();$('#editor-message').textContent=err.message;}
 finally{event.target.disabled=false;setPending(-1);}
 if(deleted)resetMedia();
 if(deleted)try{await reload();}catch{message('Đã xóa sản phẩm nhưng chưa tải lại được danh sách. Bấm Tải lại để kiểm tra.');}
});
window.addEventListener('beforeunload',event=>{if(dirty||isBusy()){event.preventDefault();event.returnValue='';}});
if(isPreview)$('#setup-notice').hidden=false;else $('#login-panel').hidden=false;
