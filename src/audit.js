import { all, insert, one } from './db.js';
import { hmacHex, sha256 } from './crypto.js';
import { vaultDecrypt } from './auth_crypto.js';
import { nowIso, clientIp, ua } from './util.js';
import { tgSend } from './telegram.js';

export async function audit(env,ctx,{event,risk=0,metadata={},tenantId=null,userId=null,request=null}){
  const prev=await one(env,'SELECT entry_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
  const created=nowIso();
  const canonical=JSON.stringify({tenantId,userId,event,risk,metadata,created,prev:prev?.entry_hash||''});
  const entry=await sha256(canonical);
  await insert(env,'INSERT INTO audit_logs(tenant_id,user_id,event_type,risk,ip,user_agent,metadata_json,prev_hash,entry_hash,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',[tenantId,userId,event,risk,request?clientIp(request):'',request?ua(request):'',JSON.stringify(metadata||{}),prev?.entry_hash||'',entry,created]);
  if(ctx?.waitUntil)ctx.waitUntil(notify(env,{event,risk,metadata,tenantId,userId,created}).catch(()=>{}));
}
async function notify(env,evt){
  const bots=await all(env,"SELECT * FROM admin_bots WHERE status='active'");
  for(const b of bots){
    const allowed=b.event_types==='*'||String(b.event_types||'').split(',').map(x=>x.trim()).includes(evt.event);if(!allowed)continue;
    try{const token=await vaultDecrypt(env,b.token_enc);const meta=Object.entries(evt.metadata||{}).slice(0,8).map(([k,v])=>`${k}: ${String(v).slice(0,180)}`).join('\n');await tgSend(token,b.chat_id,`🛡️ <b>${escapeHtml(evt.event)}</b>\nRisk: ${evt.risk}\nTenant: ${evt.tenantId??'-'}\nUser: ${evt.userId??'-'}\n${meta?`\n${escapeHtml(meta)}`:''}`);}catch{}
  }
  const hooks=await all(env,"SELECT * FROM outbound_webhooks WHERE status='active' AND (? IS NULL OR tenant_id=?)",[evt.tenantId,evt.tenantId]);
  for(const h of hooks){
    const allowed=h.event_types==='*'||String(h.event_types||'').split(',').map(x=>x.trim()).includes(evt.event);if(!allowed)continue;
    try{const secret=await vaultDecrypt(env,h.secret_enc);const body=JSON.stringify(evt);const sig=await hmacHex(secret,body);await fetch(h.url,{method:'POST',headers:{'content-type':'application/json','x-jlc-signature':sig,'user-agent':'JOPUJA-LIVE-CONNECT/2.1'},body});}catch{}
  }
}
function escapeHtml(v){return String(v||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
