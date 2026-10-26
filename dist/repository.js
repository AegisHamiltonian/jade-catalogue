import { config } from './config.js';
export const isPreview = config.dataSource === 'preview';
let session = null;
let refreshPromise = null;
const configured = () => {
  if (config.dataSource !== 'supabase') throw new Error('Bản xem thử chưa kết nối cơ sở dữ liệu. Không có quyền quản trị giả hoặc mật khẩu mặc định.');
  if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(config.supabaseUrl) || !config.supabasePublishableKey) throw new Error('Chưa cấu hình kết nối Supabase của cửa hàng.');
  if (config.supabasePublishableKey.startsWith('sb_secret_')) throw new Error('Web chỉ được dùng publishable key, không dùng secret key.');
};
function responseError(status,body={},storage=false){
  if(status===401)session=null;
  return new Error(status===409?(storage?'Tệp đã có trong kho ảnh. Hãy thử tải lại.':'Mã sản phẩm đã tồn tại. Hãy chọn mã khác.'):status===403?'Tài khoản không có quyền quản trị cửa hàng.':status===401?'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.':body.message||body.msg||body.error||'Không thể kết nối dữ liệu cửa hàng. Hãy thử lại.');
}
async function request(path, { token, headers = {}, ...options } = {}) {
  configured();
  const response = await fetch(`${config.supabaseUrl}${path}`, { ...options, cache:'no-store', signal: AbortSignal.timeout(20000), headers: { apikey:config.supabasePublishableKey, ...(token ? { Authorization:`Bearer ${token}` } : {}), ...headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw responseError(response.status,body);
  }
  return response.status === 204 ? null : response.json();
}
function uploadObject(path,file,token,{signal,onProgress,timeout}){
  configured();
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();let settled=false;
    const abort=()=>xhr.abort();
    const finish=(fn,value)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',abort);fn(value);};
    // Register upload listeners before open(): required for reliable WebKit progress events.
    xhr.upload.addEventListener('progress',event=>{if(event.lengthComputable&&!settled)onProgress?.(Math.min(99,Math.round(event.loaded/event.total*100)));});
    xhr.onload=()=>{
      if(xhr.status>=200&&xhr.status<300){finish(resolve);return;}
      let body={};try{body=JSON.parse(xhr.responseText||'{}');}catch{}
      finish(reject,responseError(xhr.status,body,true));
    };
    xhr.onerror=()=>finish(reject,new Error('Mất kết nối khi tải tệp. Ảnh đã chọn vẫn được giữ; bấm Thử lại khi có mạng.'));
    xhr.ontimeout=()=>finish(reject,new Error('Tải tệp quá lâu. Ảnh đã chọn vẫn được giữ; kiểm tra mạng rồi bấm Thử lại.'));
    xhr.onabort=()=>finish(reject,new DOMException('Đã dừng tải','AbortError'));
    xhr.open('POST',config.supabaseUrl+path,true);xhr.timeout=timeout;
    for(const [key,value]of Object.entries({apikey:config.supabasePublishableKey,Authorization:`Bearer ${token}`,'Content-Type':file.type,'x-upsert':'false'}))xhr.setRequestHeader(key,value);
    if(signal?.aborted){finish(reject,new DOMException('Đã dừng tải','AbortError'));return;}
    signal?.addEventListener('abort',abort,{once:true});
    try{xhr.send(file);}catch(error){finish(reject,error);}
  });
}
async function accessToken() {
  if (!session) throw new Error('Vui lòng đăng nhập lại.');
  if (session.expires_at * 1000 < Date.now() + 30000) {
    if (!refreshPromise) refreshPromise = request('/auth/v1/token?grant_type=refresh_token', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({refresh_token:session.refresh_token}) }).then(s => { session = {...s,expires_at:s.expires_at || Math.floor(Date.now()/1000)+s.expires_in}; }).catch(e=>{session=null;throw e;}).finally(()=>{refreshPromise=null;});
    await refreshPromise;
  }
  return session.access_token;
}
async function listAll(admin = false) {
  const token = admin ? await accessToken() : null;
  const items = [];
  const limit = 200;
  for (let offset = 0; ; offset += limit) {
    const rows = await request(`/rest/v1/products?select=*&order=batch_date.desc,created_at.desc,id.asc&limit=${limit}&offset=${offset}${admin ? '' : '&is_published=eq.true'}`, { token });
    items.push(...rows);
    if (rows.length < limit) return items;
  }
}
export const repository = {
  async list() {
    if (isPreview) { const {previewProducts} = await import('./preview-products.js'); return structuredClone(previewProducts); }
    return listAll();
  },
  async get(sku) {
    if (isPreview) return (await this.list()).find(p => p.sku === sku) || null;
    const rows = await request(`/rest/v1/products?select=*&sku=eq.${encodeURIComponent(sku)}&is_published=eq.true&limit=1`);
    return rows[0] || null;
  },
  async signIn(email, password) {
    const result = await request('/auth/v1/token?grant_type=password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email,password }) });
    session = {...result,expires_at:result.expires_at || Math.floor(Date.now()/1000)+result.expires_in};
    try {
      const admin = await request('/rest/v1/rpc/is_shop_admin', { method:'POST', token:session.access_token, headers:{'Content-Type':'application/json'}, body:'{}' });
      if (!admin) throw new Error('Tài khoản này không có quyền quản trị Ngọc Nhà Lyn.');
    } catch (e) { await this.signOut().catch(()=>{}); throw e; }
    return result.user;
  },
  async signOut() {
    try { if (session) await request('/auth/v1/logout', { method:'POST', token:session.access_token }); } finally { session=null; }
  },
  async adminList() { return listAll(true); },
  async save(product, expectedUpdatedAt) {
    const token = await accessToken();
    const {id,created_at,updated_at,...payload} = product;
    const path = id ? `/rest/v1/products?id=eq.${encodeURIComponent(id)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}` : '/rest/v1/products';
    const rows = await request(path, { method:id ? 'PATCH':'POST', token, headers:{'Content-Type':'application/json',Prefer:'return=representation'}, body:JSON.stringify(payload) });
    if (!rows?.length) throw new Error('Sản phẩm đã thay đổi ở nơi khác hoặc quyền đã bị thu hồi. Tải lại danh sách trước khi sửa tiếp.');
    return rows[0];
  },
  async remove(product) {
    const token = await accessToken();
    const rows = await request(`/rest/v1/products?id=eq.${encodeURIComponent(product.id)}&updated_at=eq.${encodeURIComponent(product.updated_at)}`,{ method:'DELETE',token,headers:{Prefer:'return=representation'} });
    if (!rows?.length) throw new Error('Sản phẩm đã thay đổi hoặc bạn không còn quyền xóa. Tải lại danh sách.');
  },
  async upload(file, namespace='images',options={}) {
    if(!['images','videos'].includes(namespace))throw new Error('Loại tệp tải lên không hợp lệ.');
    const token = await accessToken();
    const types = namespace === 'videos' ? ['video/mp4','video/webm'] : ['image/jpeg','image/png','image/webp'];
    const max = namespace === 'videos' ? 40*1024*1024 : 8*1024*1024;
    if (!types.includes(file.type) || file.size > max) throw new Error(namespace === 'videos' ? 'Video cần là MP4/WebM, tối đa 40 MB.' : 'Ảnh cần là JPG/PNG/WebP, tối đa 8 MB.');
    const suffix = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm' }[file.type];
    const objectPath = `${namespace}/${crypto.randomUUID()}.${suffix}`;
    await uploadObject(`/storage/v1/object/${config.mediaBucket}/${objectPath}`,file,token,{...options,timeout:namespace==='videos'?300000:180000});
    return `${config.supabaseUrl}/storage/v1/object/public/${config.mediaBucket}/${objectPath}`;
  },
};
