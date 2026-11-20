/**
 * Runs in <head>, before the first paint (see app/layout.tsx). Motion is opt-in: html.motion is set only on wide
 * screens (64rem and up) when the visitor has not asked for reduced motion, is not on a slow connection or saving
 * data (Save-Data, 2G), and is not on a device with 2 GB of memory or less. Those visitors get the complete static
 * page (real pictures of the 3D model, all the words) and download no 3D or animation code. The CSS hides animated
 * pieces only under that class, so nothing flashes; without JavaScript, on phones and under reduced motion
 * everything is simply visible. If the engine has not taken over (html.motion-ready) within eight seconds the
 * class is removed again, so a failed script can never leave a page hidden.
 */
export const headScript = `(function(){try{var d=document.documentElement;d.classList.add('js');var n=navigator,c=n.connection;if(matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(min-width: 64rem)').matches||(c&&(c.saveData||/^(slow-)?2g$/.test(c.effectiveType||'')))||(n.deviceMemory&&n.deviceMemory<=2))return;d.classList.add('motion');setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion')},8000)}catch(e){}})();`;
