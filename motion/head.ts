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

export const headScript = lazyScript + `(function(){try{var d=document.documentElement;d.classList.add('js');var n=navigator,c=n.connection;if(matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(min-width: 64rem)').matches||(c&&(c.saveData||/^(slow-)?2g$/.test(c.effectiveType||'')))||(n.deviceMemory&&n.deviceMemory<=2))return;d.classList.add('motion');var f=function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion')},t=function(){setTimeout(f,8000)};if(document.readyState==='complete')t();else addEventListener('load',t,{once:true});setTimeout(f,25000)}catch(e){}})();`;
