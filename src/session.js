import { one, run } from './db.js';
import { randomToken, nowIso, isoAfter, parseCookies, cookie, deleteCookie } from './util.js';
import { sha256 } from './crypto.js';

const NAME='jlc_session';
export async function loadSession(req,env,{create=true}={}){
  const raw=parseCookies(req)[NAME]||'';
  if(raw){
    const hash=await sha256(raw);const row=await one(env,'SELECT * FROM sessions WHERE id_hash=? AND expires_at>?',[hash,nowIso()]);
    if(row){
      let data={};try{data=JSON.parse(row.data_json||'{}')}catch{}
      return {raw,hash,row,data,csrf:row.csrf,isNew:false,dirty:false};
    }
  }
  if(!create)return null;
  const token=randomToken(32),hash=await sha256(token),csrf=randomToken(24),t=nowIso();
  await run(env,'INSERT INTO sessions(id_hash,user_id,data_json,csrf,expires_at,created_at,updated_at) VALUES(?,NULL,?,?,?, ?,?)',[hash,'{}',csrf,isoAfter(7*86400),t,t]);
  return {raw:token,hash,row:{user_id:null},data:{},csrf,isNew:true,dirty:false};
}
export async function saveSession(env,s){
  await run(env,'UPDATE sessions SET user_id=?,data_json=?,csrf=?,expires_at=?,updated_at=? WHERE id_hash=?',[s.row.user_id||null,JSON.stringify(s.data||{}),s.csrf,isoAfter(7*86400),nowIso(),s.hash]);s.dirty=false;
}
export async function setSessionUser(env,s,userId){s.row.user_id=userId;s.csrf=randomToken(24);s.dirty=true;await saveSession(env,s);}
export async function rotateSession(env,s,userId=null){
  await run(env,'DELETE FROM sessions WHERE id_hash=?',[s.hash]);
  const token=randomToken(32),hash=await sha256(token),csrf=randomToken(24),t=nowIso();
  await run(env,'INSERT INTO sessions(id_hash,user_id,data_json,csrf,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',[hash,userId,JSON.stringify(s.data||{}),csrf,isoAfter(7*86400),t,t]);
  s.raw=token;s.hash=hash;s.row.user_id=userId;s.csrf=csrf;s.isNew=true;s.dirty=false;return s;
}
export async function destroySession(env,s){if(s)await run(env,'DELETE FROM sessions WHERE id_hash=?',[s.hash]);}
export function attachSession(resp,s,{destroy=false}={}){const h=new Headers(resp.headers);if(destroy)h.append('set-cookie',deleteCookie(NAME));else if(s?.isNew)h.append('set-cookie',cookie(NAME,s.raw));return new Response(resp.body,{status:resp.status,statusText:resp.statusText,headers:h});}
export function csrfField(s){return `<input type="hidden" name="_csrf" value="${s.csrf}">`;}
export function csrfOk(req,s,body={}){const got=String(body._csrf||req.headers.get('x-csrf-token')||'');return got&&got===s.csrf;}
