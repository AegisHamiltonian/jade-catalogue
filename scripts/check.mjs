import { readFile, stat, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const root=path.resolve('dist');
const {config}=await import('../dist/config.js');
if(config.supabasePublishableKey.startsWith('sb_secret_'))throw new Error('Secret keys must never be deployed.');
if(config.supabasePublishableKey.startsWith('eyJ')){
 const payload=JSON.parse(Buffer.from(config.supabasePublishableKey.split('.')[1],'base64url').toString());
 if(payload.role!=='anon')throw new Error('Only a public anon/publishable key may be deployed.');
}
if(!['preview','supabase'].includes(config.dataSource))throw new Error('Unknown data source.');
if(config.dataSource==='supabase'&&(!config.supabaseUrl.startsWith('https://')||!config.supabasePublishableKey))throw new Error('Missing live Supabase configuration.');
const files=await readdir(root,{recursive:true});
for(const file of files){
 const absolute=path.join(root,file);if(!(await stat(absolute)).isFile())continue;
 if(file.endsWith('.js'))execFileSync(process.execPath,['--check',absolute]);
 if(file.endsWith('.html')){
  const html=await readFile(absolute,'utf8');
  for(const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g))await stat(path.resolve(path.dirname(absolute),match[1]));
  if(!html.includes('lang="vi"'))throw new Error(`${file}: Missing Vietnamese language`);
 }
}
const css=await readFile(path.join(root,'styles.css'),'utf8');
for(const match of css.matchAll(/url\('(\.\/[^']+)'\)/g))await stat(path.resolve(root,match[1]));
console.log('JavaScript syntax, local HTML/CSS asset references and page language: PASS');
