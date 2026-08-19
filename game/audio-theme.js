/* TRIỆU PHÚ HỌC ĐƯỜNG — Original Audio Theme
   Web Audio API: không dùng bản ghi/giai điệu của chương trình truyền hình có bản quyền.
*/
(function(){'use strict';
  var ctx=null, master=null, enabled=true, volume=.58, musicTimer=null, active=false;
  var A=440;
  var notes={C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,B5:987.77,C6:1046.5};
  function init(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination);}catch(e){ctx=null;}}
  function resume(){init();if(ctx&&ctx.state==='suspended')ctx.resume();}
  function tone(freq,dur,when,type,gain){if(!ctx||!master||!enabled)return;var o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(freq,when);g.gain.setValueAtTime(0.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain||.08),when+.025);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(g);g.connect(master);o.start(when);o.stop(when+dur+.03);}
  function chord(root,when){[root,root*1.25,root*1.5].forEach(function(f,i){tone(f,1.15,when,'triangle',.035/(i+1));});}
  function stop(){if(musicTimer){clearTimeout(musicTimer);musicTimer=null;}active=false;}
  function intro(){resume();if(!ctx)return;stop();active=true;var t=ctx.currentTime+.08;
    /* 12-second original game-show opener: pulse → rise → reveal → resolve */
    [notes.C4,notes.G4,notes.A4,notes.E4,notes.F4,notes.C5,notes.D5,notes.G5].forEach(function(f,i){tone(f,.55,t+i*.38,'triangle',.055);tone(f/2,.7,t+i*.38,'sine',.025);});
    chord(notes.C4,t+.15);chord(notes.F4,t+2.65);chord(notes.G4,t+5.15);chord(notes.C5,t+8.0);
    [0,1,2,3,4,5,6,7].forEach(function(i){tone(notes.C5*Math.pow(2,i/12),.18,t+6.5+i*.12,'square',.025);});
    [notes.G5,notes.C6,notes.E5,notes.G5].forEach(function(f,i){tone(f,1.1,t+9.25+i*.32,'triangle',.065);});
    musicTimer=setTimeout(function(){if(active)thinking();},12500);
  }
  function thinking(){resume();if(!ctx)return;stop();active=true;var start=ctx.currentTime+.04,step=0;
    function beat(){if(!active||!ctx)return;var t=ctx.currentTime;var seq=[notes.C5,notes.E5,notes.G5,notes.E5,notes.D5,notes.F5,notes.A5,notes.F5];tone(seq[step%seq.length],.42,t,'triangle',.028);tone(notes.C4,.36,t,'sine',.018);step++;musicTimer=setTimeout(beat,620);}
    beat();
  }
  function sting(ok){resume();if(!ctx)return;stop();var t=ctx.currentTime+.03;
    if(ok){[notes.C5,notes.E5,notes.G5,notes.C6].forEach(function(f,i){tone(f,.65,t+i*.11,'triangle',.075);});chord(notes.C5,t+.25);}
    else{tone(notes.A4,.45,t,'sawtooth',.055);tone(notes.F4,.65,t+.25,'sawtooth',.045);}
    musicTimer=setTimeout(function(){thinking();},1200);
  }
  function victory(){resume();if(!ctx)return;stop();var t=ctx.currentTime+.05;[notes.C5,notes.E5,notes.G5,notes.C6,notes.G5,notes.C6].forEach(function(f,i){tone(f,.8,t+i*.18,'triangle',.08);});chord(notes.C5,t+.45);chord(notes.F5,t+1.7);chord(notes.C5,t+3.0);}
  function setEnabled(v){enabled=!!v;if(!enabled)stop();else resume();}
  function setVolume(v){volume=Math.max(0,Math.min(1,Number(v)||0));if(master)master.gain.value=volume;}
  window.LHGameTheme={intro:intro,thinking:thinking,sting:sting,victory:victory,setEnabled:setEnabled,setVolume:setVolume};
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('#audioToggle');if(b){enabled=!enabled;b.setAttribute('aria-pressed',String(enabled));b.textContent=enabled?'🔊 Âm thanh: BẬT':'🔇 Âm thanh: TẮT';setEnabled(enabled);return;}
    var r=e.target.closest&&e.target.closest('#audioVolume');if(r){setVolume(Number(r.value)/100);return;}
  },true);
  document.addEventListener('click',function(e){
    var start=e.target.closest&&e.target.closest('[data-action="start"]');if(start&&enabled){intro();return;}
    var ans=e.target.closest&&e.target.closest('#answers button');if(ans&&enabled){setTimeout(function(){var text=document.getElementById('explanation');var ok=text&&text.textContent.indexOf('Chính xác')>=0;sting(ok);},80);}
  },true);
  var result=document.getElementById('result');if(result){new MutationObserver(function(){if(!result.classList.contains('hidden')&&enabled)victory();}).observe(result,{attributes:true,attributeFilter:['class']});}
  var vol=document.getElementById('audioVolume');if(vol)vol.addEventListener('input',function(){setVolume(Number(vol.value)/100);});
})();
