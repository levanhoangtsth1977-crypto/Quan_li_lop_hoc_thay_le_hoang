/* VÒNG QUAY MAY MẮN — FINAL VISUAL/AUDIO FIX
 * Bắt trước click của nút QUAY NGAY để tắt animation CSS xung đột,
 * xoay bánh xe thật và phát nhạc nền trong lúc quay.
 * Không sửa dữ liệu Google Sheets.
 */
(function(){'use strict';
  let audioCtx=null,musicTimer=null;

  function audio(){
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
      audioCtx=audioCtx||new C();
      if(audioCtx.state==='suspended')audioCtx.resume();
      return audioCtx;
    }catch(e){return null}
  }
  function tone(freq,duration=.14,volume=.025,when=0,type='sine'){
    const c=audio();if(!c)return;
    try{
      const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+when;
      o.type=type;o.frequency.setValueAtTime(freq,t);
      g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(Math.max(volume,.0002),t+.015);
      g.gain.exponentialRampToValueAtTime(.0001,t+duration);
      o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.03);
    }catch(e){}
  }
  function startMusic(){
    audio();stopMusic();
    const notes=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46];let i=0;
    const tick=()=>{if(!musicTimer)return;tone(notes[i%notes.length],.16,.022,0,'triangle');tone(notes[(i+2)%notes.length]/2,.20,.009,.015,'sine');i++};
    musicTimer=setInterval(tick,185);tick();
  }
  function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
  function winSound(){tone(1046.5,.18,.045,0,'sine');tone(1318.5,.25,.04,.12,'sine');tone(1568,.32,.035,.25,'sine')}

  function spin(){
    const wheel=document.querySelector('#page-lucky-wheel .lh-wheel-circle');
    const btn=document.getElementById('lhWheelSpin');
    if(!wheel||!btn)return;
    wheel.style.animation='none';
    wheel.style.webkitAnimation='none';
    const current=Number(wheel.dataset.rotation||0);
    const target=current+(6+Math.floor(Math.random()*3))*360+Math.floor(Math.random()*360);
    wheel.style.transition='transform 4.2s cubic-bezier(.12,.72,.16,1)';
    wheel.style.transform=`rotate(${target}deg)`;
    wheel.dataset.rotation=String(target);
    startMusic();
    setTimeout(()=>{
      stopMusic();winSound();
    },4250);
  }

  function bind(){
    const btn=document.getElementById('lhWheelSpin');
    if(!btn||btn.dataset.visualFixBound==='1')return;
    btn.dataset.visualFixBound='1';
    btn.addEventListener('click',()=>setTimeout(spin,0),{capture:true});
  }
  function watch(){bind()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
  new MutationObserver(watch).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagechange',watch);
})();
