/* HOME LOGO 1.0 — isolated home-page branding.
   Only renders inside #page-dashboard.
*/
(function(){
  'use strict';
  if(window.__LH_HOME_LOGO_10__) return;
  window.__LH_HOME_LOGO_10__=true;

  const SVG = `<svg viewBox="0 0 520 520" role="img" aria-label="Logo Trường Tiểu học Nghĩa Hành - lớp 5A3" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b5bd3"/><stop offset="1" stop-color="#1642a4"/></linearGradient>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe343"/><stop offset="1" stop-color="#ffc400"/></linearGradient>
    </defs>
    <circle cx="260" cy="260" r="248" fill="white" stroke="url(#b)" stroke-width="18"/>
    <circle cx="260" cy="260" r="230" fill="none" stroke="url(#g)" stroke-width="7"/>
    <path d="M75 165 Q260 42 445 165" fill="url(#b)"/>
    <text x="260" y="106" text-anchor="middle" fill="white" font-size="28" font-weight="800" font-family="Arial, sans-serif">TRƯỜNG TIỂU HỌC</text>
    <text x="260" y="139" text-anchor="middle" fill="white" font-size="31" font-weight="800" font-family="Arial, sans-serif">NGHĨA HÀNH</text>
    <rect x="125" y="154" width="270" height="145" rx="10" fill="#f9d69b" stroke="#d48c45" stroke-width="5"/>
    <path d="M112 158 L260 103 L408 158 Z" fill="#e86e3f" stroke="#c55331" stroke-width="5"/>
    <rect x="246" y="92" width="8" height="55" fill="#374151"/>
    <rect x="242" y="73" width="16" height="23" fill="#ef3340"/>
    <rect x="245" y="77" width="10" height="14" fill="#ffd94a"/>
    <g fill="#7ec8f5" stroke="#3b82c4" stroke-width="3">
      <rect x="145" y="180" width="55" height="45"/><rect x="230" y="180" width="60" height="45"/><rect x="320" y="180" width="55" height="45"/>
    </g>
    <text x="260" y="174" text-anchor="middle" fill="#17458c" font-size="18" font-weight="800" font-family="Arial, sans-serif">TRƯỜNG TIỂU HỌC NGHĨA HÀNH</text>
    <g stroke="#173d7a" stroke-width="4">
      <circle cx="175" cy="300" r="32" fill="#f4c7a1"/><path d="M142 345 Q175 312 208 345 V392 H142Z" fill="#3d70c9"/>
      <circle cx="260" cy="296" r="34" fill="#f4c7a1"/><path d="M220 343 Q260 306 300 343 V404 H220Z" fill="#2f5aa8"/>
      <circle cx="345" cy="300" r="32" fill="#f4c7a1"/><path d="M312 345 Q345 312 378 345 V392 H312Z" fill="#3d70c9"/>
    </g>
    <path d="M116 390 Q260 330 404 390 L444 438 Q260 486 76 438 Z" fill="white" stroke="#195cc2" stroke-width="8"/>
    <path d="M82 422 Q260 474 438 422" fill="none" stroke="#1f5fc4" stroke-width="12"/>
    <text x="260" y="402" text-anchor="middle" fill="#e3262e" font-size="86" font-weight="900" font-family="Arial, sans-serif">5A3</text>
    <text x="260" y="451" text-anchor="middle" fill="#173d7a" font-size="24" font-style="italic" font-weight="700" font-family="Georgia, serif">Đoàn kết • Học tốt • Tỏa sáng</text>
    <circle cx="260" cy="478" r="10" fill="#e3262e"/>
  </svg>`;

  function render(){
    const dash=document.getElementById('page-dashboard');
    const hero=dash&&dash.querySelector('.hero-illustration');
    if(!hero || document.getElementById('lhHomeLogo')) return;
    const wrap=document.createElement('div');
    wrap.id='lhHomeLogo';
    wrap.setAttribute('aria-hidden','false');
    wrap.style.cssText='width:min(38vw,300px);min-width:190px;aspect-ratio:1;display:grid;place-items:center;margin:auto;padding:8px;border-radius:50%;background:rgba(255,255,255,.16);box-shadow:0 18px 42px rgba(15,23,42,.16);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);overflow:hidden;';
    wrap.innerHTML=SVG;
    const svg=wrap.querySelector('svg');
    if(svg) svg.style.cssText='width:100%;height:100%;display:block;';
    hero.innerHTML='';
    hero.appendChild(wrap);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render,{once:true}); else render();
  window.addEventListener('data-changed',render);
})();
