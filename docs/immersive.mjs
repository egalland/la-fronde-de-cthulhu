export const isLandscape=(width,height)=>width>height;
export async function enterImmersive(document,orientation){let fullscreen=!!(document.fullscreenElement||document.webkitFullscreenElement),locked=false;const root=document.documentElement;if(!fullscreen){try{const request=root.requestFullscreen||root.webkitRequestFullscreen;if(request){await request.call(root,{navigationUI:'hide'});fullscreen=!!(document.fullscreenElement||document.webkitFullscreenElement)}}catch{}}
try{if(orientation?.lock){await orientation.lock('landscape');locked=true}}catch{}
return {fullscreen,locked};}
export function pullAim(anchor,point){const dx=anchor.x-point.x,dy=Math.max(-30,Math.min(140,point.y-anchor.y));if(dx<8)return null;const length=Math.min(145,Math.hypot(dx,dy)),angle=Math.max(8,Math.min(65,Math.atan2(Math.max(15,dy),dx)*180/Math.PI)),a=angle*Math.PI/180;return {angle,force:Math.max(20,Math.min(100,length/145*100)),point:{x:anchor.x-Math.cos(a)*length,y:anchor.y+Math.sin(a)*length}}}
