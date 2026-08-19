/* TRIỆU PHÚ HỌC ĐƯỜNG — ORIGINAL GAMESHOW MUSIC v2
   Nhạc nguyên bản bằng Web Audio API: intro + nền hồi hộp + cao trào + victory.
   Không sao chép bản ghi hoặc giai điệu của chương trình truyền hình có bản quyền.
*/
(function(){'use strict';
var ctx=null,master=null,enabled=true,volume=.58,loops=[],seqTimer=null;
var N={C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,B5:987.77,C6:1046.5,D6:1174.66,E6:1318.51};
function init(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination);}catch(e){ctx=null;}}
function wake(){init();if(ctx&&ctx.state==='suspended')ctx.resume();}
function tone(f,d,t,type,g){if(!ctx||!enabled)return;var o=ctx.createOscillator(),a=ctx.createGain(),now=ctx.currentTime+t;o.type=type||'triangle';o.frequency.setValueAtTime(f,now);a.gain.setValueAtTime(.0001,now);a.gain.exponentialRampToValueAtTime(Math.max(.0002,g||.05),now+.025);a.gain.exponentialRampToValueAtTime(.0001,now+d);o.connect(a);a.connect(master);o.start(now);o.stop(now+d+.04);}
function chord(root,t,d,g){[root,root*1.25,root*1.5,root*2].forEach(function(f,i){tone(f,d,t,'triangle',(g||.035)/(i+1));});}
function stop(){loops.forEach(clearInterval);loops=[];if(seqTimer){clearTimeout(seqTimer);seqTimer=null;}}
function intro(){wake();if(!ctx||!enabled)return;stop();var t=.05;
chord(N.C3,t,2.4,.09);chord(N.F3,3.0,2.4,.09);chord(N.G3,6.0,2.3,.095);chord(N.C4,9.0,3.2,.105);
var ar=[N.C4,N.E4,N.G4,N.B4,N.C5,N.G4,N.E4,N.G4];
ar.forEach(function(f,i){tone(f,.42,.5+i*.42,'triangle',.065);tone(f/2,.7,.5+i*.42,'sine',.018);});
[N.C5,N.D5,N.E5,N.G5,N.A5,N.C6].forEach(function(f,i){tone(f,.24,4.1+i*.16,'triangle',.045);});
[N.G4,N.A4,N.B4,N.C5,N.D5,N.E5,N.G5,N.C6].forEach(function(f,i){tone(f,.3,8.0+i*.22,'triangle',.06);});
[N.G5,N.C6,N.E6,N.G5,N.C6,N.E6].forEach(function(f,i){tone(f,.8,10.2+i*.3,'triangle',.09);});
seqTimer=setTimeout(function(){thinking();},14200);}
function thinking(){wake();if(!ctx||!enabled)return;stop();var step=0,seq=[N.C5,N.G4,N.E5,N.G4,N.D5,N.A4,N.F5,N.A4],bass=[N.C3,N.C3,N.G3,N.G3,N.A3,N.A3,N.F3,N.F3];function beat(){if(!enabled)return;var t=.02;tone(seq[step%8],.34,t,'triangle',.045);tone(bass[step%8],.46,t,'sine',.045);if(step%8===0)chord(N.C4,t,.38,.018);step++;seqTimer=setTimeout(beat,540);}beat();}
function sting(ok){wake();if(!ctx||!enabled)return;stop();if(ok){[N.C5,N.E5,N.G5,N.C6].forEach(function(f,i){tone(f,.5,i*.1,'triangle',.085);});chord(N.C5,.25,.9,.055);}else{tone(N.A4,.38,0,'sawtooth',.06);tone(N.F4,.55,.22,'sawtooth',.05);}}
function victory(){wake();if(!ctx||!enabled)return;stop();[N.C5,N.E5,N.G5,N.C6,N.E6,N.C6,N.G5,N.C6].forEach(function(f,i){tone(f,.62,i*.15,'triangle',.09);});chord(N.C5,.4,1.3,.07);chord(N.F5,1.8,1.3,.07);chord(N.C5,3.2,2.0,.08);}
function setEnabled(v){enabled=!!v;if(!enabled)stop();else wake();}
function setVolume(v){volume=Math.max(0,Math.min(1,Number(v)||0));if(master)master.gain.value=volume;}
window.LHGameTheme={intro:intro,thinking:thinking,sting:sting,victory:victory,setEnabled:setEnabled,setVolume:setVolume};
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#audioToggle');if(b){enabled=!enabled;b.setAttribute('aria-pressed',String(enabled));b.textContent=enabled?'🔊 Âm thanh: BẬT':'🔇 Âm thanh: TẮT';setEnabled(enabled);return;}var r=e.target.closest&&e.target.closest('#audioVolume');if(r)setVolume(Number(r.value)/100);},true);
document.addEventListener('click',function(e){var s=e.target.closest&&e.target.closest('[data-action="start"]');if(s&&enabled){intro();return;}var a=e.target.closest&&e.target.closest('#answers button');if(a&&enabled){setTimeout(function(){var x=document.getElementById('explanation'),ok=x&&x.textContent.indexOf('Chính xác')>=0;sting(ok);},80);}},true);
var result=document.getElementById('result');if(result)new MutationObserver(function(){if(!result.classList.contains('hidden')&&enabled)victory();}).observe(result,{attributes:true,attributeFilter:['class']});
})();
