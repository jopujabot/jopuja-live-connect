import { nowIso } from './util.js';

let schemaPromise = null;

const SCHEMA = [
`CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT,updated_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS tenants(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'owner',status TEXT NOT NULL DEFAULT 'pending',telegram_user_id TEXT,telegram_chat_id TEXT,telegram_username TEXT,telegram_verified_at TEXT,last_login_at TEXT,created_at TEXT NOT NULL,FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS sessions(id_hash TEXT PRIMARY KEY,user_id INTEGER,data_json TEXT NOT NULL DEFAULT '{}',csrf TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL)`,
`CREATE INDEX IF NOT EXISTS ix_sessions_exp ON sessions(expires_at)`,
`CREATE TABLE IF NOT EXISTS telegram_links(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token TEXT NOT NULL UNIQUE,purpose TEXT NOT NULL DEFAULT 'register',expires_at TEXT NOT NULL,used_at TEXT,created_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS otp_codes(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,purpose TEXT NOT NULL,code_hash TEXT NOT NULL,expires_at TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,used_at TEXT,created_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS ix_otp_user ON otp_codes(user_id,purpose,created_at)`,
`CREATE TABLE IF NOT EXISTS login_attempts(id INTEGER PRIMARY KEY AUTOINCREMENT,identity TEXT NOT NULL,ip TEXT NOT NULL,ok INTEGER NOT NULL,created_at TEXT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS ix_login_attempts ON login_attempts(identity,ip,created_at)`,
`CREATE TABLE IF NOT EXISTS user_preferences(user_id INTEGER PRIMARY KEY,theme TEXT NOT NULL DEFAULT 'system',sound TEXT NOT NULL DEFAULT 'soft',sound_asset_key TEXT,notifications_json TEXT NOT NULL DEFAULT '{}',updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS plans(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,price INTEGER NOT NULL DEFAULT 0,duration_days INTEGER NOT NULL DEFAULT 30,domain_limit INTEGER NOT NULL DEFAULT 1,bot_limit INTEGER NOT NULL DEFAULT 1,agent_limit INTEGER NOT NULL DEFAULT 1,history_days INTEGER NOT NULL DEFAULT 30,features_json TEXT NOT NULL DEFAULT '{}',is_active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS subscriptions(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,plan_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'active',starts_at TEXT NOT NULL,ends_at TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,FOREIGN KEY(plan_id) REFERENCES plans(id))`,
`CREATE INDEX IF NOT EXISTS ix_subs_tenant ON subscriptions(tenant_id,status,ends_at)`,
`CREATE TABLE IF NOT EXISTS upgrade_requests(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,plan_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',note TEXT,created_at TEXT NOT NULL,decided_at TEXT,FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,FOREIGN KEY(plan_id) REFERENCES plans(id))`,
`CREATE TABLE IF NOT EXISTS domains(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,domain TEXT NOT NULL,public_key TEXT NOT NULL UNIQUE,verify_token TEXT NOT NULL,verified_at TEXT,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,UNIQUE(tenant_id,domain),FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS ix_domains_tenant ON domains(tenant_id,status)`,
`CREATE TABLE IF NOT EXISTS widget_settings(domain_id INTEGER PRIMARY KEY,title TEXT NOT NULL DEFAULT 'Live Support',welcome TEXT NOT NULL DEFAULT 'Halo 👋 Ada yang bisa kami bantu?',position TEXT NOT NULL DEFAULT 'right',theme TEXT NOT NULL DEFAULT 'auto',accent TEXT NOT NULL DEFAULT '#C6A265',icon TEXT NOT NULL DEFAULT 'chat',custom_icon_key TEXT,require_name INTEGER NOT NULL DEFAULT 1,require_phone INTEGER NOT NULL DEFAULT 0,require_email INTEGER NOT NULL DEFAULT 0,offline_message TEXT NOT NULL DEFAULT 'Tim sedang offline. Tinggalkan pesan ya.',business_hours_json TEXT NOT NULL DEFAULT '{}',launcher_label TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL,FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS bots(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'livechat',token_enc TEXT NOT NULL,bot_username TEXT,notification_chat_id TEXT,bind_token TEXT,webhook_secret TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS ix_bots_tenant ON bots(tenant_id,status)`,
`CREATE TABLE IF NOT EXISTS domain_bots(domain_id INTEGER PRIMARY KEY,bot_id INTEGER NOT NULL UNIQUE,FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE,FOREIGN KEY(bot_id) REFERENCES bots(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS team_members(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,user_id INTEGER NOT NULL,team_role TEXT NOT NULL DEFAULT 'agent',permissions_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL,UNIQUE(tenant_id,user_id),FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS admin_bots(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,token_enc TEXT NOT NULL,chat_id TEXT NOT NULL,event_types TEXT NOT NULL DEFAULT '*',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS visitors(id INTEGER PRIMARY KEY AUTOINCREMENT,domain_id INTEGER NOT NULL,visitor_key TEXT NOT NULL,ip_hash TEXT,user_agent TEXT,referrer TEXT,last_url TEXT,country TEXT,status TEXT NOT NULL DEFAULT 'online',first_seen_at TEXT NOT NULL,last_seen_at TEXT NOT NULL,UNIQUE(domain_id,visitor_key),FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS ix_visitors_live ON visitors(domain_id,last_seen_at)`,
`CREATE TABLE IF NOT EXISTS chats(id INTEGER PRIMARY KEY AUTOINCREMENT,domain_id INTEGER NOT NULL,visitor_id INTEGER NOT NULL,code TEXT NOT NULL UNIQUE,name TEXT,phone TEXT,email TEXT,status TEXT NOT NULL DEFAULT 'open',assigned_user_id INTEGER,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE,FOREIGN KEY(visitor_id) REFERENCES visitors(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS ix_chats_domain ON chats(domain_id,status,updated_at)`,
`CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,chat_id INTEGER NOT NULL,sender_type TEXT NOT NULL,sender_id TEXT,body TEXT NOT NULL,telegram_message_id TEXT,created_at TEXT NOT NULL,FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS ix_messages_chat ON messages(chat_id,id)`,
`CREATE INDEX IF NOT EXISTS ix_messages_tg ON messages(telegram_message_id)`,
`CREATE TABLE IF NOT EXISTS pageviews(id INTEGER PRIMARY KEY AUTOINCREMENT,domain_id INTEGER NOT NULL,visitor_id INTEGER NOT NULL,url TEXT NOT NULL,referrer TEXT,created_at TEXT NOT NULL,FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE,FOREIGN KEY(visitor_id) REFERENCES visitors(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS ix_pageviews_domain ON pageviews(domain_id,created_at)`,
`CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER,user_id INTEGER,event_type TEXT NOT NULL,risk INTEGER NOT NULL DEFAULT 0,ip TEXT,user_agent TEXT,metadata_json TEXT NOT NULL DEFAULT '{}',prev_hash TEXT,entry_hash TEXT NOT NULL,created_at TEXT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS ix_audit_recent ON audit_logs(id DESC)`,
`CREATE TABLE IF NOT EXISTS diagnostics(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER,domain_id INTEGER,level TEXT NOT NULL,code TEXT NOT NULL,message TEXT NOT NULL,details_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS api_keys(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,name TEXT NOT NULL,key_hash TEXT NOT NULL,prefix TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,last_used_at TEXT,FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS outbound_webhooks(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,name TEXT NOT NULL,url TEXT NOT NULL,secret_enc TEXT NOT NULL,event_types TEXT NOT NULL DEFAULT '*',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS quick_replies(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,shortcut TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(tenant_id,shortcut),FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS automation_rules(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER NOT NULL,name TEXT NOT NULL,event_type TEXT NOT NULL,action_type TEXT NOT NULL,action_json TEXT NOT NULL DEFAULT '{}',enabled INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS media_assets(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER,user_id INTEGER,domain_id INTEGER,kind TEXT NOT NULL,r2_key TEXT NOT NULL UNIQUE,mime TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS system_jobs(id INTEGER PRIMARY KEY AUTOINCREMENT,job_type TEXT NOT NULL,status TEXT NOT NULL,details_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL,finished_at TEXT)`,
`CREATE TABLE IF NOT EXISTS rate_limits(bucket TEXT NOT NULL,window_key TEXT NOT NULL,count INTEGER NOT NULL,expires_at TEXT NOT NULL,PRIMARY KEY(bucket,window_key))`
];

export async function ensureSchema(env){
  if(schemaPromise) return schemaPromise;
  schemaPromise=(async()=>{
    try{
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT,updated_at TEXT NOT NULL)`).run();
      const v=await one(env,`SELECT v FROM settings WHERE k='schema_version'`);
      if(v?.v==='2.1.0') return;
      const CHUNK=12;
      for(let i=0;i<SCHEMA.length;i+=CHUNK){
        await env.DB.batch(SCHEMA.slice(i,i+CHUNK).map(sql=>env.DB.prepare(sql)));
      }
      const t=nowIso();
      await env.DB.batch([
        env.DB.prepare(`INSERT OR IGNORE INTO plans(name,price,duration_days,domain_limit,bot_limit,agent_limit,history_days,features_json,is_active,created_at) VALUES('Bronze',99000,30,1,1,2,30,?,1,?)`).bind(JSON.stringify({analytics:'basic',branding:true,api:false,webhook:false}),t),
        env.DB.prepare(`INSERT OR IGNORE INTO plans(name,price,duration_days,domain_limit,bot_limit,agent_limit,history_days,features_json,is_active,created_at) VALUES('Silver',199000,30,3,3,5,90,?,1,?)`).bind(JSON.stringify({analytics:'advanced',branding:false,api:true,webhook:true}),t),
        env.DB.prepare(`INSERT OR IGNORE INTO plans(name,price,duration_days,domain_limit,bot_limit,agent_limit,history_days,features_json,is_active,created_at) VALUES('Gold',399000,30,10,10,20,3650,?,1,?)`).bind(JSON.stringify({analytics:'full',branding:false,api:true,webhook:true}),t),
        env.DB.prepare(`INSERT INTO settings(k,v,updated_at) VALUES('schema_version','2.1.0',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,updated_at=excluded.updated_at`).bind(t)
      ]);
    }catch(err){ schemaPromise=null; throw err; }
  })();
  return schemaPromise;
}

export async function one(env,sql,args=[]){ return await env.DB.prepare(sql).bind(...args).first(); }
export async function all(env,sql,args=[]){ const r=await env.DB.prepare(sql).bind(...args).all(); return r.results||[]; }
export async function run(env,sql,args=[]){ return await env.DB.prepare(sql).bind(...args).run(); }
export async function insert(env,sql,args=[]){ const r=await run(env,sql,args); return Number(r.meta?.last_row_id||0); }
export async function batch(env,queries){ return await env.DB.batch(queries.map(([sql,args=[]])=>env.DB.prepare(sql).bind(...args))); }
export async function setting(env,k,def=null){ const r=await one(env,'SELECT v FROM settings WHERE k=?',[k]); return r?.v??def; }
export async function setSetting(env,k,v){ await run(env,`INSERT INTO settings(k,v,updated_at) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,updated_at=excluded.updated_at`,[k,String(v),nowIso()]); }
