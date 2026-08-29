const UPSTREAM='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrNWY5DCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
module.exports=async function(req,res){
  try{
    const u=UPSTREAM+'?action=get_all&callback=__LH_PROXY_CALLBACK&debug='+Date.now();
    const r=await fetch(u,{redirect:'follow',cache:'no-store'});
    const t=await r.text();
    res.status(200).json({status:r.status,ok:r.ok,url:r.url,type:r.headers.get('content-type'),length:t.length,start:t.slice(0,500)});
  }catch(e){res.status(200).json({error:e?.message||String(e),name:e?.name,stack:String(e?.stack||'').slice(0,800)});}
};
