/* TRIỆU PHÚ HỌC ĐƯỜNG — GAMESHOW AUDIO ENGINE v4
   Âm thanh nguyên bản, phân lớp rõ theo từng trạng thái của gameshow.
*/
(function(){'use strict';
var ctx=null,master=null,enabled=true,volume=.92,seqTimer=null,mode='idle',introPlaying=false;
var N={C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,B5:987.77,C6:1046.5,D6:1174.66,E6:1318.51};
function init(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination);}catch(e){ctx=null;}}
function wake(){init();if(ctx&&ctx.state==='suspended')ctx.resume();}
function tone(f,d,t,type,g){if(!ctx||!enabled)return;var o=ctx.createOscillator(),a=ctx.createGain(),now=ctx.currentTime+(t||0);o.type=type||'triangle';o.frequency.setValueAtTime(f,now);a.gain.setValueAtTime(.0001,now);a.gain.exponentialRampToValueAtTime(Math.max(.0003,g||.08),now+.025);a.gain.exponentialRampToValueAtTime(.0001,now+d);o.connect(a);a.connect(master);o.start(now);o.stop(now+d+.04);}
function chord(root,t,d,g){[root,root*1.25,root*1.5,root*2].forEach(function(f,i){tone(f,d,t,'triangle',(g||.06)/(i+1));});}
function stop(){if(seqTimer){clearTimeout(seqTimer);seqTimer=null;}mode='idle';}
function intro(){wake();if(!ctx||!enabled)return;stop();mode='intro';introPlaying=true;
/* 13s opener: trầm bí ẩn → dâng nhịp → reveal */
chord(N.C3,.05,2.4,.18);chord(N.F3,2.7,2.4,.18);chord(N.G3,5.4,2.5,.20);chord(N.C4,8.2,3.0,.22);
[N.C4,N.E4,N.G4,N.B4,N.C5,N.G4,N.E4,N.G4].forEach(function(f,i){tone(f,.5,.35+i*.42,'triangle',.12);tone(f/2,.7,.35+i*.42,'sine',.035);});
[N.C5,N.D5,N.E5,N.G5,N.A5,N.C6].forEach(function(f,i){tone(f,.3,3.9+i*.17,'triangle',.09);});
[N.G4,N.A4,N.B4,N.C5,N.D5,N.E5,N.G5,N.C6].forEach(function(f,i){tone(f,.36,7.4+i*.23,'triangle',.11);});
[N.G5,N.C6,N.E6,N.G5,N.C6,N.E6].forEach(function(f,i){tone(f,.95,9.8+i*.32,'triangle',.16);});
seqTimer=setTimeout(function(){introPlaying=false;thinking();},13000);}
function thinking(){wake();if(!ctx||!enabled)return;stop();mode='thinking';var step=0,mel=[N.C5,N.G4,N.E5,N.G4,N.D5,N.A4,N.F5,N.A4],bass=[N.C3,N.C3,N.G3,N.G3,N.A3,N.A3,N.F3,N.F3];function beat(){if(!enabled||mode!=='thinking')return;tone(mel[step%8],.34,0,'triangle',.075);tone(bass[step%8],.46,0,'sine',.065);if(step%8===0)chord(N.C4,.02,.35,.03);step++;seqTimer=setTimeout(beat,540);}beat();}
function questionEntrance(){if(introPlaying)return;wake();if(!ctx||!enabled)return;stop();mode='question';chord(N.C4,.02,.55,.12);tone(N.G4,.05,0,'sine',.08);tone(N.C5,.18,.10,'triangle',.12);seqTimer=setTimeout(thinking,650);}
function select(){wake();if(!ctx||!enabled)return;tone(N.G5,.08,0,'square',.10);tone(N.C6,.13,.06,'triangle',.08);}
function correct(){stop();if(!enabled)return;[N.C5,N.E5,N.G5,N.C6].forEach(function(f,i){tone(f,.28,i*.08,'triangle',.16);});chord(N.C5,.34,1.0,.10);}
function wrong(){stop();if(!enabled)return;tone(N.A4,.28,0,'sawtooth',.12);tone(N.F4,.42,.18,'sawtooth',.10);tone(N.D4,.55,.38,'sawtooth',.08);}
function change(){stop();if(!enabled)return;[N.G4,N.C5,N.E5,N.G5].forEach(function(f,i){tone(f,.18,i*.07,'triangle',.11);});seqTimer=setTimeout(thinking,450);}
function help(kind){if(!enabled)return;if(kind==='5050'){tone(N.C5,.12,0,'sine',.09);tone(N.G5,.18,.12,'sine',.10);}else if(kind==='poll'){tone(N.G4,.14,0,'triangle',.09);tone(N.C5,.22,.14,'triangle',.10);}else{change();}}
function victory(){stop();if(!enabled)return;mode='victory';[N.C5,N.E5,N.G5,N.C6,N.E6,N.C6,N.G5,N.C6].forEach(function(f,i){tone(f,.65,i*.15,'triangle',.16);});chord(N.C5,.42,1.35,.11);chord(N.F5,1.9,1.35,.11);chord(N.C5,3.35,2.1,.13);}
function setEnabled(v){enabled=!!v;if(!enabled)stop();else wake();}
function setVolume(v){volume=Math.max(0,Math.min(1,Number(v)||0));if(master)master.gain.value=volume;}
window.LHGameTheme={intro:intro,thinking:thinking,question:questionEntrance,select:select,click:select,correct:correct,wrong:wrong,change:change,help:help,victory:victory,setEnabled:setEnabled,setVolume:setVolume,stop:stop};
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#audioToggle');if(b){enabled=!enabled;b.setAttribute('aria-pressed',String(enabled));b.textContent=enabled?'🔊 Âm thanh: BẬT':'🔇 Âm thanh: TẮT';setEnabled(enabled);return;}var r=e.target.closest&&e.target.closest('#audioVolume');if(r)setVolume(Number(r.value)/100);},true);
document.addEventListener('click',function(e){var s=e.target.closest&&e.target.closest('[data-action="start"]');if(s&&enabled){intro();return;}var a=e.target.closest&&e.target.closest('#answers button');if(a&&enabled){select();setTimeout(function(){var x=document.getElementById('explanation'),ok=x&&x.textContent.indexOf('Chính xác')>=0;if(ok)correct();else if(x&&x.textContent.indexOf('Chưa chính xác')>=0)wrong();},80);return;}var h=e.target.closest&&e.target.closest('[data-help]');if(h&&enabled)help(h.dataset.help);},true);
var q=document.getElementById('question');if(q)new MutationObserver(function(){if(q.textContent&&q.textContent!=='Đang tải câu hỏi…')questionEntrance();}).observe(q,{childList:true,characterData:true,subtree:true});
})();