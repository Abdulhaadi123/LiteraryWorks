/**
 * Runs in <head>, before the first paint (see app/layout.tsx). Motion is opt-in: html.motion is set only on wide
 * screens (64rem and up) when the visitor has not asked for reduced motion, is not on a slow connection or saving
 * data (Save-Data, 2G), and is not on a device with 2 GB of memory or less. Those visitors get the complete static
 * page (real pictures of the 3D model, all the words) and download no 3D or animation code. The CSS hides animated
 * pieces only under that class, so nothing flashes; without JavaScript, on phones and under reduced motion
 * everything is simply visible. If the engine has not taken over (html.motion-ready) eight seconds after the page
 * has finished loading (25 seconds at most), the class is removed again, so a failed script can never leave a page
 * hidden, while a slow load on a busy machine still gets its scroll effects.
 */
/**
 * The first part, phones and tablets only: on a fresh visit (no #section in the address, not a reload or Back) the
 * sections below the first screen are laid out only when they come near it (html.lazy, see app/styles/site.css), so
 * the first paint does not wait for the whole page. Before anything that jumps to a place on the page (a link with a
 * #, Back or Forward, a change of #) the class comes off, so the jump is worked out from the sections' real heights.
 */
const lazyScript = `(function(){try{var d=document.documentElement;if(!matchMedia('(max-width: 63.99rem)').matches)return;var v=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];if(location.hash||(v&&v.type!=='navigate'))return;d.classList.add('lazy');var off=function(){d.classList.remove('lazy');removeEventListener('click',k,true);removeEventListener('popstate',off);removeEventListener('hashchange',off)};var k=function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(a&&a.getAttribute('href').indexOf('#')>=0)off()};addEventListener('click',k,true);addEventListener('popstate',off);addEventListener('hashchange',off)}catch(e){}})();`;

/**
 * The pages that have a 3D scene on a wide screen: the home page, the services page and each service's page, the about and
 * audit pages and the case studies page (not a single case study, the contact page or the legal pages). As a piece of script
 * (an expression that is true on one of them), for the two scripts below.
 */
const scenePage = `(function(){var s=location.pathname.split('/').filter(Boolean);return s.length===0||(s[0]==='services'&&s.length<3)||(s.length===1&&(s[0]==='about'||s[0]==='ai-audit'||s[0]==='work'))})()`;

/**
 * The 3D scenes on phones and tablets (html.live3d): every page that has a scene on a wide screen draws it live, with its own
 * block-by-block layout (see app/styles/xp.css) and none of the desktop's scroll engine (no GSAP, no smooth scroll). Only a
 * screen under 64rem, and only where the device is likely to cope: not under reduced motion, Save-Data or a slow connection,
 * not with 2 GB of memory or less, not with fewer than 4 processor cores. `?3d=off` keeps the plain page (to compare).
 * If the scene has neither started nor failed ten seconds after the page has loaded (30 at most), the class is removed again
 * and the plain page shows.
 */
const live3dScript = `(function(){try{var d=document.documentElement,n=navigator,c=n.connection;if(!${scenePage}||matchMedia('(min-width: 64rem)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]3d=off/.test(location.search))return;if((c&&(c.saveData||/^(slow-)?2g$/.test(c.effectiveType||'')))||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<4))return;d.classList.add('live3d');var f=function(){if(!document.querySelector('.xp.xp-live,.xp.xp-failed'))d.classList.remove('live3d')},t=function(){setTimeout(f,10000)};if(document.readyState==='complete')t();else addEventListener('load',t,{once:true});setTimeout(f,30000)}catch(e){}})();`;

/**
 * The page is built for the width it was opened at (the desktop's scroll engine and layout, or the phone's blocks): the
 * classes above are set once, before the first paint. So when the window is made narrower or wider across 64rem (a browser
 * window being dragged, a phone turned on its side, the developer tools' device mode) the page loads again, and the head
 * script chooses again. Only where the other width would look different: the desktop layout is on (`html.motion`), the
 * phone's live scene is on (`html.live3d`), or the new width would turn one of them on. Every other page has only
 * responsive CSS and needs nothing. It waits a moment, so a window being dragged across the line loads once.
 */
const resizeScript = `(function(){try{var d=document.documentElement,mq=matchMedia('(min-width: 64rem)'),wide=mq.matches,t=0;var go=function(){clearTimeout(t);t=setTimeout(function(){if(mq.matches===wide)return;var n=navigator,c=n.connection,can=!matchMedia('(prefers-reduced-motion: reduce)').matches&&!(c&&(c.saveData||/^(slow-)?2g$/.test(c.effectiveType||'')))&&!(n.deviceMemory&&n.deviceMemory<=2);if(d.classList.contains('motion')||d.classList.contains('live3d')||(can&&(mq.matches||${scenePage})))location.reload();else wide=mq.matches},300)};if(mq.addEventListener)mq.addEventListener('change',go);else if(mq.addListener)mq.addListener(go)}catch(e){}})();`;

/** The admin area (/admin) is not the public site: none of these classes or reloads apply there. */
const adminGuard = `if(location.pathname==='/admin'||location.pathname.indexOf('/admin/')===0)return;`;

export const headScript = `(function(){${adminGuard}` + lazyScript + live3dScript + resizeScript + `(function(){try{var d=document.documentElement;d.classList.add('js');var n=navigator,c=n.connection;if(matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(min-width: 64rem)').matches||(c&&(c.saveData||/^(slow-)?2g$/.test(c.effectiveType||'')))||(n.deviceMemory&&n.deviceMemory<=2))return;d.classList.add('motion');var f=function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion')},t=function(){setTimeout(f,8000)};if(document.readyState==='complete')t();else addEventListener('load',t,{once:true});setTimeout(f,25000)}catch(e){}})();` + `})();`;
