import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as core from '../docs/core.mjs';
import * as physics from '../docs/physics2d.mjs';
import * as immersive from '../docs/immersive.mjs';
import * as sprites from '../docs/sprites.mjs';

const html=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../docs/game2d.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');

// Execute the application handlers and real physics, with browser surfaces stubbed.
// This verifies input/state transitions, not browser hit testing or CSS layout.
function game({desktop=true,width=1600,height=900,storage='{}'}={}){
  const listeners=new Map(),elements=new Map(),captures=new Set(),media=new Map();
  function element(id=''){
    const classes=new Set();
    return {id,hidden:new RegExp(`<[^>]*id="${id}"[^>]*\\bhidden\\b`).test(html),disabled:false,textContent:'',style:{},children:[],
      classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,force){const on=force??!classes.has(c);on?classes.add(c):classes.delete(c);return on}},
      setAttribute(){},append(child){this.children.push(child)},replaceChildren(){this.children=[]},querySelectorAll(){return []},
      focus(){document.activeElement=this},closest(){return null},getContext(){return {setTransform(){}}},
      setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
  }
  for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],element(match[1]));
  const document={hidden:false,fullscreenElement:null,documentElement:{},body:element('body'),activeElement:null,
    getElementById:id=>elements.get(id),createElement:()=>element(),querySelectorAll:()=>[],
    addEventListener:(name,cb)=>listeners.set(name,cb)};
  const context=vm.createContext({...core,...physics,...immersive,...sprites,document,console,
    innerWidth:width,innerHeight:height,devicePixelRatio:1,performance:{now:()=>0},
    localStorage:{getItem:()=>storage,setItem(){}},setTimeout:()=>0,clearTimeout(){},
    Image:class{},requestAnimationFrame(){},location:{reload(){}},screen:{orientation:{addEventListener(){}}},
    matchMedia(query){const m={matches:query==='(any-pointer: fine)'&&desktop,addEventListener:(name,cb)=>{m.change=cb}};media.set(query,m);return m},
    addEventListener:(name,cb)=>listeners.set(name,cb)});
  vm.runInContext(source,context);
  const run=code=>vm.runInContext(code,context);
  const canvas=elements.get('scene');
  const event=(x=physics.ANCHOR.x,y=physics.ANCHOR.y,extra={})=>{
    const scale=Math.min(context.innerWidth/1600,context.innerHeight/900);
    return {pointerId:1,pointerType:'mouse',isPrimary:true,button:0,buttons:1,
      clientX:(context.innerWidth-1600*scale)/2+x*scale,
      clientY:context.innerHeight/2-450*scale+y*scale,preventDefault(){},...extra};
  };
  function start(){run('ready=true');elements.get('campaign').onclick()}
  function shoot(type='mouse'){
    canvas.onpointerdown(event(undefined,undefined,{pointerType:type}));
    canvas.onpointermove(event(190,615,{pointerType:type}));
    canvas.onpointerup(event(190,615,{pointerType:type,buttons:0}));
  }
  return {context,elements,document,listeners,captures,media,canvas,run,event,start,shoot};
}

test('PC : campagne accessible directement en fenêtre paysage ou portrait',()=>{
  for(const [width,height] of [[1600,900],[900,1100],[600,800]]){
    const g=game({width,height});
    assert.equal(g.elements.get('appgate').hidden,true);
    g.start();assert.equal(g.run('mode'),'battle');
    g.shoot();assert.equal(g.run('battle.shots'),4);
    assert.equal(g.run('battle.projectiles.length'),1);
    assert.ok(g.run('battle.projectiles[0].vx')>0);
    assert.ok(g.run('battle.projectiles[0].vy')<0);
    assert.equal(g.captures.size,0);
  }
});

test('clic simple, clic droit et glissement vers l’avant ne tirent pas',()=>{
  const g=game();g.start();
  g.canvas.onpointerdown(g.event());g.canvas.onpointerup(g.event(undefined,undefined,{buttons:0}));
  g.canvas.onpointerdown(g.event(undefined,undefined,{button:2,buttons:2}));
  g.canvas.onpointermove(g.event(190,615,{buttons:2}));
  g.canvas.onpointerup(g.event(190,615,{button:2,buttons:0}));
  g.canvas.onpointerdown(g.event());g.canvas.onpointermove(g.event(430,615));g.canvas.onpointerup(g.event(430,615,{buttons:0}));
  assert.equal(g.run('battle.shots'),5);assert.equal(g.run('battle.flying'),false);
});

test('clic en vol et Espace activent réellement le pouvoir une seule fois',()=>{
  for(const method of ['click','space']){
    const g=game();g.start();g.shoot();
    if(method==='click')g.canvas.onpointerdown(g.event(900,500));
    else g.listeners.get('keydown')({code:'Space',key:' ',repeat:false,target:g.canvas,preventDefault(){}});
    assert.equal(g.run('battle.projectiles[0].used'),true);
    const powers=g.run("battle.events.filter(e=>e.kind==='power').length");
    g.canvas.onpointerdown(g.event(900,500));
    assert.equal(g.run("battle.events.filter(e=>e.kind==='power').length"),powers);
    assert.equal(g.run('battle.shots'),4);
  }
});

test('Espace laisse les contrôles et leurs actions clavier fonctionner',()=>{
  const g=game();g.start();g.shoot();
  g.listeners.get('keydown')({code:'Space',key:' ',repeat:false,target:{closest:()=>g.elements.get('pause')},preventDefault(){throw Error('Contrôle intercepté')}});
  assert.equal(g.run('battle.projectiles[0].used'),false);
});

test('annulation, perte de capture/focus, resize et pause ne consomment aucune offrande',()=>{
  for(const reason of ['cancel','capture','blur','resize','visibility','pause','settings','released']){
    const g=game();g.start();g.canvas.onpointerdown(g.event());g.canvas.onpointermove(g.event(190,615));
    if(reason==='cancel')g.canvas.onpointercancel(g.event());
    if(reason==='capture')g.canvas.onlostpointercapture(g.event());
    if(reason==='blur')g.listeners.get('blur')();
    if(reason==='resize'){g.context.innerWidth=1200;g.listeners.get('resize')()}
    if(reason==='visibility'){g.document.hidden=true;g.listeners.get('visibilitychange')()}
    if(reason==='pause')g.elements.get('pause').onclick();
    if(reason==='settings')g.elements.get('settings').onclick();
    if(reason==='released')g.canvas.onpointermove(g.event(190,615,{buttons:0}));
    g.canvas.onpointerup(g.event(190,615,{buttons:0}));
    assert.equal(g.run('battle.shots'),5,reason);assert.equal(g.run('drag'),null,reason);assert.equal(g.captures.size,0,reason);
  }
});

test('second pointeur ne vole pas le geste et un relâchement extérieur est traité par capture',()=>{
  const g=game();g.start();g.canvas.onpointerdown(g.event());
  g.canvas.onpointerdown(g.event(190,615,{pointerId:2,isPrimary:false}));
  g.canvas.onpointermove(g.event(190,615,{pointerId:2}));
  g.canvas.onpointerup(g.event(190,615,{pointerId:2}));
  assert.equal(g.run('battle.shots'),5);assert.ok(g.captures.has(1));
  g.canvas.onpointermove(g.event(-100,615));g.canvas.onpointerup(g.event(-100,615,{buttons:0}));
  assert.equal(g.run('battle.shots'),4);assert.equal(g.captures.size,0);
});

test('plein écran PC : optionnel, pas de verrouillage paysage, sortie sans blocage',async()=>{
  const g=game();g.start();let locks=0;
  g.context.screen.orientation.lock=async()=>{locks++};
  g.document.documentElement.requestFullscreen=async()=>{g.document.fullscreenElement=g.document.documentElement};
  await g.elements.get('fullscreen').onclick();
  assert.equal(locks,0);
  g.document.fullscreenElement=null;g.listeners.get('fullscreenchange')();
  assert.equal(g.elements.get('appgate').hidden,true);
  g.shoot();assert.equal(g.run('battle.shots'),4);
});

test('refus du plein écran PC : la campagne reste jouable',async()=>{
  const g=game();g.document.documentElement.requestFullscreen=async()=>{throw Error('Refus')};
  await g.elements.get('fullscreen').onclick();
  assert.equal(g.elements.get('appgate').hidden,true);
  g.start();g.shoot();assert.equal(g.run('battle.shots'),4);
});

test('tactile et stylet : glissement conservé, portrait suspendu sans tir accidentel',()=>{
  for(const pointerType of ['touch','pen']){
    const g=game({desktop:false,width:844,height:390});
    assert.equal(g.elements.get('appgate').hidden,false);
    g.run('entered=true;gate()');g.start();
    g.canvas.onpointerdown(g.event(undefined,undefined,{pointerType}));
    g.canvas.onpointermove(g.event(190,615,{pointerType}));
    g.context.innerWidth=390;g.context.innerHeight=844;g.listeners.get('resize')();
    assert.equal(g.elements.get('appgate').hidden,false);assert.equal(g.run('battle.shots'),5);
    g.context.innerWidth=844;g.context.innerHeight=390;g.listeners.get('resize')();
    g.shoot(pointerType);assert.equal(g.run('battle.shots'),4);
  }
});

test('sauvegarde existante conservée à l’ouverture PC',()=>{
  const stored={essence:150,rank:2,wins:[3,2,0,0,0],selected:3};
  const g=game({storage:JSON.stringify(stored)});
  assert.deepEqual(JSON.parse(g.run('JSON.stringify(save)')),stored);
});
