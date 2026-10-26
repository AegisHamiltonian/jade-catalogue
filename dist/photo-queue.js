// The ordered media list owns cover selection, uploads, retries and persistence.
// Pending/failed selections stay visible; only a fully ready list can be saved.
export class PhotoQueue {
  constructor({upload,prepare=async file=>file,onChange=()=>{},preview=file=>URL.createObjectURL(file),release=url=>URL.revokeObjectURL(url),admit=()=>{}}){
    Object.assign(this,{upload,prepare,onChange,preview,release,admit});this.items=[];this.generation=0;this.task=null;
  }
  get busy(){return this.items.some(i=>['queued','preparing','uploading'].includes(i.status));}
  get hasErrors(){return this.items.some(i=>i.status==='error');}
  get urls(){if(this.busy||this.hasErrors)throw new Error('Ảnh chưa tải xong. Hãy đợi, thử lại hoặc gỡ ảnh bị lỗi.');return this.items.map(i=>i.url);}
  emit(){this.onChange();}
  reset(urls=[]){
    this.generation++;for(const i of this.items){i.controller?.abort();if(i.preview)this.release(i.preview);}
    this.items=[...new Set(urls)].filter(Boolean).map(url=>({id:crypto.randomUUID(),url,status:'ready',progress:100,name:'Ảnh sản phẩm'}));this.emit();
  }
  add(files){
    if(this.items.length+files.length>12)throw new Error('Một sản phẩm có tối đa 12 ảnh.');
    for(const file of files){
      const item={id:crypto.randomUUID(),file,name:file.name,status:'queued',progress:0,error:'',url:null,preview:null};
      try{this.admit(file);item.preview=this.preview(file);}catch(error){item.status='error';item.error=error.message;}
      this.items.push(item);
    }
    this.emit();return this.start();
  }
  cover(id){const index=this.items.findIndex(i=>i.id===id);if(index<1)return;const[item]=this.items.splice(index,1);this.items.unshift(item);this.emit();}
  remove(id){const index=this.items.findIndex(i=>i.id===id);if(index<0)return;const[item]=this.items.splice(index,1);item.controller?.abort();if(item.preview)this.release(item.preview);this.emit();}
  pause(){
    for(const item of this.items)if(['queued','preparing','uploading'].includes(item.status)){
      item.status='error';item.error='Đã dừng tải. Bấm Thử lại để tiếp tục.';item.controller?.abort();
    }
    this.emit();
  }
  retry(id){const item=this.items.find(i=>i.id===id);if(!item||item.status!=='error')return this.task||Promise.resolve();item.status='queued';item.error='';item.progress=0;this.emit();return this.start();}
  start(){
    if(this.task)return this.task;
    const generation=this.generation;
    this.task=this.drain(generation).finally(()=>{this.task=null;if(this.items.some(i=>i.status==='queued'))this.start();});
    return this.task;
  }
  async drain(generation){
    let item;
    while(generation===this.generation&&(item=this.items.find(i=>i.status==='queued'))){
      const controller=new AbortController();item.controller=controller;item.status='preparing';this.emit();
      const active=()=>generation===this.generation&&this.items.includes(item)&&!controller.signal.aborted;
      try{
        const file=await this.prepare(item.file,{signal:controller.signal});if(!active())continue;
        if(file!==item.file){if(item.preview)this.release(item.preview);item.preview=this.preview(file);}
        item.status='uploading';this.emit();
        const url=await this.upload(file,'images',{signal:controller.signal,onProgress:progress=>{if(active()){item.progress=Math.min(100,Math.max(0,progress));this.emit();}}});
        if(!active())continue;
        if(!/^https:\/\//i.test(url)&&!/^\.\/assets\/[a-z0-9.-]+$/i.test(url))throw new Error('Máy chủ chưa trả về ảnh hợp lệ. Hãy thử tải lại.');
        item.url=url;item.status='ready';item.progress=100;item.error='';
      }catch(error){if(active()){item.status='error';item.error=error.message||'Không tải được ảnh. Hãy thử lại.';}}
      finally{item.controller=null;this.emit();}
    }
  }
}
