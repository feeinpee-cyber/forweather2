import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Bell, CalendarDays, ChevronDown, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Compass, Droplets, Eye, Gauge, MapPin, Menu, Moon, Search, Settings2, Sun, Sunrise, Sunset, Thermometer, Volume2, VolumeX, Wind, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Place = { name: string; country?: string; latitude: number; longitude: number; timezone?: string };
type HourlyWeather = {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
  weather_code: number[];
  visibility: number[];
  dew_point_2m: number[];
};
type DailyWeather = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
};
type Weather = {
  timezone?: string;
  current: any;
  hourly: HourlyWeather;
  daily: DailyWeather;
  air?: any;
};
const DEFAULT_PLACE: Place = { name: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' };
const API = 'https://api.open-meteo.com/v1/forecast';
const codeText = (c:number) => c===0?'Clear sky':c<=2?'Partly cloudy':c===3?'Overcast':c<=48?'Foggy':c<=57?'Drizzle':c<=67?'Rain':c<=77?'Snow':c<=82?'Rain showers':c<=86?'Snow showers':c>=95?'Thunderstorms':'Cloudy';
function WeatherIcon({code,size=22}:{code:number,size?:number}) { const p={size,strokeWidth:1.7}; if(code===0) return <Sun {...p}/>; if(code<=3)return <Cloud {...p}/>; if(code<=48)return <CloudFog {...p}/>; if(code<=57)return <CloudDrizzle {...p}/>; if(code<=67||code<=82)return <CloudRain {...p}/>; if(code<=77||code<=86)return <CloudSnow {...p}/>; return <CloudLightning {...p}/>; }
function getTheme(c:number,temp=20){if(c>=95)return 'storm';if((c>=71&&c<=77)||c===85||c===86)return 'snow';if(c<=48&&c>=45)return 'fog';if(c===3)return 'cloud';if(c>=51)return 'rain';if(temp>=35&&c<=2)return 'hot';return 'clear'}
function FWLogo(){return <div className="brand-mark" aria-label="ForWeather logo"><span>FW</span><i className="logo-drop d1"/><i className="logo-drop d2"/><i className="logo-drop d3"/></div>}
function fmtTime(iso:string, tz?:string){try{return new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit',timeZone:tz}).format(new Date(iso))}catch{return '--:--'}}

function WeatherGarden({code,temp,isDay}:{code:number;temp:number;isDay:boolean}){
 const host=useRef<HTMLDivElement|null>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  let renderer:any,frame=0,observer:ResizeObserver|undefined,disposed=false,cleanup:(()=>void)|undefined;
  const mount=async()=>{
   try{
    // @ts-ignore Three.js is loaded as an ES module from jsDelivr at runtime.
    const THREE=await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
    if(disposed||!host.current)return;
    const root=host.current;
    const scene=new THREE.Scene();
    const night=!isDay;
    const storm=code>=95,rain=code>=51&&code<=67||code>=80&&code<=82,snow=(code>=71&&code<=77)||code===85||code===86,fog=code>=45&&code<=48,cloudy=code>=2&&code<=3,hot=temp>=35&&code<=1;
    const skyColor=night?0x101e35:storm?0x657b91:rain||fog||cloudy?0xaec3d1:snow?0xc9dce9:hot?0xeacb9f:0x9cccf0;
    scene.background=new THREE.Color(skyColor);
    scene.fog=new THREE.Fog(skyColor,12,28);
    const camera=new THREE.PerspectiveCamera(38,1,.1,100);
    camera.position.set(6.6,5.4,8.8);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.domElement.className='garden-webgl-canvas';renderer.domElement.setAttribute('aria-label','Interactive real-time 3D weather garden. Drag to orbit.');
    root.appendChild(renderer.domElement);
    const hemi=new THREE.HemisphereLight(night?0x7896c0:0xe5f4ff,0x4c604a,night?1.1:2.1);scene.add(hemi);
    const sunLight=new THREE.DirectionalLight(night?0x9bb8e8:0xffedc5,night ? 0.75 : 3.1);sunLight.position.set(-5,9,5);sunLight.castShadow=true;sunLight.shadow.mapSize.set(1024,1024);scene.add(sunLight);
    const groundMat=new THREE.MeshStandardMaterial({color:snow?0xe7eff0:hot?0xb58b5a:rain||storm?0x426d54:0x6d9d61,roughness:.94});
    const island=new THREE.Mesh(new THREE.CylinderGeometry(3.15,3.25,.48,8,1),new THREE.MeshStandardMaterial({color:snow?0xc9dadd:hot?0x815c3e:0x4d6046,roughness:1}));
    island.position.y=-.1;island.castShadow=true;island.receiveShadow=true;scene.add(island);
    const land=new THREE.Mesh(new THREE.CylinderGeometry(3.12,3.12,.14,8,1),groundMat);land.position.y=.17;land.receiveShadow=true;land.castShadow=true;scene.add(land);
    const soil=new THREE.Mesh(new THREE.CircleGeometry(2.93,8),new THREE.MeshStandardMaterial({color:snow?0xdce8e8:hot?0x9b754d:0x638c55,roughness:1}));soil.rotation.x=-Math.PI/2;soil.position.y=.245;scene.add(soil);
    const trunkMat=new THREE.MeshStandardMaterial({color:0x75503a,roughness:1});
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.25,1.55,7),trunkMat);trunk.position.set(-.55,1.02,-.38);trunk.castShadow=true;scene.add(trunk);
    for(let i=0;i<3;i++){const branch=new THREE.Mesh(new THREE.CylinderGeometry(.055,.095,.75,6),trunkMat);branch.position.set(-.55+(i-1)*.28,1.55,-.38);branch.rotation.z=(i-1)*-.52;branch.castShadow=true;scene.add(branch)}
    const leafMat=new THREE.MeshStandardMaterial({color:snow?0xcbd9d3:hot?0x8c9858:0x3f8957,roughness:.85});
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(i%2?.66:.55,2),leafMat);leaf.position.set(-.55+Math.cos(a)*.48,2.08+(i%3)*.25,-.38+Math.sin(a)*.42);leaf.scale.set(1,.92,1);leaf.castShadow=true;scene.add(leaf)}
    const top=new THREE.Mesh(new THREE.IcosahedronGeometry(.68,2),leafMat);top.position.set(-.55,2.72,-.38);top.castShadow=true;scene.add(top);
    const cropMat=new THREE.MeshStandardMaterial({color:snow?0x8eaa9d:hot?0x96944f:0x4f9858,roughness:.8});
    const leafGreen=new THREE.MeshStandardMaterial({color:snow?0xb9cbc3:hot?0xb2a15c:0x7fbd67,roughness:.8});
    const cropPositions=[[-1.75,-.9],[-1.25,-1.25],[-.75,-1.55],[.55,-1.55],[1.05,-1.3],[1.55,-.92],[1.95,-.45]];
    cropPositions.forEach(([x,z],i)=>{
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,.65+(i%3)*.12,6),cropMat);stem.position.set(x,.58,z);stem.castShadow=true;scene.add(stem);
      for(let j=0;j<3;j++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),leafGreen);leaf.scale.set(1,.25,.52);leaf.position.set(x+(j-1)*.14,.58+j*.08,z+(j%2?-.12:.12));leaf.rotation.z=(j-1)*.6;leaf.castShadow=true;scene.add(leaf)}
      if(i%2===0&&!snow){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.105,12,10),new THREE.MeshStandardMaterial({color:i%4===0?0xd85d4d:0xe8b94d,roughness:.55}));fruit.position.set(x,.8,z);fruit.castShadow=true;scene.add(fruit)}
    });
    const rockMat=new THREE.MeshStandardMaterial({color:0x8c9b98,roughness:1});
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.12+(i%3)*.035,0),rockMat);rock.position.set(Math.cos(a)*2.5,.32,Math.sin(a)*2.5);rock.scale.y=.65;rock.castShadow=true;scene.add(rock)}
    const cloudGroup=new THREE.Group();scene.add(cloudGroup);
    const cloudMat=new THREE.MeshStandardMaterial({color:night?0x53677f:storm?0x647486:0xf3f7f8,roughness:1});
    for(let i=0;i<5;i++){const cloud=new THREE.Group();for(let j=0;j<4;j++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.48+(j%2)*.12,12,10),cloudMat);puff.position.set((j-1.5)*.47,(j%2)*.22,0);cloud.add(puff)}cloud.position.set(-4+i*2,3.3+(i%2)*.65,-2.5-(i%3));cloud.scale.setScalar(cloudy||rain||storm||snow?1.1:.72);cloudGroup.add(cloud)}
    const celestial=new THREE.Group();scene.add(celestial);
    if(night){const moon=new THREE.Mesh(new THREE.SphereGeometry(.52,24,20),new THREE.MeshStandardMaterial({color:0xf0e9cf,emissive:0x9badd2,emissiveIntensity:.28,roughness:.8}));moon.position.set(3.6,5.1,-3);celestial.add(moon)}
    else{const sun=new THREE.Mesh(new THREE.SphereGeometry(.48,24,20),new THREE.MeshBasicMaterial({color:0xffe2a0}));sun.position.set(3.6,5.1,-3);celestial.add(sun);const halo=new THREE.Mesh(new THREE.SphereGeometry(.72,24,20),new THREE.MeshBasicMaterial({color:0xffd78c,transparent:true,opacity:.16,depthWrite:false}));halo.position.copy(sun.position);celestial.add(halo)}
    const stars=new THREE.Group();scene.add(stars);
    if(night){for(let i=0;i<100;i++){const star=new THREE.Mesh(new THREE.SphereGeometry(.018+(Math.random()*.025),5,5),new THREE.MeshBasicMaterial({color:i%5===0?0xffe9bd:0xffffff}));star.position.set((Math.random()-.5)*15,2+Math.random()*6,-4-Math.random()*7);stars.add(star)}}
    const particles=new THREE.Group();scene.add(particles);
    const particleCount=rain||snow||storm?240:hot?45:0;
    const particleGeo=new THREE.BufferGeometry(),positions=new Float32Array(particleCount*3),velocities:number[]=[];
    for(let i=0;i<particleCount;i++){positions[i*3]=(Math.random()-.5)*10;positions[i*3+1]=Math.random()*8;positions[i*3+2]=(Math.random()-.5)*8;velocities.push(.035+Math.random()*.07)}
    particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const particleMat=new THREE.PointsMaterial({color:snow?0xffffff:hot?0xffd99a:0xb9ddf2,size:snow ? 0.075 : 0.045,transparent:true,opacity:.8,sizeAttenuation:true});
    const drops=new THREE.Points(particleGeo,particleMat);particles.add(drops);
    const lightning=new THREE.PointLight(0xdcecff,0,18);lightning.position.set(1,5,2);scene.add(lightning);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:night?0x19283a:0x91b3c7,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.36;floor.receiveShadow=true;scene.add(floor);
    let pointerDown=false,lastX=0,lastY=0,yaw=-.48,pitch=-.25,zoom=10.7,lightningAt=0,lightningEnd=0,lastTime=0;
    const updateCamera=()=>{camera.position.set(Math.sin(yaw)*Math.cos(pitch)*zoom,Math.sin(pitch)*zoom+2.1,Math.cos(yaw)*Math.cos(pitch)*zoom);camera.lookAt(0,1.05,0)};
    updateCamera();
    const down=(e:PointerEvent)=>{pointerDown=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)};
    const move=(e:PointerEvent)=>{if(!pointerDown)return;yaw-=(e.clientX-lastX)*.008;pitch=Math.max(-.08,Math.min(.72,pitch+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY;updateCamera()};
    const up=()=>{pointerDown=false};
    const wheel=(e:WheelEvent)=>{zoom=Math.max(7.5,Math.min(15,zoom+e.deltaY*.008));updateCamera()};
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up);renderer.domElement.addEventListener('wheel',wheel,{passive:true});
    const resize=()=>{if(!root.clientWidth||!root.clientHeight)return;camera.aspect=root.clientWidth/root.clientHeight;camera.updateProjectionMatrix();renderer.setSize(root.clientWidth,root.clientHeight,false)};
    observer=new ResizeObserver(resize);observer.observe(root);resize();
    const animate=(t:number)=>{frame=requestAnimationFrame(animate);const dt=Math.min(.04,(t-lastTime)/1000||.016);lastTime=t;cloudGroup.position.x=Math.sin(t*.00008)*.32;stars.rotation.y=t*.000006;const p=particleGeo.attributes.position.array as Float32Array;for(let i=0;i<particleCount;i++){p[i*3+1]-=velocities[i]*(snow ? 0.35 : rain || storm ? 1.8 : 0.35);p[i*3]+=rain || storm ? 0.012 : 0;if(p[i*3+1]<.2){p[i*3+1]=8+Math.random()*2;p[i*3]=(Math.random()-.5)*10}}particleGeo.attributes.position.needsUpdate=true;
      if(storm&&t>lightningAt){lightningAt=t+3500+Math.random()*5500;lightningEnd=t+180+Math.random()*130;lightning.intensity=5+Math.random()*8}
      if(t>lightningEnd)lightning.intensity=Math.max(0,lightning.intensity-dt*24);
      renderer.render(scene,camera)};
    animate(0);setReady(true);
    cleanup=()=>{cancelAnimationFrame(frame);observer?.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',up);renderer.domElement.removeEventListener('wheel',wheel);scene.traverse((o:any)=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach((m:any)=>m.dispose?.());else o.material?.dispose?.()});renderer.dispose();renderer.domElement.remove()};
   }catch(err){console.error('3D weather scene failed to load',err)}
  };
  void mount();return()=>{disposed=true;cleanup?.();if(renderer){renderer.dispose()}};
 },[code,temp,isDay]);
 return <div className="garden-scene"><div className="garden-scene-label"><span>{code>=95?'THUNDER & LIGHTNING':((code>=71&&code<=77)||code===85||code===86)?'SNOWFALL':code>=51?'RAIN SHOWERS':code>=45?'MIST & FOG':temp>=35?'SUN & HEAT':!isDay?'MOONLIT SKY':'SUNNY SKIES'}</span><small>{ready?'Drag to orbit · scroll to zoom':'Preparing 3D weather scene…'}</small></div><div ref={host} className="garden-webgl-host"/></div>
}
function App(){
 const [place,setPlace]=useState<Place>(DEFAULT_PLACE),[weather,setWeather]=useState<Weather|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[results,setResults]=useState<Place[]>([]),[tab,setTab]=useState('Today'),[now,setNow]=useState(new Date()),[sound,setSound]=useState(false),[uiSounds,setUiSounds]=useState(true),[ambience,setAmbience]=useState(false),[volume,setVolume]=useState(24),[settings,setSettings]=useState(false),[unit,setUnit]=useState<'C'|'F'>(()=>{try{return localStorage.getItem('fw-unit')==='F'?'F':'C'}catch{return 'C'}}),[saved,setSaved]=useState<Place[]>(()=>{try{const v=JSON.parse(localStorage.getItem('fw-saved')||'null');return Array.isArray(v)&&v.length?v:[DEFAULT_PLACE]}catch{return [DEFAULT_PLACE]}});
 const audio=useRef<AudioContext|null>(null), noise=useRef<AudioBufferSourceNode|null>(null), gain=useRef<GainNode|null>(null);
 const load=useCallback(async(p:Place)=>{setLoading(true);setError('');try{const u=new URL(API);u.search=new URLSearchParams({latitude:String(p.latitude),longitude:String(p.longitude),current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m',hourly:'temperature_2m,apparent_temperature,precipitation_probability,precipitation,relative_humidity_2m,dew_point_2m,visibility,wind_speed_10m,uv_index,weather_code',daily:'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max',timezone:p.timezone||'auto',forecast_days:'7'}).toString();const a=fetch(u);const b=fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${p.latitude}&longitude=${p.longitude}&current=us_aqi,pm2_5,pm10&timezone=auto`);const [r,ar]=await Promise.all([a,b]);if(!r.ok)throw new Error('Weather provider unavailable');const data=await r.json();let air:any={};if(ar.ok)air=await ar.json();setWeather({...data,air});}catch(e){setError('Could not load live weather. Check your connection and try again.');}finally{setLoading(false)}},[]);
 useEffect(()=>{load(place)},[place,load]);useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t)},[]);useEffect(()=>{try{localStorage.setItem('fw-unit',unit)}catch{}},[unit]);useEffect(()=>{try{localStorage.setItem('fw-saved',JSON.stringify(saved))}catch{}},[saved]);
 const tz=weather?.timezone||place.timezone||'Asia/Riyadh';const time=new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit',second:'2-digit',timeZone:tz}).format(now);const date=new Intl.DateTimeFormat('en',{weekday:'long',month:'long',day:'numeric',timeZone:tz}).format(now);
 const c=weather?.current;const temp=c?.temperature_2m;const convert=(n:number)=>unit==='C'?Math.round(n):Math.round(n*9/5+32);const unitLabel=unit==='C'?'°C':'°F';const code=c?.weather_code??1;const theme=getTheme(code,temp??20);const currentHour=weather?.hourly?.time?.findIndex((x:string)=>new Date(x).getTime()>=Date.now())??0;const hours=weather?.hourly?.time?.slice(Math.max(0,currentHour),Math.max(0,currentHour)+24).map((t:string,i:number)=>({time:t,temp:weather.hourly.temperature_2m[Math.max(0,currentHour)+i],rain:weather.hourly.precipitation_probability[Math.max(0,currentHour)+i],wind:weather.hourly.wind_speed_10m[Math.max(0,currentHour)+i],code:weather.hourly.weather_code[Math.max(0,currentHour)+i]}))||[];
 const daily=weather?.daily?.time?.map((t:string,i:number)=>({date:t,code:weather.daily.weather_code[i],hi:weather.daily.temperature_2m_max[i],lo:weather.daily.temperature_2m_min[i],rain:weather.daily.precipitation_probability_max[i],sunrise:weather.daily.sunrise[i],sunset:weather.daily.sunset[i]}))||[];
 const playTone=(freq=560,duration=.055)=>{if(!uiSounds)return;try{const ctx=audio.current||(audio.current=new AudioContext());if(ctx.state==='suspended')void ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.055,ctx.currentTime+.008);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration)}catch{}};
 const startAmbience=()=>{try{const ctx=audio.current||(audio.current=new AudioContext());if(ctx.state==='suspended')void ctx.resume();if(noise.current){noise.current.stop();noise.current=null}const n=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=n;src.loop=true;filter.type=theme==='rain'?'lowpass':'lowpass';filter.frequency.value=theme==='rain'?900:360;g.gain.value=volume/100*.055;src.connect(filter);filter.connect(g);g.connect(ctx.destination);src.start();noise.current=src;gain.current=g;setAmbience(true)}catch{}};
 const stopAmbience=()=>{noise.current?.stop();noise.current=null;setAmbience(false)};
 const choose=(p:Place)=>{setPlace(p);setSaved(old=>old.some(x=>x.name===p.name)?old:[p,...old].slice(0,6));setQuery('');setResults([]);setTab('Today');playTone(720)};
 const search=async()=>{if(query.trim().length<2)return;try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);const j=await r.json();setResults((j.results||[]).map((x:any)=>({name:x.name,country:x.country,latitude:x.latitude,longitude:x.longitude,timezone:x.timezone})));}catch{setResults([])}};
 const activeHour=weather?.hourly?.time?.[Math.max(0,currentHour)]?Math.max(0,currentHour):0;const visibilityKm=weather?.hourly?.visibility?.[activeHour];const dewPoint=weather?.hourly?.dew_point_2m?.[activeHour];const quality=weather?.air?.current?.us_aqi;const aqiLabel=quality==null?'Unavailable':quality<=50?'Good':quality<=100?'Moderate':quality<=150?'Unhealthy for sensitive groups':quality<=200?'Unhealthy':'Very unhealthy';
 const sunrise=daily[0]?.sunrise,sunset=daily[0]?.sunset;const locate=()=>{if(!navigator.geolocation){setError('Location is not supported by this browser.');return}navigator.geolocation.getCurrentPosition(pos=>choose({name:'Your location',latitude:pos.coords.latitude,longitude:pos.coords.longitude}),()=>setError('Location access was denied. You can still search for a city.'),{enableHighAccuracy:false,timeout:10000,maximumAge:300000})};
 return <div className={`app ${theme} ${c?.is_day===0?'night':'day'}`}>
  <div className="ambient ambient-one"/><div className="ambient ambient-two"/><div className="rain-layer"/>
  <header className="topbar"><div className="brand"><FWLogo/><div><b>ForWeather</b><small>Weather, with more feeling.</small></div></div><div className="top-actions"><div className="clock"><span>{time}</span><small>{date}</small></div><button className="icon-button" onClick={()=>{setSettings(true);playTone()}} aria-label="Settings"><Settings2/></button><button className="avatar" onClick={()=>{setSettings(true);playTone()}}>FW</button></div></header>
  <div className="layout"><aside className="sidebar"><div className="side-label">WORKSPACE</div>{['Today','Forecast','Maps','Insights'].map((x,i)=><button key={x} className={`nav-item ${tab===x?'active':''}`} onClick={()=>{setTab(x);playTone(620)}}>{[<Sun/>,<CalendarDays/>,<Compass/>,<Activity/>][i]}{x}</button>)}<div className="side-label locations-label">YOUR LOCATIONS <button onClick={()=>setSaved([DEFAULT_PLACE])}>+</button></div>{saved.map(p=><button className={`location-item ${p.name===place.name?'selected':''}`} key={p.name} onClick={()=>choose(p)}><MapPin size={15}/><span>{p.name}</span>{p.name===place.name&&<i/>}</button>)}<div className="sidebar-bottom"><div className="mini-note"><span className="pulse"/> LIVE WEATHER DATA<small>Updated from Open-Meteo</small></div><button className="nav-item" onClick={()=>setSettings(true)}><Settings2/>Settings</button></div></aside>
  <main className="main">
   <div className="location-row"><div><div className="eyebrow"><span className="live-dot"/> LIVE CONDITIONS</div><h1>{place.name}<span>{place.country}</span></h1></div><div className="search-wrap"><button className="locate-button" onClick={locate} title="Use my location" aria-label="Use my location"><MapPin size={15}/></button><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Search any city…"/><button onClick={search}>Search</button>{results.length>0&&<div className="search-results">{results.map((p,i)=><button key={i} onClick={()=>choose(p)}><b>{p.name}</b><span>{p.country}</span></button>)}</div>}</div></div>
   {tab==='Today'&&<><section className="hero-card"><div className="hero-copy"><div className="eyebrow">RIGHT NOW · {time}</div><div className="temperature">{loading?'—':convert(temp??0)}<span>{unitLabel}</span></div><h2>{loading?'Loading conditions':codeText(code)}</h2><p>Feels like {c?convert(c.apparent_temperature)+unitLabel:'—'} <span className="dot-sep">·</span> H:{daily[0]?convert(daily[0].hi)+unitLabel:'—'} L:{daily[0]?convert(daily[0].lo)+unitLabel:'—'}</p><div className="hero-tags"><span><Droplets size={14}/> {c?.relative_humidity_2m??'—'}% humidity</span><span><Wind size={14}/> {c?.wind_speed_10m??'—'} km/h wind</span></div></div><div className="hero-art"><WeatherGarden code={code} temp={temp??20} isDay={!!c?.is_day}/></div><div className="hero-foot"><div><span>THE OUTLOOK</span><b>{c?`${codeText(code)} with ${c.cloud_cover}% cloud cover. ${c.wind_speed_10m>25?'Breezy conditions are developing.':'Conditions are currently fairly steady.'}`:'Getting your local forecast…'}</b></div><div className="unit-toggle"><button className={unit==='C'?'chosen':''} onClick={()=>setUnit('C')}>°C</button><button className={unit==='F'?'chosen':''} onClick={()=>setUnit('F')}>°F</button></div></div></section>
   <section className="section"><div className="section-heading"><div><span className="eyebrow">THE NEXT 24 HOURS</span><h3>Hourly forecast</h3></div><button className="text-button" onClick={()=>setTab('Forecast')}>Full forecast ↗</button></div><div className="hourly-card"><div className="hourly-scroll">{hours.slice(0,12).map((h,i)=><div className={`hour ${i===0?'now':''}`} key={h.time}><small>{i===0?'Now':fmtTime(h.time,tz)}</small><WeatherIcon code={h.code} size={22}/><b>{convert(h.temp)}°</b><span><Droplets size={12}/>{h.rain??0}%</span></div>)}</div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={hours.slice(0,12)} margin={{top:8,right:4,left:0,bottom:0}}><defs><linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8fb9e8" stopOpacity={.28}/><stop offset="100%" stopColor="#b7a0ff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#ffffff12" vertical={false}/><XAxis dataKey="time" tickFormatter={v=>fmtTime(v,tz)} tick={{fill:'#61768a',fontSize:10}} axisLine={false} tickLine={false}/><YAxis hide domain={['dataMin - 3','dataMax + 3']}/><Tooltip contentStyle={{background:'#ffffff',border:'1px solid #dce6ee',borderRadius:12,color:'#203448'}} labelFormatter={v=>fmtTime(String(v),tz)} formatter={(v:any)=>[`${convert(Number(v))}${unitLabel}`,'Temperature']}/><Area type="monotone" dataKey="temp" stroke="#c6b5ff" strokeWidth={2.5} fill="url(#tempFill)" dot={false} activeDot={{r:4,fill:'#fff'}}/></AreaChart></ResponsiveContainer></div></div></section>
   <section className="metrics-grid">{[{label:'WIND',value:c?`${Math.round(c.wind_speed_10m)} km/h`:'—',sub:`Gusts ${c?.wind_gusts_10m??'—'} km/h`,icon:<Wind/>},{label:'HUMIDITY',value:c?`${c.relative_humidity_2m}%`:'—',sub:`Dew point ${dewPoint==null?'—':convert(dewPoint)+unitLabel}`,icon:<Droplets/>},{label:'UV INDEX',value:weather?.daily?.uv_index_max?.[0]??'—',sub:'Daily maximum',icon:<Sun/>},{label:'AIR QUALITY',value:quality??'—',sub:aqiLabel,icon:<Activity/>},{label:'PRESSURE',value:c?`${Math.round(c.pressure_msl)} hPa`:'—',sub:'Sea-level pressure',icon:<Gauge/>},{label:'VISIBILITY',value:visibilityKm==null?'—':`${(visibilityKm/1000).toFixed(1)} km`,sub:'Current hourly estimate',icon:<Eye/>}].map(m=><div className="metric-card" key={m.label}><div className="metric-top">{m.icon}<span>{m.label}</span></div><b>{m.value}</b><small>{m.sub}</small></div>)}</section>
   <section className="section"><div className="section-heading"><div><span className="eyebrow">PLAN AHEAD</span><h3>7-day forecast</h3></div><button className="text-button" onClick={()=>setTab('Forecast')}>Details ↗</button></div><div className="daily-card">{daily.map((d,i)=><div className="daily-row" key={d.date}><b>{i===0?'Today':new Intl.DateTimeFormat('en',{weekday:'short',timeZone:tz}).format(new Date(d.date))}</b><WeatherIcon code={d.code} size={20}/><span className="rain-chance"><Droplets size={12}/>{d.rain??0}%</span><div className="range"><span>{convert(d.lo)}°</span><div><i style={{left:`${Math.max(0,Math.min(100,(d.lo+5)/(d.hi+10)*100))}%`}}/></div><strong>{convert(d.hi)}°</strong></div></div>)}</div></section>
   <section className="sun-strip"><div><Sunrise/><span><small>SUNRISE</small><b>{sunrise?fmtTime(sunrise,tz):'—'}</b></span></div><div className="day-progress"><div/><small>DAYLIGHT WINDOW</small></div><div><Sunset/><span><small>SUNSET</small><b>{sunset?fmtTime(sunset,tz):'—'}</b></span></div></section></>}
   {tab==='Forecast'&&<section className="section page-panel"><span className="eyebrow">LOOK AHEAD</span><h2>Forecast</h2><p className="muted">Your week, with the details that help you plan.</p><div className="daily-card">{daily.map((d,i)=><div className="daily-row" key={d.date}><b>{new Intl.DateTimeFormat('en',{weekday:'long',month:'short',day:'numeric',timeZone:tz}).format(new Date(d.date))}</b><WeatherIcon code={d.code} size={22}/><span className="rain-chance"><Droplets size={12}/>{d.rain??0}%</span><div className="range"><span>{convert(d.lo)}°</span><div/><strong>{convert(d.hi)}°</strong></div></div>)}</div><h3>Hourly detail</h3><div className="hour-detail">{hours.map(h=><div key={h.time}><span>{fmtTime(h.time,tz)}</span><WeatherIcon code={h.code}/><b>{convert(h.temp)}°</b><span><Droplets size={13}/>{h.rain}%</span><span><Wind size={13}/>{h.wind} km/h</span></div>)}</div></section>}
   {tab==='Maps'&&<section className="section page-panel"><span className="eyebrow">WEATHER IN MOTION</span><h2>Weather maps</h2><p className="muted">Map layers are planned for the next build. This starter keeps the forecast data live while we integrate a map provider.</p><div className="map-placeholder"><div className="map-grid"/><div className="map-pin"><MapPin size={28}/><b>{place.name}</b></div><span>MAP LAYERS COMING NEXT</span></div><div className="map-layer-list">{['Precipitation radar','Wind flow','Temperature','Cloud cover','Air quality'].map(x=><div key={x}><Cloud size={17}/>{x}<span>Planned</span></div>)}</div></section>}
   {tab==='Insights'&&<section className="section page-panel"><span className="eyebrow">BEYOND THE FORECAST</span><h2>Weather insights</h2><p className="muted">A clearer interpretation of the conditions around you.</p><div className="insight-grid"><div className="insight-card"><Sun/><small>OUTDOOR COMFORT</small><b>{c?Math.max(0,100-Math.abs(c.apparent_temperature-22)*3-c.relative_humidity_2m*.25):'—'} / 100</b><p>A simple comfort estimate based on apparent temperature and humidity, not a medical or safety rating.</p></div><div className="insight-card"><Activity/><small>AIR QUALITY</small><b>{aqiLabel}</b><p>US AQI {quality??'unavailable'} · PM2.5 {weather?.air?.current?.pm2_5??'—'} μg/m³ · PM10 {weather?.air?.current?.pm10??'—'} μg/m³</p></div><div className="insight-card"><Wind/><small>WIND CONDITIONS</small><b>{c?.wind_speed_10m??'—'} km/h</b><p>{c?.wind_gusts_10m>35?'Strong gusts are possible.': 'Wind conditions are currently being monitored.'}</p></div><div className="insight-card"><Sunrise/><small>DAYLIGHT</small><b>{sunrise?fmtTime(sunrise,tz)+' – '+fmtTime(sunset,tz):'—'}</b><p>Sunrise and sunset based on the selected location.</p></div></div></section>}
   {error&&<div className="error-banner">{error}<button onClick={()=>load(place)}>Retry</button></div>}
   <footer>ForWeather <span>·</span> Weather data by Open-Meteo <span>·</span> Forecasts are informational, not official warnings.</footer>
  </main></div>
  <nav className="mobile-nav">{[['Today',<Sun/>],['Forecast',<CalendarDays/>],['Maps',<Compass/>],['Insights',<Activity/>]].map(([x,ic]:any)=><button className={tab===x?'active':''} key={x} onClick={()=>{setTab(x);playTone(620)}}>{ic}<span>{x}</span></button>)}</nav>
  {settings&&<div className="modal-backdrop" onClick={()=>setSettings(false)}><div className="settings-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PREFERENCES</span><h2>Sound & settings</h2></div><button className="icon-button" onClick={()=>setSettings(false)}><X/></button></div><div className="setting-row"><div><b>Interface sounds</b><small>Soft feedback for clicks and controls</small></div><button className={`switch ${uiSounds?'on':''}`} onClick={()=>setUiSounds(!uiSounds)}/></div><div className="setting-row"><div><b>Weather ambience</b><small>Optional atmospheric background audio</small></div><button className={`switch ${ambience?'on':''}`} onClick={()=>ambience?stopAmbience():startAmbience()}/></div><div className="setting-row"><div><b>Sound volume</b><small>Adjust the ambience level</small></div><strong>{volume}%</strong></div><input className="volume" type="range" min="0" max="70" value={volume} onChange={e=>{setVolume(Number(e.target.value));if(gain.current)gain.current.gain.value=Number(e.target.value)/100*.055}}/><div className="setting-row"><div><b>Temperature unit</b><small>Choose Celsius or Fahrenheit</small></div><div className="unit-toggle"><button className={unit==='C'?'chosen':''} onClick={()=>setUnit('C')}>°C</button><button className={unit==='F'?'chosen':''} onClick={()=>setUnit('F')}>°F</button></div></div><p className="settings-note">Weather ambience is synthesized in this starter prototype. We can replace it with high-quality recorded sound loops in a later release. Your browser requires a user gesture before audio can play.</p></div></div>}
 </div>
}
export default App;