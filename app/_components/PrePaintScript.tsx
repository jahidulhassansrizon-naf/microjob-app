/**
 * Runs synchronously in <head>, BEFORE the browser paints anything.
 *
 * Why: parts of the UI (dashboard "fit to screen" scale, navbar item count / zoom, greeting, user
 * avatar) used to be computed by React *after* hydration, so on every reload the page first showed
 * empty space / half a navbar and then popped into place. Here we restore the last measured values
 * from localStorage (written by DashboardClient / DashboardNavbar) and expose them as html[data-*]
 * attributes and CSS variables, so the server-rendered HTML is already laid out exactly like the
 * final page. React later re-measures and (only if something really changed) corrects the values.
 *
 * Keep this ES5, tiny, and wrapped in try/catch - it must never break the page.
 */
export const UI_CACHE_KEY = "sohoj_ui_v1";
export const NAV_ITEM_COUNT = 8; // must equal NAV_ITEMS.length in DashboardNavbar.tsx (checked there in dev)

const SCRIPT = `(function(){try{
var d=document.documentElement,s=d.style,N=${NAV_ITEM_COUNT};
var fine=window.matchMedia('(pointer:fine)').matches;
d.setAttribute('data-fit',fine?'1':'0');
var hr=new Date().getHours();
d.setAttribute('data-greet',hr>=5&&hr<12?'morning':hr>=12&&hr<17?'afternoon':hr>=17&&hr<21?'evening':'night');
var bg={'/tools':'#FFFBF7','/pricing':'#FEF4ED','/reviews':'#F5ECE5','/dorkar-link':'#FCF9F9'},p=location.pathname,c='#FAF7FD',k;
for(k in bg){if(p.indexOf(k)===0){c=bg[k];break}}
s.backgroundColor=c;
var cw=d.clientWidth,ih=window.innerHeight,loc=d.lang==='bn'?'bn':'en';
var C={};try{C=JSON.parse(localStorage.getItem('${UI_CACHE_KEY}')||'{}')||{}}catch(e){}
var ns=fine?Math.min(5,Math.max(1,cw/1920)):1;
if(ns>1.001){d.setAttribute('data-nav-scaled','1');s.setProperty('--nav-s',String(ns))}
var n=C.nav&&C.nav[p+'|'+cw+'|'+loc];
if(n){d.setAttribute('data-nav-pre','1');
s.setProperty('--nav-w',n.w+'px');
s.setProperty('--nav-j',n.al?'space-between':'center');
for(var i=0;i<N;i++)s.setProperty('--ni-'+i,i<n.vc?'contents':'none');
s.setProperty('--nav-more',n.vc<N?'contents':'none')}
var hv=C.home&&C.home[cw+'x'+ih];
if(!hv){var l=C.lastHome||{w:1232,h:600,top:Math.round(64*ns)};
var aw=cw-48,ah=ih-l.top-48;
hv={w:l.w,h:l.h,top:l.top,s:Math.min(6,Math.max(0.2,Math.min(aw/l.w,ah/l.h)))}}
s.setProperty('--hv-w',hv.w+'px');s.setProperty('--hv-h',hv.h+'px');
s.setProperty('--hv-s',String(hv.s));s.setProperty('--hv-top',hv.top+'px');
var u=null;try{u=JSON.parse(localStorage.getItem('user')||'null')}catch(e){}
if(u&&typeof u==='object'){
var nm=String(u.fullName||''),pt=nm.trim().split(' ');
var ini=!nm?'U':pt.length===1?pt[0].substring(0,2).toUpperCase():(pt[0].charAt(0)+pt[pt.length-1].charAt(0)).toUpperCase();
s.setProperty('--user-initials',JSON.stringify(ini));
s.setProperty('--user-first',JSON.stringify(pt[0]||''));
s.setProperty('--user-name',JSON.stringify(nm||'User Account'));
s.setProperty('--user-sub',JSON.stringify(String(u.phoneNumber||u.email||'User')));
if(u.profileImageUrl){var src=String(u.profileImageUrl)+(u.updatedAt?(String(u.profileImageUrl).indexOf('?')>-1?'&':'?')+'v='+encodeURIComponent(String(u.updatedAt)):'');
s.setProperty('--user-photo','url('+JSON.stringify(src)+')')}}
}catch(e){}})();`;

export default function PrePaintScript() {
  // eslint-disable-next-line @next/next/no-sync-scripts
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
