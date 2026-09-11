import { hashPassword, verifyPassword } from './crypto.js';

const te=new TextEncoder();
const td=new TextDecoder();
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function unb64(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
async function importAes(raw){return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);}
async function importHmac(raw){return crypto.subtle.importKey('raw',raw,{name:'HMAC',hash:'SHA-256'},false,['sign']);}

// AuthCrypto juga menjadi security vault. Master key dibuat otomatis sekali,
// disimpan di Durable Object storage, dan tidak pernah ditaruh di D1 atau UI.
export class AuthCrypto {
  constructor(ctx, env){this.ctx=ctx;this.env=env;}
  async master(){
    let raw=await this.ctx.storage.get('vault_master_key');
    if(!raw){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);raw=b64(bytes);await this.ctx.storage.put('vault_master_key',raw);}
    return unb64(raw);
  }
  async fetch(request){
    if(request.method!=='POST') return new Response('Method Not Allowed',{status:405});
    const body=await request.json().catch(()=>({}));
    try{
      if(body.action==='hash'){
        const password=String(body.password||'');
        if(!password||password.length>256)return Response.json({ok:false,error:'invalid_password'},{status:400});
        return Response.json({ok:true,hash:await hashPassword(password)});
      }
      if(body.action==='verify'){
        const password=String(body.password||'');
        if(!password||password.length>256)return Response.json({ok:false,error:'invalid_password'},{status:400});
        return Response.json({ok:true,valid:await verifyPassword(password,String(body.hash||''))});
      }
      const master=await this.master();
      if(body.action==='seal'){
        const iv=new Uint8Array(12);crypto.getRandomValues(iv);const key=await importAes(master);
        const enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,te.encode(String(body.value??'')));
        return Response.json({ok:true,value:`vault1:${b64(iv)}:${b64(new Uint8Array(enc))}`});
      }
      if(body.action==='unseal'){
        const p=String(body.value||'').split(':');if(p.length!==3||p[0]!=='vault1')return Response.json({ok:false,error:'invalid_ciphertext'},{status:400});
        const key=await importAes(master);const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(p[1])},key,unb64(p[2]));
        return Response.json({ok:true,value:td.decode(dec)});
      }
      if(body.action==='digest'){
        const key=await importHmac(master);const sig=await crypto.subtle.sign('HMAC',key,te.encode(String(body.value??'')));
        return Response.json({ok:true,value:[...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,'0')).join('')});
      }
      if(body.action==='status')return Response.json({ok:true,ready:true});
      return Response.json({ok:false,error:'invalid_action'},{status:400});
    }catch(err){console.error('AuthCrypto:',err);return Response.json({ok:false,error:'crypto_failed'},{status:500});}
  }
}

async function call(env,payload){
  if(!env.AUTH_CRYPTO) throw new Error('Security Vault Durable Object belum terikat. Deploy ulang project.');
  const id=env.AUTH_CRYPTO.idFromName('jopuja-security-vault');
  const stub=env.AUTH_CRYPTO.get(id);
  const res=await stub.fetch('https://security-vault.internal/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const out=await res.json().catch(()=>({}));
  if(!res.ok||!out.ok) throw new Error('Security Vault gagal memproses data.');
  return out;
}
export async function edgeHashPassword(env,password){return (await call(env,{action:'hash',password})).hash;}
export async function edgeVerifyPassword(env,password,hash){return !!(await call(env,{action:'verify',password,hash})).valid;}
export async function vaultEncrypt(env,value){return (await call(env,{action:'seal',value:String(value??'')})).value;}
export async function vaultDecrypt(env,value){return (await call(env,{action:'unseal',value:String(value||'')})).value;}
export async function vaultDigest(env,value){return (await call(env,{action:'digest',value:String(value??'')})).value;}
export async function vaultReady(env){try{return !!(await call(env,{action:'status'})).ready}catch{return false}}
