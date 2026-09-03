import { getStore } from "@edgeone/pages-blob";

const SUBJECTS = new Set([
  "japanese","social","math","science","music","art","pe","tech_home","english"
]);
const FEEDBACK_KINDS = new Set(["fun","learn","request","bug"]);
const MAX_FEEDBACK = 3000;

const SEED = [
  {id:"ion-battle",title:"イオンカードゲーム",icon:"🧪",subject:"science",creator:"打越T",description:"イオンを組み合わせ、完成物をつくって戦うカードゲーム。",url:"",isNew:false,approvedAt:1},
  {id:"busshitsu-lab",title:"物質追究ラボ",icon:"🔬",subject:"science",creator:"打越T",description:"実験・推理・研究をくり返して、謎の物質を追究する。",url:"",isNew:false,approvedAt:2},
  {id:"science-breakers",title:"サイエンスブレーカー",icon:"💥",subject:"science",creator:"打越T",description:"問題を解いて報酬を獲得し、科学の世界を攻略する。",url:"",isNew:false,approvedAt:3},
  {id:"force-lab",title:"力の矢印ゲーム",icon:"🏹",subject:"science",creator:"打越T",description:"作用点・向き・大きさを見抜いて、力を矢印で表そう。",url:"",isNew:false,approvedAt:4}
];

function out(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      "x-content-type-options":"nosniff"
    }
  });
}
function clean(v,max){return String(v??"").trim().slice(0,max)}
function normalizeText(v,max){
  return clean(v,max).replace(/[\u200B-\u200D\uFEFF]/g,"").replace(/\s{3,}/g,"  ");
}
function goodUrl(v){
  try{
    const u=new URL(v);
    return u.protocol==="http:"||u.protocol==="https:";
  }catch{return false}
}
function sanitize(raw,{allowEmptyUrl=false}={}){
  const title=clean(raw?.title,80);
  const icon=clean(raw?.icon,12)||"🎮";
  const subject=SUBJECTS.has(raw?.subject)?raw.subject:"science";
  const creator=clean(raw?.creator,50);
  const description=clean(raw?.description,180);
  const url=clean(raw?.url,700);
  if(!title)throw new Error("タイトルを入力してください。");
  if((!allowEmptyUrl||url)&&!goodUrl(url))throw new Error("公開URLを正しく入力してください。");

  return {
    id:clean(raw?.id,120)||`game-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
    title,creator:creator||"CREATOR未設定",icon,subject,description,url,
    isNew:Boolean(raw?.isNew),
    submittedAt:Number(raw?.submittedAt)||Date.now(),
    approvedAt:Number(raw?.approvedAt)||0
  };
}
function publicGame(g){
  const {_creatorKeyHash,...rest}=g||{};
  return rest;
}
function publicPending(g){
  const {_creatorKeyHash,...rest}=g||{};
  return rest;
}
async function readApproved(store){
  const data=await store.get("games.json",{type:"json",consistency:"strong"});
  if(!Array.isArray(data)) return SEED;
  return data.map(g=>({...g,creator:clean(g?.creator,50)||"CREATOR未設定",subject:SUBJECTS.has(g?.subject)?g.subject:"science"}));
}
async function readPending(store){
  const data=await store.get("pending.json",{type:"json",consistency:"strong"});
  if(!Array.isArray(data)) return [];
  return data.map(g=>({...g,creator:clean(g?.creator,50)||"CREATOR未設定",subject:SUBJECTS.has(g?.subject)?g.subject:"science"}));
}
async function backupApproved(store,games,reason="mutation"){
  try{
    await store.setJSON("games-backup.json",{
      savedAt:Date.now(),
      reason,
      games:Array.isArray(games)?games:[]
    });
  }catch(err){
    console.warn("backup failed",err);
  }
}
async function readAnalytics(store){
  const data=await store.get("analytics.json",{type:"json",consistency:"strong"});
  return data && typeof data==="object" ? data : {
    totalVisits:0,totalPlays:0,byDate:{},gamePlays:{}
  };
}
async function readFeedback(store){
  const data=await store.get("feedback.json",{type:"json",consistency:"strong"});
  return Array.isArray(data)?data:[];
}
function feedbackSummary(list){
  const map={};
  for(const f of list){
    if(f?.status!=="visible")continue;
    const id=clean(f?.gameId,120);
    if(!id)continue;
    if(!map[id])map[id]={fun:0,learn:0,request:0,bug:0,comments:0};
    if(FEEDBACK_KINDS.has(f.kind))map[id][f.kind]=(map[id][f.kind]||0)+1;
    if(clean(f.text,120))map[id].comments++;
  }
  return map;
}
function feedbackTeasers(list){
  const groups={};
  for(const f of list){
    if(f?.status!=="visible" || !clean(f?.text,120))continue;
    const gameId=clean(f?.gameId,120);
    if(!gameId)continue;
    (groups[gameId] ||= []).push(f);
  }

  const result={};
  for(const [gameId,items] of Object.entries(groups)){
    // カードでは「改善につながる会話」を優先。
    // 1: 要望/バグ  2: 作者返信あり  3: その他の最新コメント
    const priority=x=>{
      if(x?.kind==="request" || x?.kind==="bug")return 3;
      if(x?.reply?.text)return 2;
      return 1;
    };
    const picked=items.slice().sort((a,b)=>{
      const p=priority(b)-priority(a);
      return p || (Number(b.createdAt||0)-Number(a.createdAt||0));
    })[0];

    result[gameId]={
      id:clean(picked.id,140),
      kind:FEEDBACK_KINDS.has(picked.kind)?picked.kind:"fun",
      text:clean(picked.text,120),
      createdAt:Number(picked.createdAt)||0,
      reply:picked.reply?.text?{
        text:clean(picked.reply.text,180),
        creator:clean(picked.reply.creator,50)||"CREATOR"
      }:null
    };
  }
  return result;
}
function publicFeedback(f){
  return {
    id:f.id,
    gameId:f.gameId,
    kind:f.kind,
    text:clean(f.text,120),
    createdAt:Number(f.createdAt)||0,
    status:f.status==="hidden"?"hidden":"visible",
    reports:Array.isArray(f.reporters)?f.reporters.length:0,
    reply:f.reply?{
      text:clean(f.reply.text,180),
      createdAt:Number(f.reply.createdAt)||0,
      creator:clean(f.reply.creator,50)||"CREATOR"
    }:null
  };
}
function dateKeyJST(){
  const now=new Date(Date.now()+9*60*60*1000);
  return now.toISOString().slice(0,10);
}
function checkAdmin(request,env){
  const expected=env?.ADMIN_PIN || process.env.ADMIN_PIN || "9312";
  const got=request.headers.get("x-admin-pin")||"";
  if(got!==expected){
    return {ok:false,response:out({error:"PINが違います。"},401)};
  }
  return {ok:true};
}
async function sha256(value){
  try{
    const bytes=new TextEncoder().encode(String(value));
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }catch{
    let h=2166136261;
    for(const ch of String(value)){
      h^=ch.charCodeAt(0);
      h=Math.imul(h,16777619);
    }
    return `fallback-${(h>>>0).toString(16)}`;
  }
}
function creatorKeyValue(v){
  const key=clean(v,32);
  if(key && key.length<6)throw new Error("CREATOR KEYは6文字以上にしてください。");
  return key;
}
async function creatorKeyHash(gameId,key){
  return sha256(`uchikoshi-creator-v1:${gameId}:${key}`);
}
function feedbackClient(v){
  const token=clean(v,100);
  if(token.length<12)throw new Error("ページを再読み込みしてから、もう一度お試しください。");
  return token;
}
function feedbackText(v,max=120){
  const t=normalizeText(v,max);
  if(!t)return "";
  const compact=t.toLowerCase().replace(/\s+/g,"");
  const blocked=[
    /死ね|しね|シネ/,
    /殺す|ころす|コロス/,
    /消えろ|きえろ/,
    /きもい|キモい|キモイ/,
    /うざい|ウザい|ウザイ/,
    /ガイジ/,
    /ばか|バカ|馬鹿/,
    /あほ|アホ/,
    /ブス/,
    /デブ/,
    /くそ|クソ/
  ];
  if(blocked.some(r=>r.test(compact))){
    throw new Error("その表現は公開コメントには使えません。内容を言い換えてください。");
  }
  if(/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(t)){
    throw new Error("公開コメントにはURLやメールアドレスを入れられません。");
  }
  if(/(?:\d[\s\-ー]?){10,}/.test(t)){
    throw new Error("公開コメントには電話番号のような数字列を入れられません。");
  }
  return t;
}

export default async function onRequest({request,env}){
  try{
    const store=getStore({name:"uchikoshi-learning-games",consistency:"strong"});

    if(request.method==="GET"){
      const games=await readApproved(store);
      const analytics=await readAnalytics(store);
      const feedback=await readFeedback(store);
      return out({
        games:games.map(publicGame),
        publicAnalytics:{
          totalVisits:Number(analytics.totalVisits||0),
          totalPlays:Number(analytics.totalPlays||0),
          gamePlays:analytics.gamePlays||{}
        },
        feedbackSummary:feedbackSummary(feedback),
        feedbackTeasers:feedbackTeasers(feedback)
      });
    }

    if(request.method!=="POST")return out({error:"Method not allowed"},405);
    const body=await request.json().catch(()=>({}));

    if(body.action==="submit"){
      const approved=await readApproved(store);
      const pending=await readPending(store);
      if(pending.length>=200)return out({error:"承認待ちが多すぎます。しばらくしてから投稿してください。"},429);

      if(!clean(body?.game?.creator,50))return out({error:"投稿者名を入力してください。"},400);
      const key=creatorKeyValue(body?.game?.creatorKey);
      if(!key)return out({error:"作者返信用のCREATOR KEYを設定してください。"},400);

      const game=sanitize({...body.game,isNew:true,submittedAt:Date.now()});
      game._creatorKeyHash=await creatorKeyHash(game.id,key);

      if(approved.some(g=>g.url&&g.url===game.url)){
        return out({error:"このURLのゲームはすでに公開されています。"},409);
      }
      if(pending.some(g=>g.url&&g.url===game.url)){
        return out({error:"このURLはすでに承認待ちです。"},409);
      }

      pending.push(game);
      await store.setJSON("pending.json",pending);
      return out({ok:true,status:"pending",message:"投稿を受け付けました。承認後に公開されます。"},202);
    }

    // ---------- PUBLIC FEEDBACK ----------
    if(body.action==="feedback_list"){
      const gameId=clean(body.gameId,120);
      const approved=await readApproved(store);
      if(!approved.some(g=>g.id===gameId))return out({error:"ゲームが見つかりません。"},404);
      const feedback=await readFeedback(store);
      const items=feedback
        .filter(f=>f.gameId===gameId&&f.status==="visible"&&clean(f.text,120))
        .sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0))
        .slice(0,80)
        .map(publicFeedback);
      return out({ok:true,feedback:items,summary:feedbackSummary(feedback)[gameId]||{fun:0,learn:0,request:0,bug:0,comments:0}});
    }

    if(body.action==="feedback_submit"){
      const approved=await readApproved(store);
      const gameId=clean(body.gameId,120);
      if(!approved.some(g=>g.id===gameId))return out({error:"ゲームが見つかりません。"},404);

      const kind=FEEDBACK_KINDS.has(body.kind)?body.kind:"";
      if(!kind)return out({error:"感想の種類を選んでください。"},400);
      const text=feedbackText(body.text,120);
      const client=feedbackClient(body.clientToken);
      const clientHash=await sha256(`feedback-client:${client}`);
      const feedback=await readFeedback(store);
      const now=Date.now();

      const recent=feedback.filter(f=>f._clientHash===clientHash&&now-Number(f.createdAt||0)<10*60*1000);
      if(recent.length>=4)return out({error:"短時間の投稿が多いため、少し時間をあけてください。"},429);
      if(text && feedback.some(f=>f._clientHash===clientHash&&f.gameId===gameId&&clean(f.text,120)===text&&now-Number(f.createdAt||0)<24*60*60*1000)){
        return out({error:"同じ内容はすでに投稿されています。"},409);
      }

      feedback.push({
        id:`fb-${now}-${Math.random().toString(36).slice(2,9)}`,
        gameId,kind,text,
        createdAt:now,
        status:"visible",
        reporters:[],
        _clientHash:clientHash,
        reply:null
      });
      if(feedback.length>MAX_FEEDBACK)feedback.splice(0,feedback.length-MAX_FEEDBACK);
      await store.setJSON("feedback.json",feedback);
      return out({ok:true,summary:feedbackSummary(feedback)[gameId]||{fun:0,learn:0,request:0,bug:0,comments:0}});
    }

    if(body.action==="feedback_report"){
      const id=clean(body.id,140);
      const client=feedbackClient(body.clientToken);
      const reporter=await sha256(`feedback-report:${client}`);
      const feedback=await readFeedback(store);
      const item=feedback.find(f=>f.id===id);
      if(!item)return out({error:"コメントが見つかりません。"},404);
      item.reporters=Array.isArray(item.reporters)?item.reporters:[];
      if(!item.reporters.includes(reporter))item.reporters.push(reporter);
      if(item.reporters.length>=3)item.status="hidden";
      await store.setJSON("feedback.json",feedback);
      return out({ok:true,hidden:item.status==="hidden"});
    }

    if(body.action==="feedback_reply"){
      const gameId=clean(body.gameId,120);
      const id=clean(body.id,140);
      const key=creatorKeyValue(body.creatorKey);
      if(!key)return out({error:"CREATOR KEYを入力してください。"},400);
      const text=feedbackText(body.text,180);
      if(!text)return out({error:"返信内容を入力してください。"},400);

      const approved=await readApproved(store);
      const game=approved.find(g=>g.id===gameId);
      if(!game)return out({error:"ゲームが見つかりません。"},404);
      if(!game._creatorKeyHash)return out({error:"このゲームにはCREATOR KEYがまだ設定されていません。作者はADMINに設定を依頼してください。"},409);
      const got=await creatorKeyHash(game.id,key);
      if(got!==game._creatorKeyHash)return out({error:"CREATOR KEYが違います。"},401);

      const feedback=await readFeedback(store);
      const item=feedback.find(f=>f.id===id&&f.gameId===gameId);
      if(!item)return out({error:"コメントが見つかりません。"},404);
      if(item.status!=="visible")return out({error:"このコメントには現在返信できません。"},409);

      item.reply={text,createdAt:Date.now(),creator:clean(game.creator,50)||"CREATOR"};
      await store.setJSON("feedback.json",feedback);
      return out({ok:true,reply:publicFeedback(item).reply});
    }

    // Anonymous aggregate analytics.
    if(body.action==="analytics_visit"){
      const analytics=await readAnalytics(store);
      const key=dateKeyJST();
      analytics.totalVisits=Number(analytics.totalVisits||0)+1;
      analytics.byDate=analytics.byDate||{};
      analytics.byDate[key]=analytics.byDate[key]||{visits:0,plays:0};
      analytics.byDate[key].visits=Number(analytics.byDate[key].visits||0)+1;
      await store.setJSON("analytics.json",analytics);
      return out({ok:true});
    }

    if(body.action==="analytics_play"){
      const gameId=clean(body.gameId,120);
      if(!gameId)return out({error:"gameId is required"},400);
      const approved=await readApproved(store);
      if(!approved.some(g=>g.id===gameId))return out({error:"Game not found"},404);

      const analytics=await readAnalytics(store);
      const key=dateKeyJST();
      analytics.totalPlays=Number(analytics.totalPlays||0)+1;
      analytics.gamePlays=analytics.gamePlays||{};
      analytics.gamePlays[gameId]=Number(analytics.gamePlays[gameId]||0)+1;
      analytics.byDate=analytics.byDate||{};
      analytics.byDate[key]=analytics.byDate[key]||{visits:0,plays:0};
      analytics.byDate[key].plays=Number(analytics.byDate[key].plays||0)+1;
      await store.setJSON("analytics.json",analytics);
      return out({ok:true});
    }

    // ---------- ADMIN ----------
    const auth=checkAdmin(request,env);
    if(!auth.ok)return auth.response;

    if(body.action==="verify")return out({ok:true});
    if(body.action==="pending")return out({pending:(await readPending(store)).map(publicPending)});
    if(body.action==="analytics")return out({analytics:await readAnalytics(store)});

    if(body.action==="feedback_admin_list"){
      const feedback=await readFeedback(store);
      return out({
        feedback:feedback
          .slice()
          .sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0))
          .slice(0,400)
          .map(publicFeedback)
      });
    }
    if(body.action==="feedback_admin_status"){
      const id=clean(body.id,140);
      const status=body.status==="visible"?"visible":"hidden";
      const feedback=await readFeedback(store);
      const item=feedback.find(f=>f.id===id);
      if(!item)return out({error:"コメントが見つかりません。"},404);
      item.status=status;
      await store.setJSON("feedback.json",feedback);
      return out({ok:true});
    }
    if(body.action==="feedback_admin_delete"){
      const id=clean(body.id,140);
      const feedback=await readFeedback(store);
      const next=feedback.filter(f=>f.id!==id);
      if(next.length===feedback.length)return out({error:"コメントが見つかりません。"},404);
      await store.setJSON("feedback.json",next);
      return out({ok:true});
    }

    if(body.action==="approve"){
      const approved=await readApproved(store);
      const pending=await readPending(store);
      const idx=pending.findIndex(g=>g.id===body.id);
      if(idx<0)return out({error:"承認待ち投稿が見つかりません。"},404);

      const game={...pending[idx],isNew:true,approvedAt:Date.now()};
      if(approved.some(g=>g.url&&g.url===game.url)){
        pending.splice(idx,1);
        await store.setJSON("pending.json",pending);
        return out({error:"同じURLがすでに公開されています。",games:approved.map(publicGame),pending:pending.map(publicPending)},409);
      }

      await backupApproved(store,approved,"approve");
      approved.push(game);
      pending.splice(idx,1);
      await store.setJSON("games.json",approved);
      await store.setJSON("pending.json",pending);
      return out({ok:true,games:approved.map(publicGame),pending:pending.map(publicPending)});
    }

    if(body.action==="reject"){
      const approved=await readApproved(store);
      const pending=await readPending(store);
      const idx=pending.findIndex(g=>g.id===body.id);
      if(idx<0)return out({error:"承認待ち投稿が見つかりません。"},404);
      pending.splice(idx,1);
      await store.setJSON("pending.json",pending);
      return out({ok:true,games:approved.map(publicGame),pending:pending.map(publicPending)});
    }

    if(body.action==="upsert_game"){
      const approved=await readApproved(store);
      const raw=body.game||{};
      const incoming=sanitize(raw,{allowEmptyUrl:true});
      const idx=approved.findIndex(g=>g.id===incoming.id);
      const suppliedKey=creatorKeyValue(raw.creatorKey);
      await backupApproved(store,approved,"upsert_game");

      if(idx>=0){
        const old=approved[idx];
        approved[idx]={
          ...incoming,
          id:old.id,
          isNew:raw.isNew!==undefined?!!raw.isNew:!!old.isNew,
          submittedAt:Number(raw.submittedAt)||Number(old.submittedAt)||Date.now(),
          approvedAt:Number(raw.approvedAt)||Number(old.approvedAt)||Date.now(),
          _creatorKeyHash:suppliedKey?await creatorKeyHash(old.id,suppliedKey):old._creatorKeyHash
        };
      }else{
        approved.push({
          ...incoming,
          approvedAt:Number(incoming.approvedAt)||Date.now(),
          _creatorKeyHash:suppliedKey?await creatorKeyHash(incoming.id,suppliedKey):undefined
        });
      }
      await store.setJSON("games.json",approved);
      return out({ok:true,games:approved.map(publicGame)});
    }

    if(body.action==="delete_game"){
      const approved=await readApproved(store);
      const id=clean(body.id,120);
      if(!id)return out({error:"id is required"},400);
      const next=approved.filter(g=>g.id!==id);
      if(next.length===approved.length)return out({error:"ゲームが見つかりません。"},404);
      await backupApproved(store,approved,"delete_game");
      await store.setJSON("games.json",next);
      return out({ok:true,games:next.map(publicGame)});
    }

    if(body.action==="reorder_games"){
      const approved=await readApproved(store);
      if(!Array.isArray(body.ids))return out({error:"順序データが不正です。"},400);
      const ids=body.ids.map(x=>clean(x,120)).filter(Boolean);
      const byId=new Map(approved.map(g=>[g.id,g]));
      const used=new Set();
      const next=[];
      for(const id of ids){
        if(byId.has(id)&&!used.has(id)){
          next.push(byId.get(id));used.add(id);
        }
      }
      for(const g of approved){if(!used.has(g.id))next.push(g)}
      await backupApproved(store,approved,"reorder_games");
      await store.setJSON("games.json",next);
      return out({ok:true,games:next.map(publicGame)});
    }

    if(body.action==="restore_backup"){
      const data=await store.get("games-backup.json",{type:"json",consistency:"strong"});
      if(!data||!Array.isArray(data.games))return out({error:"復元できるバックアップがありません。"},404);
      const current=await readApproved(store);
      await backupApproved(store,current,"before_restore");
      await store.setJSON("games.json",data.games);
      return out({ok:true,games:data.games.map(publicGame),restoredFrom:data.savedAt||null});
    }

    if(body.action==="replace"){
      if(!Array.isArray(body.games)||body.games.length>300)return out({error:"ゲーム一覧が不正です。"},400);
      const current=await readApproved(store);
      const currentById=new Map(current.map(g=>[g.id,g]));
      const ids=new Set();
      const incoming=[];
      for(const raw of body.games){
        const g=sanitize(raw,{allowEmptyUrl:true});
        if(ids.has(g.id))throw new Error("ゲームIDが重複しています。");
        ids.add(g.id);
        const old=currentById.get(g.id);
        incoming.push({...g,_creatorKeyHash:old?._creatorKeyHash});
      }
      const merged=[...incoming];
      for(const g of current){if(!ids.has(g.id))merged.push(g)}
      await backupApproved(store,current,"legacy_replace_safe_merge");
      await store.setJSON("games.json",merged);
      return out({ok:true,games:merged.map(publicGame)});
    }

    return out({error:"Unknown action"},400);
  }catch(err){
    console.error(err);
    return out({error:err?.message||"サーバーエラーが発生しました。"},500);
  }
}
