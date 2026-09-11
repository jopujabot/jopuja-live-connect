export class LiveHub {
  constructor(ctx,env){this.ctx=ctx;this.env=env;}
  async fetch(request){
    const u=new URL(request.url);
    if(request.method==='POST'&&u.pathname==='/broadcast'){
      const data=await request.json().catch(()=>({}));this.broadcast(data);return new Response('ok');
    }
    if(request.headers.get('Upgrade')!=='websocket')return new Response('WebSocket required',{status:426});
    const pair=new WebSocketPair();const [client,server]=Object.values(pair);const attachment={role:u.searchParams.get('role')||'visitor',visitor_key:u.searchParams.get('visitor_key')||'',chat_id:Number(u.searchParams.get('chat_id')||0),user_id:Number(u.searchParams.get('user_id')||0)};
    server.serializeAttachment(attachment);this.ctx.acceptWebSocket(server);server.send(JSON.stringify({type:'ready',ts:Date.now()}));return new Response(null,{status:101,webSocket:client});
  }
  webSocketMessage(ws,message){
    let a={};try{a=ws.deserializeAttachment()||{}}catch{};if(String(message)==='ping'){ws.send('pong');return;}try{const d=JSON.parse(String(message));if(d.type==='ping')ws.send(JSON.stringify({type:'pong',ts:Date.now(),role:a.role}));}catch{}
  }
  webSocketClose(ws,code,reason){try{ws.close(code,reason)}catch{}}
  webSocketError(ws){try{ws.close(1011,'error')}catch{}}
  broadcast(data){
    const txt=JSON.stringify(data);for(const ws of this.ctx.getWebSockets()){
      try{const a=ws.deserializeAttachment()||{};let ok=false;if(a.role==='agent')ok=!a.chat_id||!data.chat_id||Number(a.chat_id)===Number(data.chat_id);else ok=!!data.visitor_key&&a.visitor_key===data.visitor_key;if(ok)ws.send(txt);}catch{}
    }
  }
}
export async function hubBroadcast(env,domainId,data){const id=env.LIVE_HUB.idFromName(`domain:${domainId}`);const stub=env.LIVE_HUB.get(id);await stub.fetch('https://hub/broadcast',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});}
export function hubStub(env,domainId){return env.LIVE_HUB.get(env.LIVE_HUB.idFromName(`domain:${domainId}`));}
