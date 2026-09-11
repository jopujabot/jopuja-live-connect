export const te = new TextEncoder();
export const td = new TextDecoder();

export function nowIso(){ return new Date().toISOString().replace('T',' ').replace('Z','').slice(0,19); }
export function isoAfter(seconds){ return new Date(Date.now()+seconds*1000).toISOString().replace('T',' ').replace('Z','').slice(0,19); }
export function unix(){ return Math.floor(Date.now()/1000); }
export function e(v=''){ return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
export function attr(v=''){ return e(v); }
export function randomToken(bytes=24){ const a=new Uint8Array(bytes); crypto.getRandomValues(a); return b64url(a); }
export function randomCode(){ const a=new Uint32Array(1); crypto.getRandomValues(a); return String(100000+(a[0]%900000)); }
export function chatCode(){ return randomToken(8).replace(/[-_]/g,'').slice(0,8).toUpperCase(); }
export function b64(bytes){ let s=''; for(const b of bytes)s+=String.fromCharCode(b); return btoa(s); }
export function unb64(s){ const raw=atob(s); const out=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i); return out; }
export function b64url(bytes){ return b64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
export function unb64url(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return unb64(s); }
export function json(data,status=200,headers={}){ return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}}); }
export function html(body,status=200,headers={}){ return new Response(body,{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store',...headers}}); }
export function redirect(location,status=303,headers={}){ return new Response(null,{status,headers:{location,...headers}}); }
export function text(body,status=200,headers={}){ return new Response(body,{status,headers:{'content-type':'text/plain; charset=utf-8',...headers}}); }
export function parseCookies(req){ const out={}; const s=req.headers.get('cookie')||''; for(const p of s.split(';')){ const i=p.indexOf('='); if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim()); } return out; }
export function cookie(name,value,{maxAge=604800,path='/',httpOnly=true,secure=true,sameSite='Lax'}={}){ const bits=[`${name}=${encodeURIComponent(value)}`,`Path=${path}`,`Max-Age=${maxAge}`,`SameSite=${sameSite}`]; if(httpOnly)bits.push('HttpOnly'); if(secure)bits.push('Secure'); return bits.join('; '); }
export function deleteCookie(name){ return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`; }
export function clientIp(req){ return req.headers.get('CF-Connecting-IP')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'0.0.0.0'; }
export function ua(req){ return (req.headers.get('user-agent')||'').slice(0,600); }
export function cfCountry(req){ return req.cf?.country||''; }
export function originHost(url){ try{return new URL(url).hostname.toLowerCase()}catch{return ''} }
export function normalizeDomain(raw){ let s=String(raw||'').trim().toLowerCase(); s=s.replace(/^https?:\/\//,'').replace(/\/$/,''); s=s.split('/')[0].split(':')[0]; return /^[a-z0-9.-]+$/.test(s)?s:''; }
export function sameDomain(host,domain){ host=String(host||'').toLowerCase(); domain=String(domain||'').toLowerCase(); return host===domain||host===`www.${domain}`||`www.${host}`===domain; }
export async function form(req){ const ct=req.headers.get('content-type')||''; if(ct.includes('application/json')) return await req.json().catch(()=>({})); const fd=await req.formData(); return Object.fromEntries(fd.entries()); }
export function selected(a,b){ return String(a)===String(b)?' selected':''; }
export function checked(v){ return Number(v)?' checked':''; }
export function money(n){ return new Intl.NumberFormat('id-ID').format(Number(n||0)); }
export function sanitizeColor(v){ return /^#[0-9a-f]{6}$/i.test(v||'')?v:'#C6A265'; }
export function safeInt(v,d=0){ const n=Number.parseInt(v,10); return Number.isFinite(n)?n:d; }
export function cap(s,n){ return String(s||'').slice(0,n); }
export function securityHeaders(resp){ const h=new Headers(resp.headers); h.set('x-content-type-options','nosniff'); h.set('x-frame-options','DENY'); h.set('referrer-policy','strict-origin-when-cross-origin'); h.set('permissions-policy','camera=(), microphone=(), geolocation=()'); h.set('strict-transport-security','max-age=31536000; includeSubDomains'); h.set('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.telegram.org wss:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"); return new Response(resp.body,{status:resp.status,statusText:resp.statusText,headers:h}); }
export function baseUrl(req){ const u=new URL(req.url); return `${u.protocol}//${u.host}`; }
export function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
