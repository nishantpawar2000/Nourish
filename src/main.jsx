import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { firebaseAuth, firestoreDb, googleProvider } from './firebase';
import './styles.css';

const iconPaths = {
  home: <><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-6h6v6"/></>,
  chart: <><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></>,
  gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.1 2.1-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20H12v-2.97A1.65 1.65 0 0 0 11 15.5a1.65 1.65 0 0 0-1.82.33l-.06.06-2.1-2.1.06-.06A1.65 1.65 0 0 0 7.4 12.1 1.65 1.65 0 0 0 5.9 11H3V8h2.9A1.65 1.65 0 0 0 7.4 7a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.1-2.1.06.06a1.65 1.65 0 0 0 1.82.33H11V.5h3v2.85A1.65 1.65 0 0 0 15 4.9a1.65 1.65 0 0 0 1.82-.33l.06-.06 2.1 2.1-.06.06A1.65 1.65 0 0 0 18.6 8c.27.6.84 1 1.5 1H23v3h-2.9c-.66 0-1.23.4-1.5 1z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  camera: <><path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.3"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
  send: <path d="m21 3-6.8 18-3.8-7.2L3 10.2Z"/>,
  flame: <path d="M12 22c4.2 0 7-2.7 7-6.7 0-3.2-2.2-5.6-4.2-8.1.1 2.9-1.4 4.1-2.8 4.8C12.2 8.5 10 5.7 7.2 4 7.5 7.6 5 9.2 5 13.3 5 17.3 7.8 22 12 22Z"/>,
  drop: <path d="M12 2S5.5 9.1 5.5 14A6.5 6.5 0 0 0 18.5 14C18.5 9.1 12 2 12 2Z"/>,
  back: <path d="m15 18-6-6 6-6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  magic: <><path d="m12 3-1.8 5.2L5 10l5.2 1.8L12 17l1.8-5.2L19 10l-5.2-1.8Z"/><path d="m19 16-.6 1.7-1.7.6 1.7.6.6 1.7.6-1.7 1.7-.6-1.7-.6Z"/></>,
  scale: <><path d="M5 21h14a2 2 0 0 0 2-2V7a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v12a2 2 0 0 0 2 2Z"/><path d="M8 10a4 4 0 0 1 8 0"/><path d="m12 10 2-2"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z"/>,
  pencil: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
  trash: <><path d="M3 6h18"/><path d="M8 6V4h8v2M19 6l-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/></>,
};

function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const getStore = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const putStore = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Photos can exceed browser storage; Firestore still keeps their nutrition data. */ }
};
const pad = value => String(value).padStart(2, '0');
const dateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateFromKey = key => new Date(`${key}T12:00:00`);
const todayKey = () => dateKey(new Date());
const shortDate = date => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
const fullDate = key => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(dateFromKey(key));
const expirationDate = () => Timestamp.fromDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
const userCacheKey = uid => `nourish-v3-user-${uid}`;
const settingsCacheKey = uid => `nourish-v3-settings-${uid}`;

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
  const fat = Math.round(weight * 0.8);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { ...profile, calories, protein, fat, carbs, weeklyChange };
}

function totalsFor(entries) {
  return entries.reduce((sum, item) => ({
    calories: sum.calories + Number(item.data?.calories || 0),
    carbs: sum.carbs + Number(item.data?.carbs || 0),
    protein: sum.protein + Number(item.data?.protein || 0),
    fat: sum.fat + Number(item.data?.fat || 0),
  }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
}

function recentOnly(items, key = 'date') {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffKey = dateKey(cutoff);
  return items.filter(item => !item[key] || item[key] >= cutoffKey);
}

function App() {
  const [screen, setScreen] = useState('home');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [entries, setEntries] = useState([]);
  const [water, setWater] = useState({});
  const [weights, setWeights] = useState([]);
  const [settings, setSettings] = useState({});
  const [user, setUser] = useState(null);
  const [dailyNotes, setDailyNotes] = useState({});
  const [period, setPeriod] = useState({ lastPeriod: '', cycle: 28 });
  const [goals, setGoals] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [authReady, setAuthReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const dayEntries = useMemo(() => entries.filter(entry => (entry.date || todayKey()) === selectedDate), [entries, selectedDate]);
  const totals = useMemo(() => totalsFor(dayEntries), [dayEntries]);
  const calorieTarget = Number(settings.calorieGoal) || goals?.calories || 2000;

  useEffect(() => onAuthStateChanged(firebaseAuth, async authUser => {
    setFirebaseUser(authUser);
    setCloudReady(false);
    if (!authUser) {
      setUser(null);
      setEntries([]);
      setWater({});
      setWeights([]);
      setDailyNotes({});
      setPeriod({ lastPeriod: '', cycle: 28 });
      setGoals(null);
      setSettings({});
      setAuthReady(true);
      return;
    }

    setUser({ name: authUser.displayName || 'Nourish user', email: authUser.email || '', picture: authUser.photoURL || '' });
    const cached = getStore(userCacheKey(authUser.uid), {});
    let saved = cached;
    let savedSettings = cached.settings || getStore(settingsCacheKey(authUser.uid), {});
    let savedGoals = cached.goals || null;

    try {
      const [wellnessSnapshot, preferencesSnapshot] = await Promise.all([
        getDoc(doc(firestoreDb, 'users', authUser.uid, 'wellness', 'current')),
        getDoc(doc(firestoreDb, 'users', authUser.uid, 'preferences', 'current')),
      ]);
      if (wellnessSnapshot.exists()) saved = { ...cached, ...wellnessSnapshot.data() };
      if (preferencesSnapshot.exists()) {
        const preferences = preferencesSnapshot.data();
        savedSettings = preferences.settings || savedSettings;
        savedGoals = preferences.goals || saved.goals || savedGoals;
      } else {
        savedSettings = saved.settings || savedSettings;
        savedGoals = saved.goals || savedGoals;
      }
    } catch { /* Account-specific local data remains available while offline. */ }

    const loadedEntries = recentOnly(Array.isArray(saved.entries) ? saved.entries : []).map(entry => ({ ...entry, date: entry.date || todayKey() }));
    const loadedWeights = recentOnly(Array.isArray(saved.weights) ? saved.weights : []);
    const loadedWater = typeof saved.water === 'number' ? { [todayKey()]: saved.water } : (saved.water || {});
    setEntries(loadedEntries);
    setWater(loadedWater);
    setWeights(loadedWeights);
    setDailyNotes(saved.dailyNotes || (typeof saved.dailyNote === 'string' && saved.dailyNote ? { [todayKey()]: saved.dailyNote } : {}));
    setPeriod(saved.period || { lastPeriod: '', cycle: 28 });
    setGoals(savedGoals);
    setSettings(savedSettings || {});
    setCloudReady(true);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    if (!firebaseUser || !cloudReady) return undefined;
    const accountState = { entries, water, weights, dailyNotes, period, goals, settings };
    putStore(userCacheKey(firebaseUser.uid), accountState);
    putStore(settingsCacheKey(firebaseUser.uid), settings);
    const saveTimer = setTimeout(() => {
      const cloudEntries = recentOnly(entries).map(({ photo, ...entry }) => ({ ...entry, photo: null }));
      const cloudWeights = recentOnly(weights);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const cutoffKey = dateKey(cutoff);
      const cloudWater = Object.fromEntries(Object.entries(water).filter(([key]) => key >= cutoffKey));
      Promise.all([
        setDoc(doc(firestoreDb, 'users', firebaseUser.uid, 'wellness', 'current'), {
          entries: cloudEntries,
          water: cloudWater,
          weights: cloudWeights,
          dailyNotes,
          period,
          updatedAt: Timestamp.now(),
          expireAt: expirationDate(),
        }),
        setDoc(doc(firestoreDb, 'users', firebaseUser.uid, 'preferences', 'current'), {
          settings,
          goals,
          updatedAt: Timestamp.now(),
        }),
      ]).catch(() => {});
    }, 700);
    return () => clearTimeout(saveTimer);
  }, [firebaseUser, cloudReady, entries, water, weights, dailyNotes, period, goals, settings]);

  useEffect(() => {
    if (firebaseUser && cloudReady && goals && !settings.apiKey) setSettingsOpen(true);
  }, [firebaseUser, cloudReady, goals, settings.apiKey]);

  function saveGoal(profile) {
    const calculated = buildGoals(profile);
    setGoals(calculated);
    setSettings(previous => ({ ...previous, calorieGoal: previous.calorieGoal || calculated.calories }));
  }
  function addEntry(item) { setEntries(previous => [...previous, item]); }
  function updateEntry(id, item) { setEntries(previous => previous.map(entry => entry.id === id ? { ...entry, ...item } : entry)); }
  function deleteEntry(id) { setEntries(previous => previous.filter(entry => entry.id !== id)); }
  async function handleLogout() {
    setProfileOpen(false);
    setSettingsOpen(false);
    await signOut(firebaseAuth);
  }

  if (!authReady || (firebaseUser && !cloudReady)) {
    return <div className="app-shell"><main className="phone auth-loading"><div className="brand-mark">n</div><strong>Preparing your private journal…</strong><span>Syncing your meals, goals, settings, and check-ins.</span></main></div>;
  }
  if (!firebaseUser) return <Login required/>;

  return <div className="app-shell">
    <main className="phone">
      <header className="topbar">
        <div className="top-title"><span>{screen === 'home' ? (selectedDate === todayKey() ? 'Today' : shortDate(dateFromKey(selectedDate))) : 'Weight Tracker'}</span><small>Hello, {user?.name?.split(' ')[0] || 'there'}</small></div>
        <div className="top-actions">
          <button className="icon-button" aria-label="Open private health" onClick={() => setHealthOpen(true)}><Icon name="heart" size={18}/></button>
          <button className="icon-button" aria-label="Open settings" onClick={() => setSettingsOpen(true)}><Icon name="gear" size={18}/></button>
          <button className="avatar-button" aria-label="Open profile menu" onClick={() => setProfileOpen(value => !value)}>{user?.picture ? <img src={user.picture} alt="Google profile"/> : <Icon name="user" size={19}/>}</button>
        </div>
      </header>

      {profileOpen && <ProfileMenu user={user} onClose={() => setProfileOpen(false)} onLogout={handleLogout}/>}
      {screen === 'home' && <Home
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        entries={dayEntries}
        allEntries={entries}
        addEntry={addEntry}
        updateEntry={updateEntry}
        deleteEntry={deleteEntry}
        totals={totals}
        goals={goals}
        calorieTarget={calorieTarget}
        water={Number(water[selectedDate] || 0)}
        setWater={value => setWater(previous => ({ ...previous, [selectedDate]: value }))}
        settings={settings}
        onNeedApi={() => setSettingsOpen(true)}
      />}
      {screen === 'weight' && <WeightTracker weights={weights} setWeights={setWeights} goals={goals}/>}

      <nav className="bottom-nav">
        <NavButton active={screen === 'home'} name="home" label="Home" onClick={() => setScreen('home')}/>
        <NavButton active={screen === 'weight'} name="scale" label="Weight Tracker" onClick={() => setScreen('weight')}/>
        <small>Made by Nishant Pawar</small>
      </nav>
    </main>

    {settingsOpen && <Settings settings={settings} setSettings={setSettings} user={user} onClose={() => setSettingsOpen(false)}/>}
    {healthOpen && <HealthJournal dailyNote={dailyNotes[todayKey()] || ''} setDailyNote={value => setDailyNotes(previous => ({ ...previous, [todayKey()]: value }))} period={period} setPeriod={setPeriod} onClose={() => setHealthOpen(false)}/>}
    {!goals && <GoalSetup onSave={saveGoal}/>}
  </div>;
}

function NavButton({ active, name, label, onClick }) {
  return <button className={active ? 'active' : ''} onClick={onClick}><Icon name={name}/><span>{label}</span></button>;
}

function ProfileMenu({ user, onClose, onLogout }) {
  return <aside className="profile-menu">
    <button className="profile-menu-close" aria-label="Close profile menu" onClick={onClose}><Icon name="close" size={16}/></button>
    <div className="profile-menu-user">{user?.picture ? <img src={user.picture} alt="Google profile"/> : <div>{user?.name?.[0] || 'N'}</div>}<section><strong>{user?.name || 'Nourish user'}</strong><span>{user?.email || ''}</span></section></div>
    <button className="logout-button" onClick={onLogout}>Log out</button>
  </aside>;
}

function DateStrip({ selectedDate, setSelectedDate, allEntries, goals }) {
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = dateFromKey(selectedDate);
    date.setDate(date.getDate() + index - 3);
    return date;
  });
  function statusFor(key) {
    const totals = totalsFor(allEntries.filter(entry => (entry.date || todayKey()) === key));
    const complete = totals.protein >= (goals?.protein || 120) && totals.carbs >= (goals?.carbs || 220) && totals.fat >= (goals?.fat || 67);
    if (complete) return 'complete';
    if (key < todayKey()) return 'missed';
    return '';
  }
  return <div className="date-strip">{dates.map(date => {
    const key = dateKey(date);
    return <button key={key} className={`${key === selectedDate ? 'selected' : ''} ${statusFor(key)}`} onClick={() => setSelectedDate(key)}>
      <span>{date.toLocaleDateString('en', { weekday: 'short' })}</span>
      <strong>{date.getDate()}</strong>
      <i/>
    </button>;
  })}</div>;
}

function MacroProgress({ label, value, target, colour, unit = 'g' }) {
  const safeTarget = Number(target) || 1;
  const percentage = Math.min(100, Math.round(Number(value || 0) / safeTarget * 100));
  return <div className="macro-row">
    <div><span>{label}</span><b><strong>{Number(value || 0).toLocaleString()}</strong> / {Number(target || 0).toLocaleString()} {unit}</b></div>
    <div className="progress-track"><i style={{ width: `${percentage}%`, background: colour }}/></div>
  </div>;
}

function Home({ selectedDate, setSelectedDate, entries, allEntries, addEntry, updateEntry, deleteEntry, totals, goals, calorieTarget, water, setWater, settings, onNeedApi }) {
  return <section className="home-screen">
    <DateStrip selectedDate={selectedDate} setSelectedDate={setSelectedDate} allEntries={allEntries} goals={goals}/>

    <div className="page-intro">
      <div><span>DAILY OVERVIEW</span><h1>{selectedDate === todayKey() ? 'Fuel your day.' : fullDate(selectedDate)}</h1></div>
      <div className="streak-note"><i className="complete-dot"/><span>Goal met</span><i className="missed-dot"/><span>Missed</span></div>
    </div>

    {!settings.apiKey && <button className="connect-ai" onClick={onNeedApi}><Icon name="magic" size={17}/><span><strong>Connect Gemini AI</strong><small>Add your API key once to analyse meals.</small></span><Icon name="plus" size={16}/></button>}

    <section className="macro-card">
      <div className="card-heading"><div><Icon name="chart" size={18}/><h2>Macros</h2></div><span>{Math.round(Math.min(100, totals.calories / calorieTarget * 100))}% of calories</span></div>
      <MacroProgress label="Calories" value={totals.calories} target={calorieTarget} colour="#ff6b00" unit="kcal"/>
      <MacroProgress label="Carbohydrates" value={totals.carbs} target={goals?.carbs || 220} colour="#b9c7e0"/>
      <MacroProgress label="Protein" value={totals.protein} target={goals?.protein || 120} colour="#ffb693"/>
      <MacroProgress label="Fat" value={totals.fat} target={goals?.fat || 67} colour="#8b9ab1"/>
    </section>

    <section className="water-card">
      <div className="water-icon"><Icon name="drop" size={20}/></div>
      <div><strong>Water</strong><p>{water ? `${water * 250} ml of 2,000 ml` : 'No water logged yet'}</p></div>
      <div className="water-controls"><button disabled={!water} onClick={() => setWater(Math.max(0, water - 1))}><Icon name="minus" size={16}/></button><span>{water}<small>/8</small></span><button onClick={() => setWater(Math.min(8, water + 1))}><Icon name="plus" size={16}/></button></div>
    </section>

    <MealJournal date={selectedDate} entries={entries} addEntry={addEntry} updateEntry={updateEntry} deleteEntry={deleteEntry} settings={settings} onNeedApi={onNeedApi}/>
  </section>;
}

function MealJournal({ date, entries, addEntry, updateEntry, deleteEntry, settings, onNeedApi }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => { setEditingId(null); setText(''); setPhoto(null); setMenuId(null); }, [date]);

  async function googleEstimate() {
    if (!settings.apiKey) throw new Error('Add your Gemini API key in Settings before logging a meal.');
    const parts = [{ text: `You are Nourish's nutrition logger. Extract a realistic nutrition estimate from the user's meal message and/or image. Reply ONLY with valid JSON in this exact shape: {"title":"", "calories":0, "carbs":0, "protein":0, "fat":0}. Use grams for carbohydrates, protein, and fat. User meal message: ${text || 'No text provided; identify the meal from the image.'}` }];
    if (photo) parts.push({ inlineData: { mimeType: photo.type, data: photo.data.split(',')[1] } });
    const model = settings.model || 'gemini-3-flash-preview';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }),
    });
    if (!response.ok) {
      const message = (await response.json().catch(() => null))?.error?.message;
      throw new Error(message || 'Gemini could not analyse this meal.');
    }
    const raw = (await response.json()).candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return {
      title: data.title || text || 'Photo meal',
      calories: Number(data.calories) || 0,
      carbs: Number(data.carbs) || 0,
      protein: Number(data.protein) || 0,
      fat: Number(data.fat) || 0,
    };
  }

  async function submit() {
    if ((!text.trim() && !photo) || busy) return;
    if (!settings.apiKey) { onNeedApi(); return; }
    setBusy(true);
    try {
      const data = await googleEstimate();
      const item = { date, text: text.trim() || 'Photo meal', photo: photo?.data || null, photoType: photo?.type || null, data };
      if (editingId) updateEntry(editingId, item);
      else addEntry({ id: crypto.randomUUID(), time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), ...item });
      setText('');
      setPhoto(null);
      setEditingId(null);
    } catch (error) {
      alert(error.message || 'Could not reach Google AI. Check the API key and selected model in Settings.');
    } finally { setBusy(false); }
  }

  function onPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto({ data: reader.result, type: file.type || 'image/jpeg' });
    reader.readAsDataURL(file);
    event.target.value = '';
  }
  function editEntry(entry) {
    setMenuId(null);
    setEditingId(entry.id);
    setText(entry.text || '');
    setPhoto(entry.photo ? { data: entry.photo, type: entry.photoType || 'image/jpeg' } : null);
  }

  return <section className="meal-section">
    <div className="section-heading"><div><span>MEAL LOG</span><h2>{date === todayKey() ? "Today's meals" : `Meals on ${shortDate(dateFromKey(date))}`}</h2></div><small>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</small></div>
    {entries.length === 0 ? <div className="empty-meals"><span><Icon name="magic" size={21}/></span><h3>Nothing logged yet</h3><p>Describe a meal or add a photo. Gemini will extract the macros.</p></div> : <div className="entry-list">{entries.map(entry => <article className="entry" key={entry.id}>
      <div className="entry-top">
        <div className="entry-icon">{entry.photo ? <img src={entry.photo} alt="Meal"/> : <Icon name="flame" size={17}/>}</div>
        <div className="entry-title"><h3>{entry.data?.title || 'Meal'}</h3><p>{entry.time || 'Saved meal'}</p></div>
        <div className="entry-calories"><strong>{entry.data?.calories || 0}</strong><span>Calories</span></div>
        <div className="entry-menu"><button aria-label="Meal options" onClick={() => setMenuId(menuId === entry.id ? null : entry.id)}><Icon name="more" size={20}/></button>{menuId === entry.id && <div><button onClick={() => editEntry(entry)}><Icon name="pencil" size={15}/> Edit message</button><button className="danger" onClick={() => { setMenuId(null); deleteEntry(entry.id); }}><Icon name="trash" size={15}/> Delete entry</button></div>}</div>
      </div>
      {entry.photo && <img className="entry-photo" src={entry.photo} alt={entry.data?.title || 'Logged meal'}/>}
      <p className="entry-message">{entry.text}</p>
      <div className="entry-result"><span><Icon name="magic" size={13}/> GEMINI EXTRACTED</span><div><b>Calories <strong>{entry.data?.calories || 0} kcal</strong></b><b>Carbohydrates <strong>{entry.data?.carbs || 0}g</strong></b><b>Protein <strong>{entry.data?.protein || 0}g</strong></b><b>Fat <strong>{entry.data?.fat || 0}g</strong></b></div></div>
    </article>)}</div>}

    <div className="composer-space"/>
    <div className="composer-dock">
      {photo && <div className="photo-preview"><img src={photo.data} alt="Selected meal"/><button onClick={() => setPhoto(null)}><Icon name="close" size={13}/></button></div>}
      {editingId && <div className="edit-banner"><span>Editing meal — Gemini will recalculate it.</span><button onClick={() => { setEditingId(null); setText(''); setPhoto(null); }}>Cancel</button></div>}
      <div className="composer">
        <input value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') submit(); }} placeholder="What did you eat?"/>
        <button aria-label="Choose meal photo" onClick={() => galleryRef.current?.click()}><Icon name="image" size={19}/></button>
        <button aria-label="Take meal photo" onClick={() => cameraRef.current?.click()}><Icon name="camera" size={19}/></button>
        <button className="send" aria-label="Analyse meal" disabled={(!text.trim() && !photo) || busy} onClick={submit}>{busy ? <span className="spinner"/> : <Icon name="send" size={18}/>}</button>
        <input hidden ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPhoto}/>
        <input hidden ref={galleryRef} type="file" accept="image/*" onChange={onPhoto}/>
      </div>
    </div>
  </section>;
}

function WeightTracker({ weights, setWeights, goals }) {
  const [weightInput, setWeightInput] = useState('');
  const recent = [...weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
  const latest = recent.at(-1);
  const first = recent[0];
  const change = latest && first ? latest.kg - first.kg : 0;
  const values = recent.map(item => Number(item.kg));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = Math.max(max - min, 1);

  function addWeight() {
    const kg = Number(weightInput);
    if (kg <= 0) return;
    setWeights(previous => {
      const withoutToday = previous.filter(item => item.date !== todayKey());
      return [...withoutToday, { id: crypto.randomUUID(), kg, date: todayKey(), time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }].sort((a, b) => a.date.localeCompare(b.date));
    });
    setWeightInput('');
  }
  function deleteWeight(item) {
    setWeights(previous => previous.filter(weight => item.id ? weight.id !== item.id : !(weight.date === item.date && weight.kg === item.kg)));
  }

  return <section className="weight-screen">
    <div className="weight-hero"><span>WEIGHT</span><h1>Your weight trend</h1><p>Keep a simple record of your check-ins.</p></div>
    <div className="weight-grid">
      <section className="weigh-card"><h2>Today's weigh-in</h2><div><label><input inputMode="decimal" type="number" value={weightInput} onChange={event => setWeightInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') addWeight(); }} placeholder={latest?.kg || 'Enter weight'}/><span>kg</span></label><button onClick={addWeight} aria-label="Save weight"><Icon name="plus" size={19}/></button></div></section>
      <section className="forecast-card"><span>WEEKLY EXPECTED {goals?.goal === 'gain' ? 'GAIN' : goals?.goal === 'lose' ? 'LOSS' : 'CHANGE'}</span><strong>{Math.abs(goals?.weeklyChange || 0).toFixed(2)} kg</strong><p>{goals?.goal === 'gain' ? 'Your nutrition plan supports gradual weight gain.' : goals?.goal === 'lose' ? 'Your nutrition plan supports gradual weight loss.' : 'Your plan is set to maintain your current weight.'}</p></section>
    </div>

    <section className="trend-card">
      <div className="trend-summary"><div><span>LATEST</span><strong>{latest ? `${latest.kg} kg` : '—'}</strong></div><div><span>RECENT CHANGE</span><strong className={change > 0 ? 'up' : change < 0 ? 'down' : ''}>{recent.length > 1 ? `${change > 0 ? '+' : ''}${change.toFixed(1)} kg` : '—'}</strong></div></div>
      {recent.length ? <div className="bar-chart">{recent.map((item, index) => <div key={item.id || `${item.date}-${index}`}><i style={{ height: `${20 + ((item.kg - min) / span) * 75}%` }}/><span>{dateFromKey(item.date).getDate()}</span></div>)}</div> : <div className="chart-empty">Your trend will appear after your first check-in.</div>}
    </section>

    <div className="section-heading checkin-heading"><div><span>HISTORY</span><h2>Recent check-ins</h2></div><small>Last 8 entries</small></div>
    <section className="checkin-list">{recent.length ? [...recent].reverse().map((item, index, reversed) => {
      const previous = reversed[index + 1];
      const delta = previous ? item.kg - previous.kg : null;
      return <article key={item.id || `${item.date}-${index}`}><div className="checkin-icon"><Icon name="scale" size={19}/></div><div><strong>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(dateFromKey(item.date))}</strong><span>{item.time || 'Saved check-in'}</span></div><b>{item.kg} kg <small className={delta > 0 ? 'up' : delta < 0 ? 'down' : ''}>{delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}</small></b><button aria-label="Delete check-in" onClick={() => deleteWeight(item)}><Icon name="trash" size={16}/></button></article>;
    }) : <p className="empty-list">No check-ins yet.</p>}</section>
  </section>;
}

function Settings({ settings, setSettings, user, onClose }) {
  const [draft, setDraft] = useState(settings);
  function save() { setSettings(draft); onClose(); }
  return <div className="modal-layer"><section className="settings-panel">
    <header><button onClick={onClose}><Icon name="back"/></button><h2>Settings</h2><span/></header>
    <div className="settings-body">
      <section className="profile-card"><div>{user?.picture ? <img src={user.picture} alt=""/> : user?.name?.[0] || 'N'}</div><section><strong>{user?.name || 'Nourish account'}</strong><p>{user?.email || ''}</p></section></section>
      <h3>Daily target</h3>
      <label className="field"><span>Calorie goal</span><div><input type="number" value={draft.calorieGoal || 2000} onChange={event => setDraft({ ...draft, calorieGoal: event.target.value })}/><b>kcal</b></div></label>
      <h3 className="with-icon"><Icon name="magic" size={16}/> Google AI</h3>
      <p className="help-text">Use your own Gemini API to analyse meal messages and photos.</p>
      {!draft.apiKey && <section className="api-guide"><span>ONE-TIME SETUP</span><strong>Connect Gemini AI</strong><ol><li>Open Google AI Studio below and sign in.</li><li>Choose <b>Create API key</b> and copy it.</li><li>Paste it here, choose a model, then save.</li></ol><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Open Google AI Studio</a></section>}
      <label className="field"><span>Google AI API key</span><input type="password" value={draft.apiKey || ''} onChange={event => setDraft({ ...draft, apiKey: event.target.value.trim() })} placeholder="Paste your API key"/></label>
      <label className="field"><span>Model</span><select value={draft.model || 'gemini-3-flash-preview'} onChange={event => setDraft({ ...draft, model: event.target.value })}><option value="gemini-3.5-flash">Gemini 3.5 Flash</option><option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option><option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite</option><option value="gemini-2.5-flash">Gemini 2.5 Flash</option></select></label>
      <p className="security-note"><Icon name="check" size={15}/> Your API setting is saved to your private Firebase account and restored when you sign in again.</p>
      <button className="primary-button" onClick={save}>Save settings</button>
    </div>
  </section></div>;
}

function Login({ required = false }) {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function signIn() {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try { await signInWithPopup(firebaseAuth, googleProvider); }
    catch (error) { setNotice(error.code === 'auth/unauthorized-domain' ? 'This domain is not approved in Firebase Authentication. Add it under Authentication → Settings → Authorized domains.' : 'Google sign-in could not be completed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="login-page"><section className="login-panel">
    <div className="brand-mark big">n</div><span>YOUR PRIVATE WELLNESS JOURNAL</span><h1>Eat smarter.<br/><em>Feel stronger.</em></h1><p>Track meals with Gemini, build consistent habits, and follow your weight trend.</p>
    <button className="google-button" disabled={busy} onClick={signIn}><b>G</b>{busy ? 'Opening Google…' : 'Continue with Google'}</button>
    {notice && <p className="login-notice">{notice}</p>}
    {required && <small>Your device will remember your Google session.</small>}
  </section></div>;
}

function HealthJournal({ dailyNote, setDailyNote, period, setPeriod, onClose }) {
  return <div className="modal-layer"><section className="settings-panel">
    <header><button onClick={onClose}><Icon name="back"/></button><h2>Private health</h2><span/></header>
    <div className="settings-body">
      <div className="health-intro"><Icon name="heart" size={21}/><div><strong>Just for you</strong><p>Your journal and period tracker stay outside the main navigation.</p></div></div>
      <h3>Daily journal</h3><p className="help-text">{fullDate(todayKey())}</p><textarea className="daily-note" value={dailyNote} onChange={event => setDailyNote(event.target.value)} placeholder="How do you feel today?"/>
      <h3>Period tracker</h3><label className="field"><span>First day of your last period</span><input type="date" value={period.lastPeriod} onChange={event => setPeriod({ ...period, lastPeriod: event.target.value })}/></label>
      <label className="field"><span>Typical cycle length</span><div><input type="number" value={period.cycle} onChange={event => setPeriod({ ...period, cycle: event.target.value })}/><b>days</b></div></label>
      {period.lastPeriod && <div className="period-card"><Icon name="calendar"/><div><span>Estimated next period</span><strong>{shortDate(new Date(dateFromKey(period.lastPeriod).getTime() + Number(period.cycle || 28) * 86400000))}</strong></div></div>}
      <button className="primary-button" onClick={onClose}>Save private journal</button>
    </div>
  </section></div>;
}

function GoalSetup({ onSave }) {
  const [profile, setProfile] = useState({ weight: '', height: '', age: '', sex: 'female', activity: 'moderate', goal: 'lose', pace: '0.25' });
  const update = (key, value) => setProfile(previous => ({ ...previous, [key]: value }));
  const ready = Number(profile.weight) > 0 && Number(profile.height) > 0 && Number(profile.age) > 0;
  return <div className="modal-layer goal-layer"><section className="goal-setup"><span>YOUR PERSONALISED PLAN</span><h2>Set your daily<br/><em>nutrition goal.</em></h2><p>Answer these once. Nourish calculates your calorie, macro, and expected weekly weight targets offline.</p>
    <div className="goal-grid"><label className="field"><span>Current weight</span><div><input type="number" inputMode="decimal" value={profile.weight} onChange={event => update('weight', event.target.value)} placeholder="60"/><b>kg</b></div></label><label className="field"><span>Height</span><div><input type="number" inputMode="decimal" value={profile.height} onChange={event => update('height', event.target.value)} placeholder="165"/><b>cm</b></div></label><label className="field"><span>Age</span><input type="number" value={profile.age} onChange={event => update('age', event.target.value)} placeholder="28"/></label><label className="field"><span>Sex</span><select value={profile.sex} onChange={event => update('sex', event.target.value)}><option value="female">Female</option><option value="male">Male</option></select></label></div>
    <label className="field"><span>Activity level</span><select value={profile.activity} onChange={event => update('activity', event.target.value)}><option value="low">Low — mostly sitting</option><option value="moderate">Moderate — regular movement</option><option value="active">Active — frequent training</option></select></label>
    <label className="field"><span>Your goal</span><select value={profile.goal} onChange={event => update('goal', event.target.value)}><option value="lose">Lose weight</option><option value="maintain">Maintain weight</option><option value="gain">Gain weight</option></select></label>
    {profile.goal !== 'maintain' && <label className="field"><span>Expected weekly {profile.goal === 'gain' ? 'gain' : 'loss'}</span><select value={profile.pace} onChange={event => update('pace', event.target.value)}><option value="0.25">0.25 kg per week</option><option value="0.5">0.50 kg per week</option></select></label>}
    <button className="primary-button" disabled={!ready} onClick={() => ready && onSave(profile)}>Calculate my daily goals</button><small>Wellness estimates only—not medical advice.</small>
  </section></div>;
}

createRoot(document.getElementById('root')).render(<App/>);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}));
}
