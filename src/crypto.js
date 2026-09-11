import { te, td, b64, unb64, randomToken } from './util.js';

export async function sha256(input){
  const buf=await crypto.subtle.digest('SHA-256',te.encode(String(input)));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function hmacHex(secret,input){
  const key=await crypto.subtle.importKey('raw',te.encode(String(secret)),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('HMAC',key,te.encode(String(input)));
  return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function timingSafeEqual(a,b){
  a=String(a||''); b=String(b||''); if(a.length!==b.length)return false; let x=0; for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i); return x===0;
}
export async function hashPassword(password){
  const salt=new Uint8Array(16);crypto.getRandomValues(salt);const iterations=310000;
  const material=await crypto.subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},material,256);
  return `pbkdf2_sha256$${iterations}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}
export async function verifyPassword(password,stored){
  const p=String(stored||'').split('$');if(p.length!==4||p[0]!=='pbkdf2_sha256')return false;
  const iterations=Number(p[1]);const salt=unb64(p[2]);const expected=unb64(p[3]);
  const material=await crypto.subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},material,expected.length*8));
  if(bits.length!==expected.length)return false;let x=0;for(let i=0;i<bits.length;i++)x|=bits[i]^expected[i];return x===0;
}
export function validatePassword(password){
  if(String(password).length<10)return 'Password minimal 10 karakter.';
  if(!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password))return 'Password wajib punya huruf besar, kecil, dan angka.';
  return null;
}
export function secretToken(len=32){ return randomToken(Math.ceil(len*0.75)).slice(0,len); }
