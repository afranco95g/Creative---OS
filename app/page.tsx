'use client';
import { useMemo, useState } from 'react';
import { Send, MessageCircle, ClipboardList, BookOpen, FileText, Activity, Plus, Download, Sparkles, CheckCircle2, AlertCircle, Target, Users, CalendarDays, Handshake, WalletCards } from 'lucide-react';

type View = 'chat' | 'proyecto' | 'bitacora' | 'documentos' | 'ipp';

type Project = {
  name: string;
  generalObjective: string;
  specificObjectives: string[];
  context: string;
  community: string;
  activities: string[];
  resources: string[];
  budget: string;
  alliances: string[];
  nextSteps: string[];
};

const initialProject: Project = {
  name: 'Charlie Gelato',
  generalObjective: 'Crear una heladería artesanal que funcione también como espacio cultural, conectando producto, comunidad y experiencias creativas en Bogotá.',
  specificObjectives: [
    'Diseñar una primera línea de experiencias culturales alrededor del gelato y la creatividad.',
    'Validar el producto mediante talleres, activaciones y espacios aliados.',
    'Crear una comunidad inicial interesada en cultura, diseño, gastronomía y encuentros presenciales.',
    'Construir una propuesta comercial para marcas, espacios y posibles aliados.'
  ],
  context: 'Bogotá tiene una red creciente de espacios creativos independientes que buscan programación, comunidad y sostenibilidad. Charlie Gelato puede entrar como producto y experiencia cultural sin depender inicialmente de un local propio.',
  community: 'Personas entre 18 y 35 años interesadas en cultura, arte, diseño, gastronomía y experiencias de barrio.',
  activities: ['Taller de serigrafía + gelato', 'Degustación en espacio aliado', 'Pop-up cultural', 'Registro de comunidad', 'Contenido editorial con periodistas aliados'],
  resources: ['Producto inicial', 'Espacios aliados', 'Periodistas culturales', 'Productores ejecutivos', 'Base de datos de asistentes'],
  budget: '$45.000.000 COP estimado para primera fase',
  alliances: ['Taller Ujalata', 'Espacios creativos independientes', 'Periodistas culturales'],
  nextSteps: ['Definir propuesta de valor', 'Armar presupuesto inicial', 'Diseñar primera activación', 'Crear one pager para aliados']
};

const initialLog = [
  { title: 'Definimos el propósito del proyecto', time: 'Hoy, 11:23 AM', text: 'Charlie Gelato puede ser más que una heladería: una excusa para activar cultura, comunidad y experiencias presenciales.', tag: 'Propósito' },
  { title: 'Identificamos comunidad objetivo', time: 'Hoy, 11:45 AM', text: 'Personas jóvenes interesadas en arte, diseño, gastronomía, experiencias auténticas y espacios de encuentro.', tag: 'Comunidad' },
  { title: 'Detectamos oportunidades clave', time: 'Hoy, 12:10 PM', text: 'Activaciones con talleres, espacios aliados, contenido editorial y producto incluido dentro de la experiencia.', tag: 'Oportunidad' }
];

function Sidebar({ view, setView }: { view: View; setView: (v: View) => void }) {
  const items = [
    ['chat', MessageCircle, 'Chat'], ['proyecto', ClipboardList, 'Proyecto'], ['bitacora', BookOpen, 'Bitácora'], ['documentos', FileText, 'Documentos'], ['ipp', Activity, 'IPP']
  ] as const;
  return <aside className="w-full md:w-64 md:min-h-screen border-r border-white/10 bg-black/80 p-5 flex md:flex-col gap-4 md:gap-6 sticky top-0 z-20 overflow-x-auto">
    <div className="hidden md:block"><div className="text-3xl font-black leading-none tracking-tight">CREATIVE<br/>OS</div><p className="text-xs text-white/60 mt-3">Sistema operativo conversacional para proyectos creativos.</p></div>
    <nav className="flex md:flex-col gap-2 w-full">
      {items.map(([id, Icon, label]) => <button key={id} onClick={() => setView(id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${view===id?'bg-acid text-black shadow-glow':'glass hover:bg-white/10'}`}><Icon size={17}/>{label}</button>)}
    </nav>
    <div className="hidden md:block mt-auto text-xs text-white/50 border-t border-white/10 pt-5"><b className="text-white">Sprint 1</b><br/>Chat + Proyecto + Bitácora + Documentos + IPP</div>
  </aside>
}

function Chat({ project, setProject, log, setLog }: any) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: '¿Qué quieres construir hoy? Cuéntame tu idea como si estuvieras hablando con un productor ejecutivo.' },
    { role: 'user', text: 'Quiero abrir Charlie Gelato, una heladería artesanal que también sea un espacio cultural en Bogotá.' },
    { role: 'ai', text: 'Me encanta. Voy a ayudarte a convertir esa conversación en proyecto. Para empezar: ¿cuál es el propósito principal y a qué comunidad quieres llegar?' }
  ]);
  function send(){
    if(!input.trim()) return;
    const text = input.trim();
    setMessages([...messages,{role:'user',text},{role:'ai',text:'Perfecto. Lo estoy incorporando a la Bitácora Viva y lo traduzco en próximos pasos, objetivos y oportunidades del proyecto.'}]);
    setLog([{title:'Nueva conversación incorporada',time:'Ahora',text,tag:'Conversación'},...log]);
    setProject({...project, nextSteps: ['Revisar lo conversado y convertirlo en objetivo específico', ...project.nextSteps]});
    setInput('');
  }
  return <main className="flex-1 p-5 md:p-10 noise">
    <section className="max-w-5xl mx-auto"><div className="flex justify-between items-start gap-4"><div><p className="text-acid font-black uppercase text-xs tracking-[.25em]">Productor Ejecutivo IA</p><h1 className="text-4xl md:text-6xl font-black mt-2">¿Qué quieres construir hoy?</h1><p className="text-white/70 mt-4 max-w-2xl">Habla. Creative OS organiza tu pensamiento en objetivos, contexto, bitácora, documentos y próximos pasos.</p></div><button className="glass px-4 py-3 rounded-xl text-sm font-bold hidden sm:block">Ver tutorial</button></div>
    <div className="mt-10 space-y-4">{messages.map((m,i)=><div key={i} className={`max-w-2xl p-5 rounded-2xl ${m.role==='user'?'ml-auto bg-white/10':'bg-white text-black'}`}><p className="text-sm leading-relaxed">{m.text}</p></div>)}</div>
    <div className="mt-8 glass rounded-2xl p-3 flex gap-3"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} placeholder="Escribe tu respuesta aquí..." className="flex-1 bg-transparent outline-none px-3 text-white placeholder:text-white/40"/><button onClick={send} className="bg-acid text-black p-3 rounded-xl"><Send size={18}/></button></div>
    <div className="mt-5 flex flex-wrap gap-3 text-xs">{['¿Cuál es el contexto?','¿A quién le hablas?','¿Qué problema resuelves?','¿Qué entregable final imaginas?'].map(q=><button key={q} onClick={()=>setInput(q)} className="glass rounded-xl px-4 py-3 hover:bg-white/10">{q}</button>)}</div>
    </section></main>
}

function ProjectView({ project }: { project: Project }){
  const cards = [
    ['Objetivo General', project.generalObjective, Target], ['Objetivos Específicos', project.specificObjectives.join('\n'), CheckCircle2], ['Contexto', project.context, ClipboardList], ['Comunidad', project.community, Users], ['Actividades', project.activities.join('\n'), CalendarDays], ['Recursos', project.resources.join('\n'), WalletCards], ['Alianzas', project.alliances.join('\n'), Handshake], ['Presupuesto', project.budget, WalletCards]
  ] as const;
  return <main className="flex-1 p-5 md:p-10 noise"><div className="max-w-6xl mx-auto"><div className="flex justify-between gap-4 items-start"><div><p className="text-white/50 text-sm">Mi proyecto</p><h1 className="text-5xl font-black">{project.name}</h1></div><button className="bg-acid text-black px-5 py-3 rounded-xl font-black flex gap-2 items-center"><Download size={16}/> Exportar PDF</button></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-10">{cards.map(([title,body,Icon])=><article key={title} className="glass p-6 rounded-2xl min-h-48"><Icon className="text-acid"/><h3 className="font-black uppercase text-sm mt-4">{title}</h3><p className="text-white/70 mt-3 text-sm whitespace-pre-line leading-relaxed">{body}</p><button className="text-acid text-sm mt-4 font-bold">Ver más →</button></article>)}</div></div></main>
}

function LogView({ log }: any){ return <main className="flex-1 p-5 md:p-10 noise"><div className="max-w-4xl mx-auto"><div className="flex justify-between"><div><p className="text-acid font-black uppercase text-xs tracking-[.25em]">Memoria viva</p><h1 className="text-5xl font-black">Bitácora Viva</h1></div><button className="bg-acid text-black px-4 py-3 rounded-xl font-black flex items-center gap-2"><Plus size={16}/> Nueva entrada</button></div><div className="mt-10 border-l-2 border-acid/60 pl-6 space-y-5">{log.map((item:any,i:number)=><article key={i} className="glass p-5 rounded-2xl relative"><span className="absolute -left-[34px] top-6 w-4 h-4 rounded-full bg-acid"></span><div className="flex justify-between gap-4"><h3 className="font-black">{item.title}</h3><span className="text-xs text-white/40">{item.time}</span></div><p className="text-white/70 text-sm mt-2">{item.text}</p><span className="inline-block mt-3 text-[10px] uppercase tracking-widest bg-acid/20 text-acid px-3 py-1 rounded-full">{item.tag}</span></article>)}</div></div></main> }

function Documents(){ const docs=['One Pager','Propuesta','Presupuesto','Cronograma','Presentación','Carta de intención']; return <main className="flex-1 p-5 md:p-10 noise"><div className="max-w-5xl mx-auto"><p className="text-acid font-black uppercase text-xs tracking-[.25em]">Documentos automáticos</p><h1 className="text-5xl font-black">Generar documento</h1><p className="text-white/60 mt-4">Sprint 1 simula la generación. Sprint 2 conectará IA para crear documentos reales.</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">{docs.map((d,i)=><button key={d} className={`glass p-6 rounded-2xl text-left hover:border-acid ${i===0?'border-acid':''}`}><FileText className="text-acid"/><h3 className="font-black mt-5">{d}</h3><p className="text-sm text-white/60 mt-2">Documento listo para presentar, gestionar o postular.</p></button>)}</div><div className="glass rounded-2xl p-4 mt-8"><label className="text-sm text-white/50">Nombre del documento</label><input defaultValue="One Pager - Charlie Gelato" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 mt-2 outline-none"/><button className="w-full bg-acid text-black font-black rounded-xl py-4 mt-4">Generar documento →</button></div></div></main> }

function IPP(){ return <main className="flex-1 p-5 md:p-10 noise"><div className="max-w-5xl mx-auto"><p className="text-acid font-black uppercase text-xs tracking-[.25em]">Índice de Potencial del Proyecto</p><h1 className="text-5xl font-black">IPP</h1><div className="grid lg:grid-cols-2 gap-8 mt-10"><div className="glass rounded-3xl p-8 flex flex-col items-center justify-center"><div className="w-56 h-56 rounded-full border-[18px] border-white/10 border-t-acid flex items-center justify-center"><div className="text-center"><div className="text-7xl font-black">72</div><div className="text-white/50">/100</div></div></div><h2 className="text-acid font-black text-2xl mt-6">Potencial alto</h2><p className="text-white/60 text-center mt-2">Hay buen camino, pero falta fortalecer presupuesto, alianzas y cronograma.</p></div><div className="space-y-5"><section className="glass rounded-2xl p-6"><h3 className="font-black">Fortalezas</h3>{['Propósito claro','Comunidad definida','Contexto identificado','Propuesta de valor sólida'].map(x=><p key={x} className="flex gap-2 mt-3 text-sm"><CheckCircle2 className="text-acid" size={16}/>{x}</p>)}</section><section className="glass rounded-2xl p-6"><h3 className="font-black">Áreas a fortalecer</h3>{['Presupuesto detallado','Alianzas estratégicas','Cronograma de implementación'].map(x=><p key={x} className="flex gap-2 mt-3 text-sm"><AlertCircle className="text-yellow-400" size={16}/>{x}</p>)}</section></div></div></div></main> }

export default function Page(){
  const [view,setView]=useState<View>('chat');
  const [project,setProject]=useState<Project>(initialProject);
  const [log,setLog]=useState(initialLog);
  const content = useMemo(()=>({chat:<Chat project={project} setProject={setProject} log={log} setLog={setLog}/>,proyecto:<ProjectView project={project}/>,bitacora:<LogView log={log}/>,documentos:<Documents/>,ipp:<IPP/>}[view]),[view,project,log]);
  return <div className="min-h-screen flex flex-col md:flex-row"><Sidebar view={view} setView={setView}/>{content}</div>
}
