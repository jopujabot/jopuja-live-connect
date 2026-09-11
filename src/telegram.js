import { vaultDecrypt, vaultEncrypt } from './auth_crypto.js';
import { one, setting, setSetting } from './db.js';

export function normalizeToken(v){return String(v||'').replace(/\s+/g,'').trim();}
export async function tgCall(token,method,payload={}){
  token=normalizeToken(token);if(!token)return {ok:false,description:'Token kosong.'};
  try{
    const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json','accept':'application/json','user-agent':'JOPUJA-LIVE-CONNECT-CF/2.1'},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>null);if(!d)return {ok:false,description:`Telegram HTTP ${r.status}`,transport_error:true};return d;
  }catch(err){return {ok:false,description:String(err?.message||err),transport_error:true};}
}
export async function tgSend(token,chatId,text,extra={}){return tgCall(token,'sendMessage',{chat_id:String(chatId),text,parse_mode:'HTML',disable_web_page_preview:true,...extra});}
export async function authBot(env){const raw=await setting(env,'auth_bot');if(!raw)return null;let d;try{d=JSON.parse(raw)}catch{return null}if(!d.token_enc)return null;return {...d,token:await vaultDecrypt(env,d.token_enc)};}
export async function saveAuthBot(env,{token,username,webhook_secret}){const data={token_enc:await vaultEncrypt(env,normalizeToken(token)),username:String(username||'').replace(/^@/,''),webhook_secret};await setSetting(env,'auth_bot',JSON.stringify(data));return data;}
export async function domainBot(env,domainId){const b=await one(env,`SELECT b.* FROM bots b JOIN domain_bots db ON db.bot_id=b.id WHERE db.domain_id=? AND b.status='active' LIMIT 1`,[domainId]);if(!b)return null;return {...b,token:await vaultDecrypt(env,b.token_enc)};}
