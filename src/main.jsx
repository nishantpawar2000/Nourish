import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { firebaseAuth, firestoreDb, googleProvider } from './firebase';
import './styles.css';
import './journal.css';

const FOOD_LIBRARY = {
  avocado: { calories: 318, carbs: 34, protein: 10, fat: 17, title: 'Avocado toast' },
  oatmeal: { calories: 290, carbs: 49, protein: 10, fat: 7, title: 'Oatmeal bowl' },
  chicken: { calories: 420, carbs: 38, protein: 42, fat: 13, title: 'Chicken & rice bowl' },
  salmon: { calories: 510, carbs: 38, protein: 39, fat: 24, title: 'Salmon grain bowl' },
  pizza: { calories: 570, carbs: 62, protein: 23, fat: 25, title: 'Pizza' },
};
const iconPaths = {
  home: <><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-6h6v6"/></>,
  chart: <><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5Z"/><path d="M4 5.5v17"/><path d="M8 7h8M8 11h7"/></>,
  gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.1 2.1-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20H12v-2.97A1.65 1.65 0 0 0 11 15.5a1.65 1.65 0 0 0-1.82.33l-.06.06-2.1-2.1.06-.06A1.65 1.65 0 0 0 7.4 12.1 1.65 1.65 0 0 0 5.9 11H3v-3h2.9A1.65 1.65 0 0 0 7.4 7a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.1-2.1.06.06a1.65 1.65 0 0 0 1.82.33H11V.5h3v2.85A1.65 1.65 0 0 0 15 4.9a1.65 1.65 0 0 0 1.82-.33l.06-.06 2.1 2.1-.06.06A1.65 1.65 0 0 0 18.6 8c.27.6.84 1 1.5 1H23v3h-2.9c-.66 0-1.23.4-1.5 1z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>, minus: <path d="M5 12h14"/>,
  camera: <><path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.3"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
  send: <path d="m21 3-6.8 18-3.8-7.2L3 10.2Z"/>,
  flame: <path d="M12 22c4.2 0 7-2.7 7-6.7 0-3.2-2.2-5.6-4.2-8.1.1 2.9-1.4 4.1-2.8 4.8C12.2 8.5 10 5.7 7.2 4 7.5 7.6 5 9.2 5 13.3 5 17.3 7.8 22 12 22Z"/>,
  drop: <path d="M12 2S5.5 9.1 5.5 14A6.5 6.5 0 0 0 18.5 14C18.5 9.1 12 2 12 2Z"/>,
  chevron: <path d="m9 18 6-6-6-6"/>, back: <path d="m15 18-6-6 6-6"/>, close: <path d="m6 6 12 12M18 6 6 18"/>,
  magic: <><path d="m12 3-1.8 5.2L5 10l5.2 1.8L12 17l1.8-5.2L19 10l-5.2-1.8Z"/><path d="m19 16-.6 1.7-1.7.6 1.7.6.6 1.7.6-1.7 1.7-.6-1.7-.6Z"/></>,
  scale: <><path d="M5 21h14a2 2 0 0 0 2-2V7a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v12a2 2 0 0 0 2 2Z"/><path d="M8 10a4 4 0 0 1 8 0"/><path d="m12 10 2-2"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z"/>,
  pencil: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  check: <path d="m5 12 4 4L19 6"/>, calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
};
function Icon({ name, size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>; }
const getStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const todayKey = () => new Date().toISOString().slice(0, 10);
const shortDate = d => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d);
const expirationDate = () => Timestamp.fromDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
const userCacheKey = uid => `nourish-v3-user-${uid}`;
const settingsCacheKey = uid => `nourish-v3-settings-${uid}`;
const challengeDates = Array.from({ length: 21 }, (_, offset) => {
  const date = new Date(); date.setDate(date.getDate() - (20 - offset)); return date;
});
function buildGoals(profile) {
  const weight = Number(profile.weight) || 60;
  const height = Number(profile.height) || 165;
  const age = Number(profile.age) || 30;
  const bmr = 10 * weight + 6.25 * height - 5 * age + (profile.sex === 'male' ? 5 : -161);
  const multipliers = { low: 1.25, moderate: 1.45, active: 1.65 };
  const direction = profile.goal === 'gain' ? 1 : profile.goal === 'lose' ? -1 : 0;
  const weeklyChange = direction * Number(profile.pace || 0.25);
  const calories = Math.round((bmr * (multipliers[profile.activity] || 1.45)) + weeklyChange * 7700 / 7);
  const protein = Math.round(weight * 1.8);
  const fat = Math.round(weight * .8);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { ...profile, calories, protein, fat, carbs, weeklyChange };
}

function App() {
  const [screen, setScreen] = useState('home');
  const [entries, setEntries] = useState(() => getStore('nourish-v2-entries', []));
  const [water, setWater] = useState(() => getStore('nourish-v2-water', 0));
  const [weights, setWeights] = useState(() => getStore('nourish-v2-weights', []));
  const [settings, setSettings] = useState({});
  const [user, setUser] = useState(() => getStore('nourish-v2-user', null));
  const [dailyNote, setDailyNote] = useState(() => getStore('nourish-v2-note', ''));
  const [period, setPeriod] = useState(() => getStore('nourish-v2-period', { lastPeriod: '', cycle: 28 }));
  const [goals, setGoals] = useState(() => getStore('nourish-v2-goals', null));
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [authReady, setAuthReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const totals = useMemo(() => entries.reduce((sum, item) => ({ calories: sum.calories + item.data.calories, carbs: sum.carbs + item.data.carbs, protein: sum.protein + item.data.protein, fat: sum.fat + item.data.fat }), { calories: 0, carbs: 0, protein: 0, fat: 0 }), [entries]);
  useEffect(() => localStorage.setItem('nourish-v2-entries', JSON.stringify(entries)), [entries]);
  useEffect(() => localStorage.setItem('nourish-v2-water', JSON.stringify(water)), [water]);
  useEffect(() => localStorage.setItem('nourish-v2-weights', JSON.stringify(weights)), [weights]);
  useEffect(() => { if (firebaseUser) localStorage.setItem(settingsCacheKey(firebaseUser.uid), JSON.stringify(settings)); }, [firebaseUser, settings]);
  useEffect(() => localStorage.setItem('nourish-v2-user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('nourish-v2-note', JSON.stringify(dailyNote)), [dailyNote]);
  useEffect(() => localStorage.setItem('nourish-v2-period', JSON.stringify(period)), [period]);
  useEffect(() => localStorage.setItem('nourish-v2-goals', JSON.stringify(goals)), [goals]);
  useEffect(() => {
    let cancelled = false;
    return onAuthStateChanged(firebaseAuth, async authUser => {
      if (cancelled) return;
      setFirebaseUser(authUser); setCloudReady(false);
      if (!authUser) { setUser(null); setAuthReady(true); return; }
      // Hide any previous device cache while loading this account's private record.
      setEntries([]); setWater(0); setWeights([]); setDailyNote(''); setPeriod({ lastPeriod: '', cycle: 28 }); setGoals(null);
      setUser({ name: authUser.displayName || 'Nourish user', email: authUser.email || '', picture: authUser.photoURL || '' });
      setSettings(getStore(settingsCacheKey(authUser.uid), getStore('nourish-settings', {})));
      const cached = getStore(userCacheKey(authUser.uid), null);
      let saved = cached;
      try {
        const snapshot = await getDoc(doc(firestoreDb, 'users', authUser.uid, 'wellness', 'current'));
        if (snapshot.exists()) { const remote = snapshot.data(); saved = { ...cached, ...remote, goals: remote.goals || cached?.goals || null }; }
        if (!cancelled && saved) {
          if (Array.isArray(saved.entries)) setEntries(saved.entries);
          if (typeof saved.water === 'number') setWater(saved.water);
          if (Array.isArray(saved.weights)) setWeights(saved.weights);
          if (typeof saved.dailyNote === 'string') setDailyNote(saved.dailyNote);
          if (saved.period) setPeriod(saved.period);
          if (saved.goals) setGoals(saved.goals);
        }
      } catch { /* Production rules may not be published yet; local mode remains available. */ }
      finally { if (!cancelled) { setCloudReady(true); setAuthReady(true); } }
    });
  }, []);
  useEffect(() => {
    if (!firebaseUser || !cloudReady) return;
    const wellnessState = { entries, water, weights, dailyNote, period, goals };
    // Keep an account-specific device cache immediately, including when a user logs out quickly.
    localStorage.setItem(userCacheKey(firebaseUser.uid), JSON.stringify(wellnessState));
    const timeout = setTimeout(() => {
      setDoc(doc(firestoreDb, 'users', firebaseUser.uid, 'wellness', 'current'), {
        // Meal images are intentionally excluded: Firestore documents have a 1 MiB limit.
        // A later Firebase Storage integration can persist photos and save only their URL here.
        entries: entries.map(({ photo, ...entry }) => ({ ...entry, photo: null })), water, weights, dailyNote, period, goals,
        updatedAt: Timestamp.now(), expireAt: expirationDate(),
      }).catch(() => { /* Keep the local browser copy available if network access is unavailable. */ });
    }, 700);
    return () => clearTimeout(timeout);
  }, [firebaseUser, cloudReady, entries, water, weights, dailyNote, period, goals]);
  function addEntry(item) { setEntries(previous => [...previous, item]); }
  function updateEntry(id, item) { setEntries(previous => previous.map(entry => entry.id === id ? { ...entry, ...item } : entry)); }
  function deleteEntry(id) { setEntries(previous => previous.filter(entry => entry.id !== id)); }
  async function handleLogout() { setProfileOpen(false); setSettingsOpen(false); await signOut(firebaseAuth); }
  if (!authReady || (firebaseUser && !cloudReady)) return <div className="app-shell"><main className="phone auth-loading"><div className="brand-mark">n</div><strong>Preparing your private journal…</strong><span>Keeping your wellness data separate and secure.</span></main></div>;
  if (!firebaseUser) return <><div className="app-shell"><main className="phone"/></div><Login required setUser={setUser} onSignedIn={() => { setLoginOpen(false); setSettingsOpen(true); }}/></>;
  return <div className="app-shell"><main className="phone">
    <header className="topbar"><div className="brand-mark">n</div><div className="top-greeting"><span>{user ? `Hello, ${user.name.split(' ')[0]}` : 'Your daily wellness'}</span><strong>{user ? 'Welcome back' : 'Nourish your day'}</strong></div><button className="top-action" aria-label="Open settings" onClick={() => setSettingsOpen(true)}><Icon name="gear" size={18}/></button><button className="avatar-button has-photo" aria-label="Open profile menu" onClick={() => setProfileOpen(true)}>{user?.picture ? <img src={user.picture} alt="Google profile"/> : <Icon name="user" size={19}/>}</button></header>
    {profileOpen && <ProfileMenu user={user} onClose={() => setProfileOpen(false)} onLogout={handleLogout}/>} 
    {screen === 'home' && <Home totals={totals} goals={goals} water={water} setWater={setWater} entries={entries} weights={weights} setWeights={setWeights} setHealthOpen={setHealthOpen} onLogFood={() => setScreen('journal')}/>} 
    {screen === 'weight' && <WeightTracker weights={weights} setWeights={setWeights} goals={goals}/>} 
    {screen === 'journal' && <FoodJournal entries={entries} addEntry={addEntry} updateEntry={updateEntry} deleteEntry={deleteEntry} settings={settings}/>}
    {screen === 'dashboard' && <Dashboard totals={totals} goals={goals} entries={entries} weights={weights}/>} 
    <nav className="bottom-nav"><NavButton active={screen === 'home' || screen === 'journal'} name="book" label="Macros" onClick={() => setScreen('home')}/><NavButton active={screen === 'weight'} name="scale" label="Weight" onClick={() => setScreen('weight')}/><NavButton active={screen === 'dashboard'} name="chart" label="Dashboard" onClick={() => setScreen('dashboard')}/><small>Made by Nishant Pawar</small></nav>
  </main>
  {settingsOpen && <Settings settings={settings} setSettings={setSettings} user={user} onClose={() => setSettingsOpen(false)} onLogin={() => { setSettingsOpen(false); setLoginOpen(true); }}/>} 
  {healthOpen && <HealthJournal dailyNote={dailyNote} setDailyNote={setDailyNote} period={period} setPeriod={setPeriod} onClose={() => setHealthOpen(false)}/>} 
  {loginOpen && <Login settings={settings} setUser={setUser} onClose={() => setLoginOpen(false)} onSignedIn={() => { setLoginOpen(false); setSettingsOpen(true); }}/>} 
  {!goals && <GoalSetup onSave={profile => setGoals(buildGoals(profile))}/>} 
  </div>;
}
function NavButton({ active, name, label, onClick }) { return <button className={active ? 'active' : ''} onClick={onClick}><Icon name={name}/><span>{label}</span></button>; }
function ProfileMenu({ user, onClose, onLogout }) { return <aside className="profile-menu"><button className="profile-menu-close" aria-label="Close profile menu" onClick={onClose}><Icon name="close" size={16}/></button><div className="profile-menu-user">{user?.picture ? <img src={user.picture} alt="Google profile"/> : <div>{user?.name?.[0] || 'N'}</div>}<section><strong>{user?.name || 'Nourish user'}</strong><span>{user?.email || ''}</span></section></div><button className="logout-button" onClick={onLogout}>Log out</button></aside>; }
function Home({ totals, goals, water, setWater, entries, weights, setWeights, setHealthOpen, onLogFood }) {
  const [weightInput, setWeightInput] = useState(''); const latestWeight = weights.at(-1); const target = goals?.calories || 2000;
  function addWeight() { const kg = Number(weightInput); if (kg > 0) { setWeights([...weights, { kg, date: todayKey() }]); setWeightInput(''); } }
  return <section className="home-screen"><div className="home-date"><span>{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</span><button onClick={() => setHealthOpen(true)}><Icon name="heart" size={16}/> Private health</button></div>
    <section className="empty-energy"><div className="section-kicker"><Icon name="flame" size={16}/> TODAY’S ENERGY (CALORIES)</div><div className="empty-energy-row"><div><strong>{totals.calories || '—'}</strong><span>{totals.calories ? ' kcal logged' : 'Start by logging a meal'}</span></div><div className="energy-ring"><b>{totals.calories ? `${Math.round(totals.calories / target * 100)}%` : '0%'}</b></div></div><div className="progress-track"><i style={{ width: `${Math.min(100, totals.calories / target * 100)}%` }}/></div><small>{totals.calories ? `${Math.max(0, target - totals.calories)} kcal remaining` : `Your ${target.toLocaleString()} kcal goal is ready when you are.`}</small></section>
    <section className="goal-summary"><div><span>DAILY NUTRITION GOAL</span><strong>{target.toLocaleString()} kcal</strong></div><p>{goals?.goal === 'gain' ? 'Weight gain' : goals?.goal === 'lose' ? 'Weight loss' : 'Maintain weight'} · {Math.abs(goals?.weeklyChange || 0).toFixed(2)} kg/week</p></section>
    <section className="water-card home-card"><div className="water-icon"><Icon name="drop" size={20}/></div><div><strong>Water</strong><p>{water ? `${water * 250} ml of 2,000 ml` : 'No water logged yet'}</p></div><div className="water-controls"><button disabled={!water} onClick={() => setWater(Math.max(0, water - 1))}><Icon name="minus" size={16}/></button><span>{water}<small>/8</small></span><button onClick={() => setWater(Math.min(8, water + 1))}><Icon name="plus" size={16}/></button></div></section>
    <section className="weight-card"><div className="weight-copy"><span className="section-kicker"><Icon name="scale" size={16}/> WEIGHT TRACKER</span><h2>{latestWeight ? `${latestWeight.kg} kg` : 'No weigh-in yet'}</h2><p>{latestWeight ? `Last updated ${shortDate(new Date(`${latestWeight.date}T00:00:00`))}` : 'Add a weight to see your trend.'}</p></div><div className="weight-input"><input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="kg"/><button onClick={addWeight}><Icon name="plus" size={17}/></button></div></section>
    <section className="macro-quick"><div className="section-heading"><h2>Macros today</h2><span>{entries.length ? 'from logged meals' : 'waiting for meals'}</span></div><Macro label="Carbs" value={totals.carbs} target={goals?.carbs || 220} colour="#e7b556"/><Macro label="Protein" value={totals.protein} target={goals?.protein || 120} colour="#de8166"/><Macro label="Fat" value={totals.fat} target={goals?.fat || 67} colour="#8ba38a"/></section><button className="log-food-cta" onClick={onLogFood}><Icon name="magic" size={17}/> Log food with AI</button>
  </section>;
}
function Macro({ label, value, target, colour }) { return <div className="macro"><div><span>{label}</span><b>{value || '—'}<small>{value ? ` / ${target}g` : ''}</small></b></div><div className="macro-track"><i style={{ width: `${Math.min(100, value / target * 100)}%`, background: colour }}/></div></div>; }
function WeightTracker({ weights, setWeights, goals }) {
  const [weightInput, setWeightInput] = useState(''); const recent = weights.slice(-7); const latest = weights.at(-1);
  function addWeight() { const kg = Number(weightInput); if (kg > 0) { setWeights(previous => [...previous, { kg, date: todayKey() }]); setWeightInput(''); } }
  const max = Math.max(...recent.map(item => item.kg), 1);
  return <section className="weight-screen"><div className="journal-title"><span>WEIGHT</span><h1>Your weight trend</h1><p>Keep a simple record of your check-ins and your expected weekly change.</p></div><section className="weight-checkin"><div><span>Today’s weigh-in</span><strong>{latest ? `${latest.kg} kg` : 'No weigh-in yet'}</strong></div><div className="weight-input"><input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="kg"/><button onClick={addWeight}><Icon name="plus" size={17}/></button></div></section><section className="weight-goal-card"><span>WEEKLY EXPECTED {goals?.goal === 'gain' ? 'GAIN' : goals?.goal === 'lose' ? 'LOSS' : 'CHANGE'}</span><strong>{goals?.weeklyChange ? `${Math.abs(goals.weeklyChange).toFixed(2)} kg` : '0.00 kg'}</strong><p>{goals?.goal === 'gain' ? 'A gradual increase supported by your daily nutrition target.' : goals?.goal === 'lose' ? 'A gradual decrease supported by your daily nutrition target.' : 'Your daily nutrition target supports maintenance.'}</p></section><div className="section-heading"><h2>Recent check-ins</h2><span>Last 7 entries</span></div>{recent.length ? <section className="chart-card"><div className="bar-chart">{recent.map((item, index) => <div key={`${item.date}-${index}`}><i style={{ height: `${Math.max(9, item.kg / max * 100)}%` }}/><span>{new Date(`${item.date}T00:00:00`).getDate()}</span></div>)}</div></section> : <section className="chart-card chart-empty">Your weigh-ins will appear here.</section>}</section>;
}
function FoodJournal({ entries, addEntry, updateEntry, deleteEntry, settings }) {
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [photo, setPhoto] = useState(null); const [menuId, setMenuId] = useState(null); const [editingId, setEditingId] = useState(null); const cameraRef = useRef(null); const galleryRef = useRef(null);
  async function googleEstimate() {
    if (!settings.apiKey) throw new Error('Add your Gemini API key in Settings before logging a meal.');
    const parts = [{ text: `You are Nourish's nutrition logger. Extract a realistic nutrition estimate from the user's meal message and/or image. Reply ONLY with valid JSON in this exact shape: {"title":"", "calories":0, "carbs":0, "protein":0, "fat":0}. Use grams for carbs, protein, and fat. User meal message: ${text || 'No text provided; identify the meal from the image.'}` }];
    if (photo) parts.push({ inline_data: { mime_type: photo.type, data: photo.data.split(',')[1] } });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-3-flash-preview'}:generateContent?key=${settings.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }) });
    if (!response.ok) { const message = (await response.json().catch(() => null))?.error?.message; throw new Error(message || 'Gemini could not analyse this meal.'); }
    const raw = (await response.json()).candidates?.[0]?.content?.parts?.[0]?.text || '{}'; const data = JSON.parse(raw.replace(/```json|```/g, ''));
    return { title: data.title || text || 'Photo meal', calories: Number(data.calories) || 0, carbs: Number(data.carbs) || 0, protein: Number(data.protein) || 0, fat: Number(data.fat) || 0 };
  }
  async function submit() {
    if ((!text && !photo) || busy) return;
    if (!settings.apiKey) { alert('Add your Gemini API key in Settings to extract macros.'); return; }
    setBusy(true);
    try {
      const data = await googleEstimate(); const item = { text: text || 'Photo meal', photo: photo?.data, photoType: photo?.type, data };
      if (editingId) updateEntry(editingId, item); else addEntry({ id: crypto.randomUUID(), time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), ...item });
      setText(''); setPhoto(null); setEditingId(null);
    } catch (error) { alert(error.message || 'Could not reach Google AI. Check the API key and selected model in Settings.'); } finally { setBusy(false); }
  }
  function onPhoto(e) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setPhoto({ data: reader.result, type: file.type }); reader.readAsDataURL(file); e.target.value = ''; }
  function editEntry(entry) { setMenuId(null); setEditingId(entry.id); setText(entry.text || ''); if (entry.photo) setPhoto({ data: entry.photo, type: entry.photoType || entry.photo.match(/^data:([^;]+)/)?.[1] || 'image/jpeg' }); else setPhoto(null); }
  function cancelEdit() { setEditingId(null); setText(''); setPhoto(null); }
  return <section className="journal-screen"><div className="journal-title"><span>FOOD JOURNAL</span><h1>Log your day</h1><p>Send a meal message or photo to Gemini for a macro estimate.</p></div>{entries.length === 0 ? <div className="blank-journal"><span><Icon name="magic" size={22}/></span><h2>Your journal is clear</h2><p>Your meal message or image will stay here with Gemini’s macro estimate.</p></div> : <div className="entry-list">{entries.map((entry, index) => <article className="entry" key={entry.id}><div className="entry-top"><div className={`entry-dot dot-${index % 3}`}>{entry.photo ? <img src={entry.photo} alt="Meal"/> : <Icon name="flame" size={17}/>}</div><div className="entry-main"><div><h3>{entry.data.title}</h3><p>{entry.time}</p></div><div className="entry-energy"><b>{entry.data.calories}</b><span>Calories</span></div></div><div className="entry-menu"><button className="entry-more" aria-label="Entry options" onClick={() => setMenuId(menuId === entry.id ? null : entry.id)}><Icon name="more" size={20}/></button>{menuId === entry.id && <div className="entry-menu-popover"><button onClick={() => editEntry(entry)}><Icon name="pencil" size={15}/> Edit message</button><button className="delete-entry" onClick={() => { setMenuId(null); deleteEntry(entry.id); }}><Icon name="close" size={15}/> Delete entry</button></div>}</div></div>{entry.photo && <img className="entry-photo" src={entry.photo} alt={`Meal: ${entry.data.title}`}/>}<p className="entry-message">{entry.text || 'Photo meal'}</p><div className="entry-ai-result"><span><Icon name="magic" size={13}/> Gemini extracted</span><div className="entry-macros"><span>Calories <b>{entry.data.calories} kcal</b></span><span>Carbs <b>{entry.data.carbs}g</b></span><span>Protein <b>{entry.data.protein}g</b></span><span>Fat <b>{entry.data.fat}g</b></span></div></div></article>)}</div>}<div className="composer-wrap">{photo && <div className="photo-preview"><img src={photo.data} alt="Selected meal"/><button onClick={() => setPhoto(null)}><Icon name="close" size={14}/></button></div>}{editingId && <div className="edit-banner"><span>Editing meal — Gemini will recalculate macros.</span><button onClick={cancelEdit}>Cancel</button></div>}<div className="composer"><button className="photo-button" aria-label="Take a photo" onClick={() => cameraRef.current?.click()}><Icon name="camera" size={20}/></button><button className="photo-button" aria-label="Choose from gallery" onClick={() => galleryRef.current?.click()}><Icon name="image" size={19}/></button><input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="What did you eat?"/><button className="send-button" disabled={(!text && !photo) || busy} onClick={submit}>{busy ? '…' : <Icon name="send" size={18}/>}</button><input hidden ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPhoto}/><input hidden ref={galleryRef} type="file" accept="image/*" onChange={onPhoto}/></div></div></section>;
}
function Dashboard({ totals, goals, entries, weights }) {
  const [range, setRange] = useState('7 days');
  const recentWeights = weights.slice(-(Number(range.split(' ')[0])));
  const weightMax = Math.max(...recentWeights.map(x => x.kg), 1);
  const macros = [
    { label: 'Protein', value: totals.protein, target: goals?.protein || 120, colour: '#de8166' },
    { label: 'Carbs', value: totals.carbs, target: goals?.carbs || 220, colour: '#e7b556' },
    { label: 'Fat', value: totals.fat, target: goals?.fat || 67, colour: '#8ba38a' },
  ];
  const isComplete = totals.protein >= (goals?.protein || 120) && totals.carbs >= (goals?.carbs || 220) && totals.fat >= (goals?.fat || 67);
  return <section className="dashboard"><div className="dashboard-head"><span>YOUR DASHBOARD</span><h1>Progress, day by day.</h1></div>
    <section className="dashboard-section"><div className="section-heading"><h2>Weight</h2><select value={range} onChange={e => setRange(e.target.value)}><option>7 days</option><option>14 days</option><option>30 days</option></select></div><section className="chart-card"><div className="chart-header"><div><strong>{weights.at(-1)?.kg ? `${weights.at(-1).kg} kg` : 'No weight data'}</strong><span>{goals?.goal === 'gain' ? 'Weight-gain target' : goals?.goal === 'lose' ? 'Weight-loss target' : 'Weight-maintenance target'}</span></div><Icon name="scale" size={22}/></div>{recentWeights.length ? <div className="bar-chart">{recentWeights.map((point, index) => <div key={`${point.date}-${index}`}><i style={{ height: `${Math.max(9, point.kg / weightMax * 100)}%` }}/><span>{new Date(`${point.date}T00:00:00`).getDate()}</span></div>)}</div> : <div className="chart-empty">Add a weigh-in on Home to start your day-by-day trend.</div>}</section></section>
    <section className="dashboard-section macro-dashboard"><div className="section-heading"><h2>Macros</h2><span>Daily target</span></div><section className="macro-goal-card"><div className="macro-calories"><span>Calories</span><strong>{totals.calories || '—'}</strong><small>/ {goals?.calories?.toLocaleString() || '2,000'} kcal</small></div>{macros.map(macro => <Macro key={macro.label} label={macro.label} value={macro.value} target={macro.target} colour={macro.colour}/>)}</section></section>
    <section className="goal-forecast"><span>WEEKLY EXPECTED {goals?.goal === 'gain' ? 'GAIN' : goals?.goal === 'lose' ? 'LOSS' : 'CHANGE'}</span><strong>{goals?.weeklyChange ? `${Math.abs(goals.weeklyChange).toFixed(2)} kg` : '0.00 kg'}</strong><p>{goals?.goal === 'gain' ? 'Your nutrition goal supports a gradual weight gain.' : goals?.goal === 'lose' ? 'Your nutrition goal supports a gradual weight loss.' : 'Your nutrition goal is set for maintenance.'}</p></section>
    <section className="week-status"><div className="section-heading"><h2>Challenge</h2><span>Streak</span></div><div className="status-dots">{challengeDates.map((date, index) => <div key={date.toISOString()}><i className={index === challengeDates.length - 1 && isComplete ? 'complete' : 'not-complete'}>{date.getDate()}</i><small>{date.toLocaleDateString('en', { month: 'short' }).slice(0, 1)}</small></div>)}</div></section>
  </section>;
}
function Settings({ settings, setSettings, user, onClose, onLogin }) { const [draft, setDraft] = useState(settings); function save() { setSettings(draft); onClose(); } return <div className="modal-layer"><section className="settings-panel"><header><button onClick={onClose}><Icon name="back"/></button><h2>Settings</h2><span/></header><div className="settings-body"><section className="profile-card"><div className="profile-initial">{user?.picture ? <img src={user.picture} alt=""/> : user?.name?.[0] || 'N'}</div><div><strong>{user?.name || 'Nourish account'}</strong><p>{user?.email || 'Sign in to personalise your journal.'}</p></div><button className="tiny-link" onClick={onLogin}>{user ? 'Switch' : 'Sign in'}</button></section><h3>Daily goal</h3><label className="field"><span>Calorie goal</span><div><input type="number" value={draft.calorieGoal || 2000} onChange={e => setDraft({ ...draft, calorieGoal: e.target.value })}/><b>kcal</b></div></label><h3 className="ai-heading"><Icon name="magic" size={16}/> Google AI</h3><p className="help-text">Analyse meal descriptions and photos using your own Google AI model.</p>{!draft.apiKey && <section className="api-guide"><div><span>STEP 2 OF 2</span><strong>Connect Gemini AI</strong></div><ol><li>Open Google AI Studio using the button below.</li><li>Sign in, then choose <b>Create API key</b>.</li><li>Choose or create a Google project and copy the key.</li><li>Return here, paste it below, choose a model, then save.</li></ol><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Get a Gemini API key <Icon name="chevron" size={14}/></a><p>Your key stays in this browser. Never share it with anyone.</p></section>}<label className="field"><span>Google AI API key</span><input type="password" value={draft.apiKey || ''} onChange={e => setDraft({ ...draft, apiKey: e.target.value })} placeholder="Paste your API key here"/></label><label className="field"><span>Model</span><select value={draft.model || 'gemini-3-flash-preview'} onChange={e => setDraft({ ...draft, model: e.target.value })}><option value="gemini-3.5-flash">Gemini 3.5 Flash</option><option value="gemini-3-flash-preview">Gemini 3 Flash (Preview)</option><option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite</option><option value="gemini-2.5-flash">Gemini 2.5 Flash</option></select></label><h3>Google sign-in</h3><p className="security-note">Google sign-in is connected through Firebase Authentication. New users only need to press Continue with Google; no OAuth Client ID is required in this app.</p><button className="save-button" onClick={save}>Save settings</button></div></section></div>; }
function Login({ setUser, onClose, onSignedIn, required = false }) {
  const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  async function signIn() { if (busy) return; setBusy(true); setNotice(''); try { const result = await signInWithPopup(firebaseAuth, googleProvider); const firebaseUser = result.user; setUser({ name: firebaseUser.displayName || 'Nourish user', email: firebaseUser.email || '', picture: firebaseUser.photoURL || '' }); onSignedIn(); } catch (error) { setNotice(error.code === 'auth/unauthorized-domain' ? 'This domain is not approved in Firebase Authentication. Add it under Authentication → Settings → Authorized domains.' : 'Google sign-in could not be completed. Please try again.'); } finally { setBusy(false); } }
  return <div className="modal-layer login-layer"><section className="login-panel">{!required && <button className="modal-close" onClick={onClose}><Icon name="close"/></button>}<div className="brand-mark big">n</div><span>PERSONALISE NOURISH</span><h2>Meet your<br/><em>wellness journal.</em></h2><p>Sign in with Google to create a private, device-remembered wellness journal.</p><button className="google-button" disabled={busy} onClick={signIn}><b>G</b> {busy ? 'Opening Google…' : 'Continue with Google'}</button>{notice && <p className="login-notice">{notice}</p>}</section></div>;
}
function HealthJournal({ dailyNote, setDailyNote, period, setPeriod, onClose }) { return <div className="modal-layer"><section className="settings-panel health-panel"><header><button onClick={onClose}><Icon name="back"/></button><h2>Private health</h2><span/></header><div className="settings-body"><div className="health-intro"><Icon name="heart" size={22}/><div><strong>Just for you</strong><p>These private notes are intentionally kept outside the main navigation.</p></div></div><h3>Daily journal</h3><p className="help-text">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p><textarea className="daily-note" value={dailyNote} onChange={e => setDailyNote(e.target.value)} placeholder="How do you feel today? Write anything you want to remember…"/><h3>Period tracker</h3><label className="field"><span>First day of your last period</span><input type="date" value={period.lastPeriod} onChange={e => setPeriod({ ...period, lastPeriod: e.target.value })}/></label><label className="field"><span>Typical cycle length</span><div><input type="number" value={period.cycle} onChange={e => setPeriod({ ...period, cycle: e.target.value })}/><b>days</b></div></label>{period.lastPeriod && <div className="period-card"><Icon name="calendar"/><div><span>Estimated next period</span><strong>{shortDate(new Date(new Date(`${period.lastPeriod}T00:00:00`).getTime() + Number(period.cycle || 28) * 86400000))}</strong></div></div>}<button className="save-button" onClick={onClose}>Save private journal</button></div></section></div>; }
function GoalSetup({ onSave }) {
  const [profile, setProfile] = useState({ weight: '', height: '', age: '', sex: 'female', activity: 'moderate', goal: 'lose', pace: '0.25' });
  const update = (key, value) => setProfile(previous => ({ ...previous, [key]: value }));
  const ready = Number(profile.weight) > 0 && Number(profile.height) > 0 && Number(profile.age) > 0;
  return <div className="modal-layer goal-layer"><section className="goal-setup"><span className="setup-kicker">YOUR PERSONALISED PLAN</span><h2>Set your daily<br/><em>nutrition goal.</em></h2><p>Answer these once and Nourish calculates your daily calories, macros, and weekly weight-change expectation locally on this device.</p><div className="goal-grid"><label className="field"><span>Current weight</span><div><input type="number" inputMode="decimal" value={profile.weight} onChange={e => update('weight', e.target.value)} placeholder="60"/><b>kg</b></div></label><label className="field"><span>Height</span><div><input type="number" inputMode="decimal" value={profile.height} onChange={e => update('height', e.target.value)} placeholder="165"/><b>cm</b></div></label><label className="field"><span>Age</span><input type="number" value={profile.age} onChange={e => update('age', e.target.value)} placeholder="28"/></label><label className="field"><span>Sex</span><select value={profile.sex} onChange={e => update('sex', e.target.value)}><option value="female">Female</option><option value="male">Male</option></select></label></div><label className="field"><span>Activity level</span><select value={profile.activity} onChange={e => update('activity', e.target.value)}><option value="low">Low — mostly sitting</option><option value="moderate">Moderate — regular movement</option><option value="active">Active — frequent training</option></select></label><label className="field"><span>Your goal</span><select value={profile.goal} onChange={e => update('goal', e.target.value)}><option value="lose">Lose weight</option><option value="maintain">Maintain weight</option><option value="gain">Gain weight</option></select></label>{profile.goal !== 'maintain' && <label className="field"><span>Expected weekly {profile.goal === 'gain' ? 'gain' : 'loss'}</span><select value={profile.pace} onChange={e => update('pace', e.target.value)}><option value="0.25">0.25 kg per week</option><option value="0.5">0.50 kg per week</option></select></label>}<button className="save-button" disabled={!ready} onClick={() => ready && onSave(profile)}>Calculate my daily goals</button><small>These are wellness estimates, not medical advice.</small></section></div>;
}
createRoot(document.getElementById('root')).render(<App/>);
