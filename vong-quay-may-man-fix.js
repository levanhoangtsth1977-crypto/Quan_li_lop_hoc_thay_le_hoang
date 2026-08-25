/* VÒNG QUAY MAY MẮN — FIX QUAY THẬT + NHẠC NỀN
 * Chạy sau vong-quay-may-man.js.
 * Không ghi/sửa/xóa Google Sheets.
 */
(function(){'use strict';
  let audioCtx=null, musicTimer=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function ensureAudio(){
    try{
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)return null;
      if(!audioCtx)audioCtx=new C();
      if(audioCtx.state==='suspended')audioCtx.resume();
      return audioCtx;
    }catch(e){return null;}
  }

  function tone(freq,duration=.12,volume=.035,when=0,type='sine'){
    const c=ensureAudio(); if(!c)return;
    try{
      const o=c.createOscillator(), g=c.createGain();
      o.type=type; o.frequency.setValueAtTime(freq,c.currentTime+when);
      g.gain.setValueAtTime(0,c.currentTime+when);
      g.gain.linearRampToValueAtTime(volume,c.currentTime+when+.015);
      g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+when+duration);
      o.connect(g);g.connect(c.destination);o.start(c.currentTime+when);o.stop(c.currentTime+when+duration+.02);
    }catch(e){}
  }

  function startMusic(){
    ensureAudio();
    stopMusic();
    const beat=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46];
    let i=0;
    const tick=()=>{
      if(!musicTimer)return;
      tone(beat[i%beat.length],.16,.025,0,'triangle');
      tone(beat[(i+2)%beat.length]/2,.20,.012,.02,'sine');
      i++;
    };
    tick();
    musicTimer=setInterval(tick,190);
  }

  function stopMusic(){
    if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
  }

  function spinWheel(winner){
    const wheel=document.querySelector('.lh-wheel-circle');
    if(!wheel)return;
    const spins=6+Math.floor(Math.random()*3);
    const target=spins*360+Math.floor(Math.random()*360);
    wheel.style.transition='transform 3.8s cubic-bezier(.12,.7,.18,1)';
    wheel.style.transform='rotate(0deg)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      wheel.style.transform=`rotate(${target}deg)`;
    }));
    startMusic();
    setTimeout(()=>{
      stopMusic();
      tone(1046.5,.22,.05,0,'sine');
      setTimeout(()=>tone(1318.5,.28,.045,0,'sine'),120);
      wheel.style.transition='transform .35s ease-out';
      wheel.style.transform=`rotate(${target}deg)`;
    },3900);
  }

  function currentWinner(){
    const el=document.getElementById('lhWheelName');
    return el?String(el.textContent||'').trim():'';
  }

  function patchSpin(){
    const btn=document.getElementById('lhWheelSpin');
    if(!btn||btn.dataset.fixBound==='1')return;
    btn.dataset.fixBound='1';
    btn.addEventListener('click',function(){
      setTimeout(()=>{
        if(btn.disabled)return;
        spinWheel(currentWinner());
      },20);
    },{capture:true});
  }

  function watchPage(){
    patchSpin();
    const sec=document.getElementById('page-lucky-wheel');
    if(sec&&!sec.dataset.musicHint){
      sec.dataset.musicHint='1';
      const sub=document.getElementById('lhWheelSub');
      if(sub && !document.getElementById('lhMusicHint')){
        const hint=document.createElement('div');
        hint.id='lhMusicHint';
        hint.textContent='🔊 Nhạc quay sẽ phát khi nhấn “QUAY NGAY”.';
        hint.style='margin-top:8px;font-size:12px;color:#64748b;';
        sub.insertAdjacentElement('afterend',hint);
      }
    }
  }

  function start(){
    watchPage();
    const obs=new MutationObserver(watchPage);
    obs.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('pagechange',watchPage);
    document.addEventListener('click',()=>ensureAudio(),{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
