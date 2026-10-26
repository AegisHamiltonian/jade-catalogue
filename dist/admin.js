import { productFromForm } from './product-form.js';
import { repository, isPreview } from './repository.js';
import { money, categoryNames, usesDiameter, supplyNames, escapeHTML as e, safeMedia, normalize, validateProduct } from './catalogue.js';
const $=s=>document.querySelector(s);
const form=$('#product-form');
let products=[], editing=null, images=[], pending=0, dirty=false, user=null;
const field=name=>form.elements.namedItem(name);
const vietnamDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function message(text,ok=false){$('#admin-message').textContent=text;$('#admin-message').classList.toggle('success',ok);}
function setPending(delta){pending+=delta;$('#save-product').disabled=pending>0;$('#photo-upload').disabled=pending>0;$('#video-upload').disabled=pending>0;}
function renderList(){
 const q=normalize($('#admin-search').value);
 const list=products.filter(p=>normalize(p.sku+' '+p.title).includes(q));
 $('#admin-list').innerHTML=list.length?list.map(p=>`<article class="admin-row"><img src="${e(safeMedia(p.thumbnail_url))}" alt="${e(p.title)}" width="72" height="72"><div><h3>${e(p.title)}</h3><p>${e(p.sku)} · ${e(categoryNames[p.category])}${p.bead_diameter_mm!=null?' · Hạt '+e(p.bead_diameter_mm)+' mm':p.ni_tay!=null?' · Ni '+e(p.ni_tay)+' mm':''}</p></div><span class="admin-price">${money(p.price_vnd)}</span><div class="status-label"><b>${e(supplyNames[p.supply])}</b><small class="${p.is_published?'':'unpublished'}">${p.is_published?'Đang hiển thị':'Đã ẩn trên catalogue'}</small></div><button class="button outline" data-edit="${e(p.id)}">Chỉnh sửa</button></article>`).join(''):'<div class="empty-state"><h3>Chưa có món ngọc nào.</h3><p>Đăng món mới hoặc thử tìm một mã khác.</p></div>';
}
async function reload(){products=await repository.adminList();renderList();}
async function login(event){
 event.preventDefault();const button=event.submitter;button.disabled=true;$('#login-message').textContent='Đang kiểm tra tài khoản và quyền quản trị…';
 const data=new FormData(event.target);
 try{user=await repository.signIn(data.get('email'),data.get('password'));event.target.reset();await reload();$('#login-panel').hidden=true;$('#dashboard').hidden=false;$('#admin-identity').textContent='Đã đăng nhập: '+user.email;$('#login-message').textContent='';}
 catch(err){await repository.signOut().catch(()=>{});user=null;$('#login-message').textContent=err.message;}
 finally{button.disabled=false;}
}
function updateSizeField(){
 const category=field('category').value,applies=usesDiameter(category),beads=category==='vong_chuoi';
 $('#admin-size-field').hidden=!applies;field('ni_tay').required=applies;field('ni_tay').disabled=!applies;if(!applies)field('ni_tay').value='';
 $('#admin-bead-field').hidden=!beads;field('bead_diameter_mm').disabled=!beads;if(!beads)field('bead_diameter_mm').value='';
 field('dimensions').placeholder=beads?'Hạt 6 mm · vòng 16 cm':'Rộng 12 × dày 7 mm';
}
function renderMedia(){
 $('#media-previews').innerHTML=images.map((url,i)=>`<div class="media-preview"><img src="${e(safeMedia(url))}" alt="Ảnh sản phẩm ${i+1}"><span>${i===0?'Ảnh đại diện':'Ảnh '+(i+1)}</span>${i>0?`<button type="button" data-cover="${i}">Đặt làm đại diện</button>`:''}<button type="button" data-remove-media="${i}">Gỡ khỏi sản phẩm</button></div>`).join('');
}
function openEditor(product=null){
 if(pending)return;
 form.reset();editing=product?structuredClone(product):null;dirty=false;
 const initial=product||{category:'vong_chuoi',supply:'stock',jade_material:'unknown',treatment:'unknown',batch_date:vietnamDate(),is_published:true};
 for(const [name,value]of Object.entries(initial)){const el=field(name);if(!el)continue;if(el.type==='checkbox')el.checked=value;else el.value=value??'';}
 images=product?[...new Set([product.thumbnail_url,...(product.gallery_urls||[])])].filter(Boolean):[];
 $('#editor-title').textContent=product?'Chỉnh sửa '+product.sku:'Đăng món ngọc mới';$('#delete-product').hidden=!product;$('#editor-message').textContent='';$('#upload-message').textContent='';updateSizeField();renderMedia();$('#editor-dialog').showModal();$('#editor-dialog').scrollTop=0;
}
function requestClose(){
 if(pending){$('#editor-message').textContent='Đang tải tệp hoặc lưu dữ liệu. Vui lòng đợi hoàn tất.';return;}
 if(dirty)$('#discard-dialog').showModal();else $('#editor-dialog').close();
}
function readProduct(){
 return productFromForm(new FormData(form),{editing,images,published:field('is_published').checked});
}
async function save(event){
 event.preventDefault();if(pending)return;
 const product=readProduct();const errors=validateProduct(product);if(errors.length){$('#editor-message').textContent=errors.join('\n');return;}
 setPending(1);$('#editor-message').textContent='Đang lưu sản phẩm…';
 let saved=false;
 try{await repository.save(product,editing?.updated_at);saved=true;dirty=false;$('#editor-dialog').close();message('Đã lưu sản phẩm. Catalogue sẽ hiển thị theo trạng thái chị vừa chọn.',true);}
 catch(err){$('#editor-message').textContent=err.message;}
 finally{setPending(-1);}
 if(saved)try{await reload();}catch{message('Sản phẩm đã được lưu nhưng chưa tải lại được danh sách. Bấm Tải lại để xem.');}
}
async function uploadPhotos(event){
 const files=Array.from(event.target.files||[]);if(!files.length)return;
 if(images.length+files.length>12){$('#upload-message').textContent='Một sản phẩm có tối đa 12 ảnh.';event.target.value='';return;}
 setPending(1);let done=0;
 try{for(const file of files){$('#upload-message').textContent=`Đang tải ảnh ${done+1}/${files.length}…`;const url=await repository.upload(file);images.push(url);done++;dirty=true;renderMedia();}$('#upload-message').textContent=`Đã tải ${done} ảnh. Bấm Lưu sản phẩm để công bố.`;}
 catch(err){$('#upload-message').textContent=`Đã tải ${done}/${files.length} ảnh. ${err.message}`;}
 finally{setPending(-1);event.target.value='';}
}
async function uploadVideo(event){
 const file=event.target.files?.[0];if(!file)return;setPending(1);$('#upload-message').textContent='Đang tải video…';
 try{field('video_url').value=await repository.upload(file,'videos');dirty=true;$('#upload-message').textContent='Đã tải video. Bấm Lưu sản phẩm để công bố.';}
 catch(err){$('#upload-message').textContent=err.message;}
 finally{setPending(-1);event.target.value='';}
}
$('#login-form').addEventListener('submit',login);
$('#logout').addEventListener('click',async()=>{try{await repository.signOut();}catch{}finally{user=null;products=[];$('#dashboard').hidden=true;$('#login-panel').hidden=false;$('#admin-list').innerHTML='';message('');}});
$('#admin-refresh').addEventListener('click',async event=>{event.target.disabled=true;try{await reload();message('Đã tải lại danh sách.',true);}catch(err){message(err.message);}finally{event.target.disabled=false;}});
$('#new-product').addEventListener('click',()=>openEditor());
$('#admin-search').addEventListener('input',renderList);
$('#admin-list').addEventListener('click',event=>{const b=event.target.closest('[data-edit]');if(b)openEditor(products.find(p=>p.id===b.dataset.edit));});
field('category').addEventListener('change',updateSizeField);
form.addEventListener('input',()=>{dirty=true;});
form.addEventListener('submit',save);
$('#photo-upload').addEventListener('change',uploadPhotos);
$('#video-upload').addEventListener('change',uploadVideo);
$('#media-previews').addEventListener('click',event=>{if(pending)return;const remove=event.target.closest('[data-remove-media]'),cover=event.target.closest('[data-cover]');if(remove)images.splice(Number(remove.dataset.removeMedia),1);if(cover){const[url]=images.splice(Number(cover.dataset.cover),1);images.unshift(url);}if(remove||cover){dirty=true;renderMedia();}});
document.querySelectorAll('.close-editor').forEach(b=>b.addEventListener('click',requestClose));
$('#editor-dialog').addEventListener('cancel',event=>{event.preventDefault();requestClose();});
$('#continue-edit').addEventListener('click',()=>$('#discard-dialog').close());
$('#discard-edit').addEventListener('click',()=>{dirty=false;$('#discard-dialog').close();$('#editor-dialog').close();});
$('#delete-product').addEventListener('click',()=>{if(pending||!editing)return;$('#delete-name').textContent=editing.sku+' · '+editing.title;$('#delete-dialog').showModal();});
$('#cancel-delete').addEventListener('click',()=>$('#delete-dialog').close());
$('#confirm-delete').addEventListener('click',async event=>{
 if(!editing||pending)return;event.target.disabled=true;setPending(1);let deleted=false;
 try{await repository.remove(editing);deleted=true;dirty=false;$('#delete-dialog').close();$('#editor-dialog').close();message('Đã xóa sản phẩm; ảnh và lịch sử thay đổi vẫn được giữ.',true);}
 catch(err){$('#delete-dialog').close();$('#editor-message').textContent=err.message;}
 finally{event.target.disabled=false;setPending(-1);}
 if(deleted)try{await reload();}catch{message('Đã xóa sản phẩm nhưng chưa tải lại được danh sách. Bấm Tải lại để kiểm tra.');}
});
window.addEventListener('beforeunload',event=>{if(dirty||pending){event.preventDefault();event.returnValue='';}});
if(isPreview)$('#setup-notice').hidden=false;else $('#login-panel').hidden=false;
