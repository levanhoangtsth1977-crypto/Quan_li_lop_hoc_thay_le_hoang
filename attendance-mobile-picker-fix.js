/* ATTENDANCE MOBILE PICKER FIX 1.0
   Never renders/replaces attendance data. Only improves touch interaction for native selects.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_MOBILE_PICKER_10__)return;
  window.__LH_ATTENDANCE_MOBILE_PICKER_10__=true;

  function isStatus(el){
    return !!(el && el.matches && el.matches('#page-attendance select.attendance-status'));
  }

  function openNative(el){
    if(!isStatus(el))return;
    try{
      if(typeof el.showPicker==='function'){
        el.showPicker();
        return;
      }
    }catch(_){ }
    try{el.focus({preventScroll:true});}catch(_){try{el.focus();}catch(__){}}
  }

  function install(){
    if(!document.getElementById('lhAttendanceMobilePickerCss')){
      const style=document.createElement('style');
      style.id='lhAttendanceMobilePickerCss';
      style.textContent=`
        #page-attendance .attendance-table td:nth-child(3){position:relative!important;z-index:100!important;overflow:visible!important}
        #page-attendance select.attendance-status{position:relative!important;z-index:101!important;display:block!important;width:100%!important;min-height:46px!important;pointer-events:auto!important;opacity:1!important;visibility:visible!important;-webkit-appearance:auto!important;appearance:auto!important;touch-action:manipulation!important;}
        @media(max-width:680px){#page-attendance .attendance-table td:nth-child(3){min-width:175px!important}#page-attendance select.attendance-status{font-size:16px!important;min-height:48px!important;padding:8px 34px 8px 10px!important}}
      `;
      document.head.appendChild(style);
    }
    if(document.__LHAttendanceMobilePickerBound)return;
    document.__LHAttendanceMobilePickerBound=true;

    document.addEventListener('pointerdown',function(e){
      const el=e.target&&e.target.closest?e.target.closest('#page-attendance select.attendance-status'):null;
      if(!el)return;
      e.stopPropagation();
      openNative(el);
    },true);

    document.addEventListener('touchstart',function(e){
      const el=e.target&&e.target.closest?e.target.closest('#page-attendance select.attendance-status'):null;
      if(!el)return;
      e.stopPropagation();
    },true);

    document.addEventListener('click',function(e){
      const el=e.target&&e.target.closest?e.target.closest('#page-attendance select.attendance-status'):null;
      if(!el)return;
      e.stopPropagation();
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();