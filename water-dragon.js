/* A lightweight companion outside the scaled portfolio canvas.
   It swims in the scroll direction, then settles; no perpetual idle render loop. */
const host = document.getElementById('water-dragon');
const viewport = document.getElementById('viewport');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
if (host && viewport) initDragon().catch(error => {
  host.hidden = true;
  console.warn('Water dragon unavailable:', error);
});
async function initDragon() {
  const THREE = await import('./assets/vendor/three/build/three.module.js');
  const {GLTFLoader} = await import('./assets/vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.setAttribute('aria-hidden','true');
  const greet = document.getElementById('dragon-greet');
  greet.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31,1,.1,30);
  camera.position.set(2.4,.7,7.5);
  camera.lookAt(-.15,.05,.25);
  const ambient = new THREE.HemisphereLight(0xdffaff,0x598795,2.6);
  const key = new THREE.DirectionalLight(0xffefdc,3.2);
  key.position.set(-3,5,6);
  const rim = new THREE.DirectionalLight(0x63cfee,1.5);
  rim.position.set(3,2,-4);
  scene.add(ambient,key,rim);
  const {scene:dragon} = await new GLTFLoader().loadAsync(new URL('./assets/3d/water-dragon.glb',import.meta.url).href);
  const swimmer = new THREE.Group();
  swimmer.add(dragon);
  scene.add(swimmer);
  const fins = [];
  for (const [name,sign] of [['FinLeft',-1],['FinRight',1]]) {
    const joint = new THREE.Group();
    joint.position.set(sign*.35,-.05,.09);
    dragon.add(joint);
    for (const partName of [name,name+'Tip']) {
      const mesh = dragon.getObjectByName(partName);
      if (!mesh) continue;
      mesh.geometry.translate(-joint.position.x,-joint.position.y,-joint.position.z);
      joint.add(mesh);
    }
    fins.push({joint,sign});
  }
  const flexible = ['Tail','TailFin'].map(name=>dragon.getObjectByName(name)).filter(Boolean).map(mesh=>({
    mesh, original:Float32Array.from(mesh.geometry.attributes.position.array)
  }));
  const bubbles = new THREE.Group();
  const bubbleGeometry = new THREE.SphereGeometry(.045,8,6);
  const bubbleMaterial = new THREE.MeshBasicMaterial({color:0x84ddeb,transparent:true,opacity:.6});
  for(let i=0;i<5;i++) bubbles.add(new THREE.Mesh(bubbleGeometry,bubbleMaterial));
  scene.add(bubbles);
  let active = true, frame = 0, lastFrame = 0;
  let lastScroll = viewport.scrollTop, lastScrollTime = performance.now();
  let impulse = 0, direction = 1, y = 0, targetY = 0;
  let swimUntil = performance.now()+2400, greetUntil = 0;
  const arrow = host.querySelector('.dragon-direction');
  const clamp = THREE.MathUtils.clamp;
  function updateTarget() {
    const height = host.getBoundingClientRect().height || 180;
    const progress = clamp(viewport.scrollTop/Math.max(1,viewport.scrollHeight-viewport.clientHeight),0,1);
    const minY = Math.min(110,innerHeight*.18);
    const travel = Math.max(0,innerHeight-height-minY-90);
    targetY = motion.matches ? minY+travel*.65 : minY+travel*progress;
  }
  function position() {
    host.style.transform = 'translate3d('+(-Math.abs(impulse)*7)+'px,'+y+'px,0)';
  }
  function render() { if (active) renderer.render(scene,camera); }
  function fit() {
    if(!active)return;
    const box = greet.getBoundingClientRect();
    renderer.setSize(box.width || 148,box.height || 180,false);
    camera.aspect=(box.width || 148)/(box.height || 180);
    camera.updateProjectionMatrix();
    updateTarget();
    y=targetY;
    position();
    render();
  }
  function applyTheme() {
    const dark=document.body.classList.contains('star-mode');
    ambient.intensity=dark?1.8:2.6;
    key.intensity=dark?2:3.2;
    key.color.set(dark?0xaad8ff:0xffefdc);
    rim.intensity=dark?2.6:1.5;
    dragon.traverse(o=>{
      if(o.isMesh && o.material.name.startsWith('Dragon')) {
        o.material.emissive.copy(o.material.color);
        o.material.emissiveIntensity=dark?.12:0;
      }
    });
    render();
  }
  function pose(now,dt) {
    const t=now*.001;
    impulse*=Math.pow(.08,dt);
    y+=(targetY-y)*Math.min(1,dt*7);
    const moving=now<swimUntil;
    const happy=now<greetUntil;
    const stroke=moving?Math.sin(t*(happy?9:5)):0;
    swimmer.rotation.z=impulse*.18+(happy?Math.sin(t*7)*.11:0);
    swimmer.rotation.y=-.1+stroke*.07;
    swimmer.position.y=moving?Math.sin(t*3)*.055:0;
    fins.forEach(({joint,sign})=>{joint.rotation.z=sign*stroke*(happy?.6:.25);});
    flexible.forEach(({mesh,original})=>{
      const values=mesh.geometry.attributes.position.array;
      for(let i=0;i<values.length;i+=3) {
        const amount=clamp(-original[i+1]-.4,0,1);
        values[i]=original[i]+Math.sin(t*5+original[i+1]*3)*.07*amount*(moving?1:0);
        values[i+2]=original[i+2]+Math.cos(t*5+original[i+1]*3)*.07*amount*(moving?1:0);
      }
      mesh.geometry.attributes.position.needsUpdate=true;
    });
    bubbles.visible=moving && Math.abs(impulse)>.06;
    bubbles.children.forEach((bubble,i)=>{
      const phase=(t*.6+i*.2)%1;
      bubble.position.set(-.6-i*.12, -.65+phase*2.3, -.2-i*.12);
      bubble.scale.setScalar(.6+phase*.7);
    });
    host.classList.toggle('is-swimming',moving && Math.abs(impulse)>.035);
    position();
  }
  function animate(now) {
    frame=0;
    if(!active || document.hidden || motion.matches)return;
    if(now-lastFrame>=32) {
      const dt=Math.min((now-lastFrame)/1000,.05);
      lastFrame=now;
      pose(now,dt);render();
    }
    if(now<swimUntil || now<greetUntil || Math.abs(y-targetY)>.2) frame=requestAnimationFrame(animate);
    else {host.classList.remove('is-swimming');impulse=0;y=targetY;pose(now,.05);render();}
  }
  function wake() {
    if(!active || document.hidden)return;
    if(motion.matches) {
      impulse=0;y=targetY;swimmer.rotation.set(0,-.1,0);swimmer.position.y=0;
      fins.forEach(({joint})=>joint.rotation.z=0);bubbles.visible=false;position();render();
      return;
    }
    if(!frame) {lastFrame=performance.now();frame=requestAnimationFrame(animate);}
  }
  viewport.addEventListener('scroll',()=>{
    if(!active)return;
    const now=performance.now();
    const delta=viewport.scrollTop-lastScroll;
    const speed=delta/Math.max(16,now-lastScrollTime);
    if(Math.abs(delta)>.5) {
      direction=delta>0?1:-1;
      impulse=clamp(speed/3,-1,1);
      arrow.textContent=direction>0?'↓':'↑';
      swimUntil=now+1100;
    }
    lastScroll=viewport.scrollTop;lastScrollTime=now;
    updateTarget();wake();
  },{passive:true});
  greet.addEventListener('click',()=>{
    if(motion.matches) {swimmer.rotation.y+=.3;render();return;}
    greetUntil=performance.now()+1400;swimUntil=greetUntil;wake();
  });
  document.getElementById('dragon-hide').addEventListener('click',()=>{
    active=false;host.hidden=true;cancelAnimationFrame(frame);renderer.dispose();
  });
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();active=false;host.hidden=true;cancelAnimationFrame(frame);
  });
  document.addEventListener('portfolio:theme',applyTheme);
  window.addEventListener('resize',fit);
  const sizeObserver=new ResizeObserver(()=>{updateTarget();wake();});
  sizeObserver.observe(document.getElementById('stage'));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();
  });
  motion.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;updateTarget();wake();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',()=>{updateTarget();wake();});
  host.hidden=false;host.style.top='0';
  fit();applyTheme();wake();
}
