import { one } from './db.js';
import { nowIso } from './util.js';
export async function currentPlan(env,tenantId){return one(env,`SELECT p.*,s.status subscription_status,s.ends_at FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.tenant_id=? AND s.status IN ('active','trial') AND s.ends_at>? ORDER BY s.id DESC LIMIT 1`,[tenantId,nowIso()]);}
export async function allowResource(env,tenantId,resource){const p=await currentPlan(env,tenantId);if(!p)return false;const map={domains:['domains','domain_limit'],bots:['bots','bot_limit'],agents:['team_members','agent_limit']};if(!map[resource])return true;const [table,col]=map[resource];const r=await one(env,`SELECT COUNT(*) c FROM ${table} WHERE tenant_id=?`,[tenantId]);return Number(r?.c||0)<Number(p[col]||0);}
