import { one } from './db.js';
export async function can(env,user,permission){
  if(!user)return false;if(['super_admin','owner'].includes(user.role))return true;
  const tm=await one(env,'SELECT * FROM team_members WHERE tenant_id=? AND user_id=?',[user.tenant_id,user.id]);if(!tm)return false;
  const defaults={admin:['view_chat','reply_chat','view_analytics','manage_domain','manage_bot','manage_widget','manage_team','manage_notifications','manage_api','manage_automation','diagnostics'],supervisor:['view_chat','reply_chat','view_analytics','manage_widget','manage_notifications','diagnostics'],agent:['view_chat','reply_chat'],viewer:['view_chat','view_analytics']};
  let custom={};try{custom=JSON.parse(tm.permissions_json||'{}')}catch{} if(Object.hasOwn(custom,permission))return !!custom[permission];return (defaults[tm.team_role]||[]).includes(permission);
}
