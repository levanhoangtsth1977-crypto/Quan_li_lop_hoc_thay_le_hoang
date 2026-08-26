/* HOME + AI LIVE SYNC 1.3 */
(function(){
'use strict';
if(window.__LH_HOME_AI_LIVE_SYNC_13__)return;
window.__LH_HOME_AI_LIVE_SYNC_13__=true;
const text=v=>String(v??'').trim();
const list=tab=>Array.isArray(window.GOOGLE_SHEET_DATA?.tabs?.[tab])?window.GOOGLE_SHEET_DATA.tabs[tab].slice():Array.isArray(window[tab==='VI_PHAM'?'violationRecords':'rewardRecords'])?window[tab==='VI_PHAM'?'violationRecords':'rewardRecords'].slice():[];
const counts=()=>({v:list('VI_PHAM').length,r:list('KHEN_THUONG').length});
function render(){const c=counts();[['statViolations',c.v],['statRewards',c.r],['violationBadge',c.v],['rewardBadge',c.r]].forEach(([id,n])=>{const e=document.getElementById(id);if(e)e.textContent=String(n)});try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}}
async function pull(){try{if(typeof window.syncGoogleSheetsNow==='function')await window.syncGoogleSheetsNow()}catch(e){console.warn('[HOME+AI SYNC]',e)}render();}
function wrapDelete(name){let tries=0;const timer=setInterval(()=>{const old=window[name];if(typeof old==='function'&&!old.__lhHomeAiWrapped){const w=async function(){const result=await old.apply(this,arguments);setTimeout(pull,120);return result};w.__lhHomeAiWrapped=true;window[name]=w;clearInterval(timer)}if(++tries>120)clearInterval(timer)},250)}
function patchStats(){const old=window.getClassStatistics;if(typeof old!=='function'||old.__lhHomeAiWrapped)return;const w=function(){const b=old()||{},c=counts();return Object.assign({},b,{totalViolations:c.v,totalRewards:c.r})};w.__lhHomeAiWrapped=true;window.getClassStatistics=w}
function patchAI(){const old=window.buildClassAIAnalysis;if(typeof old!=='function'||old.__lhHomeAiWrapped)return;const w=function(){let s='';try{s=String(old()||'')}catch(_){}const c=counts();s=s.replace(/Vi phạm:\s*[^\n]*/i,'Vi phạm: '+c.v).replace(/Khen thưởng:\s*[^\n]*/i,'Khen thưởng: '+c.r);if(!/Vi phạm:\s*\d+/i.test(s))s+='\nVi phạm: '+c.v;if(!/Khen thưởng:\s*\d+/i.test(s))s+='\nKhen thưởng: '+c.r;return s};w.__lhHomeAiWrapped=true;window.buildClassAIAnalysis=w}
function init(){patchStats();patchAI();wrapDelete('deleteViolation');wrapDelete('deleteReward');render();setTimeout(pull,200)}
['violation-updated','reward-updated','google-sheets-data-ready','google-sheets-refresh','records-updated','data-changed'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(pull,80)));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(pull,80)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
setInterval(()=>{patchStats();patchAI();render()},1500);
})();
