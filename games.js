import { getStore } from "@edgeone/pages-blob";

const SUBJECTS = new Set([
  "japanese","social","math","science","music","art","pe","tech_home","english"
]);

const SEED = [
  {id:"ion-battle",title:"イオンカードゲーム",icon:"🧪",subject:"science",description:"イオンを組み合わせ、完成物をつくって戦うカードゲーム。",url:"",isNew:false,approvedAt:1},
  {id:"busshitsu-lab",title:"物質追究ラボ",icon:"🔬",subject:"science",description:"実験・推理・研究をくり返して、謎の物質を追究する。",url:"",isNew:false,approvedAt:2},
  {id:"science-breakers",title:"サイエンスブレーカー",icon:"💥",subject:"science",description:"問題を解いて報酬を獲得し、科学の世界を攻略する。",url:"",isNew:false,approvedAt:3},
  {id:"force-lab",title:"力の矢印ゲーム",icon:"🏹",subject:"science",description:"作用点・向き・大きさを見抜いて、力を矢印で表そう。",url:"",isNew:false,approvedAt:4}
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
  const description=clean(raw?.description,180);
  const url=clean(raw?.url,700);
  if(!title)throw new Error("タイトルを入力してください。");
  if((!allowEmptyUrl||url)&&!goodUrl(url))throw new Error("公開URLを正しく入力してください。");

  return {
    id:clean(raw?.id,120)||`game-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
    title,icon,subject,description,url,
    isNew:Boolean(raw?.isNew),
    submittedAt:Number(raw?.submittedAt)||Date.now(),
    approvedAt:Number(raw?.approvedAt)||0
  };
}
async function readApproved(store){
  const data=await store.get("games.json",{type:"json",consistency:"strong"});
  if(!Array.isArray(data)) return SEED;
  return data.map(g=>({...g,subject:SUBJECTS.has(g?.subject)?g.subject:"science"}));
}
async function readPending(store){
  const data=await store.get("pending.json",{type:"json",consistency:"strong"});
  if(!Array.isArray(data)) return [];
  return data.map(g=>({...g,subject:SUBJECTS.has(g?.subject)?g.subject:"science"}));
}
async function readAnalytics(store){
  const data=await store.get("analytics.json",{type:"json",consistency:"strong"});
  return data && typeof data==="object" ? data : {
    totalVisits:0,
    totalPlays:0,
    byDate:{},
    gamePlays:{}
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

export default async function onRequest({request,env}){
  try{
    const store=getStore({name:"uchikoshi-learning-games",consistency:"strong"});

    if(request.method==="GET"){
      return out({games:await readApproved(store)});
    }

    if(request.method!=="POST")return out({error:"Method not allowed"},405);
    const body=await request.json().catch(()=>({}));

    if(body.action==="submit"){
      const approved=await readApproved(store);
      const pending=await readPending(store);
      if(pending.length>=200)return out({error:"承認待ちが多すぎます。しばらくしてから投稿してください。"},429);

      const game=sanitize({...body.game,isNew:true,submittedAt:Date.now()});

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


    // Anonymous aggregate analytics.
    // No IP, user-agent, account ID or other personal data is stored.
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
      if(!approved.some(g=>g.id===gameId)){
        return out({error:"Game not found"},404);
      }

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

    const auth=checkAdmin(request,env);
    if(!auth.ok)return auth.response;

    if(body.action==="verify")return out({ok:true});
    if(body.action==="pending")return out({pending:await readPending(store)});
    if(body.action==="analytics")return out({analytics:await readAnalytics(store)});

    if(body.action==="approve"){
      const approved=await readApproved(store);
      const pending=await readPending(store);
      const idx=pending.findIndex(g=>g.id===body.id);
      if(idx<0)return out({error:"承認待ち投稿が見つかりません。"},404);

      const game={...pending[idx],isNew:true,approvedAt:Date.now()};
      if(approved.some(g=>g.url&&g.url===game.url)){
        pending.splice(idx,1);
        await store.setJSON("pending.json",pending);
        return out({error:"同じURLがすでに公開されています。",games:approved,pending},409);
      }

      approved.push(game);
      pending.splice(idx,1);
      await store.setJSON("games.json",approved);
      await store.setJSON("pending.json",pending);
      return out({ok:true,games:approved,pending});
    }

    if(body.action==="reject"){
      const approved=await readApproved(store);
      const pending=await readPending(store);
      const idx=pending.findIndex(g=>g.id===body.id);
      if(idx<0)return out({error:"承認待ち投稿が見つかりません。"},404);

      pending.splice(idx,1);
      await store.setJSON("pending.json",pending);
      return out({ok:true,games:approved,pending});
    }

    if(body.action==="replace"){
      if(!Array.isArray(body.games)||body.games.length>300){
        return out({error:"ゲーム一覧が不正です。"},400);
      }
      const ids=new Set();
      const games=body.games.map(raw=>{
        const g=sanitize(raw,{allowEmptyUrl:true});
        if(ids.has(g.id))throw new Error("ゲームIDが重複しています。");
        ids.add(g.id);
        return g;
      });
      await store.setJSON("games.json",games);
      return out({ok:true,games});
    }

    return out({error:"Unknown action"},400);
  }catch(err){
    console.error(err);
    return out({error:err?.message||"サーバーエラーが発生しました。"},500);
  }
}
