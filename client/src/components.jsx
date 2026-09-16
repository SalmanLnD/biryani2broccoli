import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { addDays, formatDate, formatNum, startOfWeek, todayKey } from "./lib";
import { useApp } from "./AppContext";

export function Icon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "home") return <svg viewBox="0 0 24 24" {...common}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1z"/></svg>;
  if (name === "food") return <svg viewBox="0 0 24 24" {...common}><path d="M4 12h16M7 12c0-5 1.5-8 2.5-8S12 7 12 12m5 0c0-5-1.5-8-2.5-8S12 7 12 12v8"/></svg>;
  if (name === "gym") return <svg viewBox="0 0 24 24" {...common}><path d="M6 9v6M18 9v6M8 10v4h8v-4zM4 10.5v3M20 10.5v3"/></svg>;
  if (name === "progress") return <svg viewBox="0 0 24 24" {...common}><path d="M4 19V5M4 19h16M8 15v4M12 11v8M16 8v11"/></svg>;
  if (name === "user") return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="3.5"/><path d="M5 19c1.5-3.2 4-5 7-5s5.5 1.8 7 5"/></svg>;
  if (name === "search") return <svg width="20" height="20" viewBox="0 0 24 24" {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>;
  return null;
}

export function Shell({ children }) {
  const { user } = useApp();
  const loc = useLocation();
  const items = [
    { to: "/", label: "Dashboard", icon: "home" },
    { to: "/food", label: "Food", icon: "food" },
    { to: "/workout", label: "Workout", icon: "gym" },
    { to: "/progress", label: "Progress", icon: "progress" },
    { to: "/profile", label: "Profile", icon: "user" },
  ];
  function active(to) {
    if (to === "/") return loc.pathname === "/";
    return loc.pathname.startsWith(to);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <strong>Biryani2Broccoli</strong>
            <small>{user?.name}</small>
          </div>
        </div>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={() => `side-link ${active(item.to) ? "active" : ""}`}>
            <Icon name={item.icon} /> {item.label}
          </NavLink>
        ))}
      </aside>
      <main className="app-main">{children}</main>
      <nav className="bottom-nav">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={() => (active(item.to) ? "active" : "")}>
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function DateStrip() {
  const { date, setDate, day } = useApp();
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="date-strip">
      {days.map((d) => {
        const dt = new Date(`${d}T00:00:00`);
        const on = d === date;
        const has = d === date && day?.consumed?.calories > 0;
        return (
          <button key={d} className={`day-chip ${on ? "active" : ""} ${has ? "has-data" : ""}`} onClick={() => setDate(d)}>
            <span>{dt.toLocaleDateString(undefined, { weekday: "short" })}</span>
            <b>{dt.getDate()}</b>
          </button>
        );
      })}
    </div>
  );
}

export function Ring({ value, max, size = 168, stroke = 12, color = "#0e8f78" }) {
  const pct = Math.max(0, Math.min(1.15, max ? value / max : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.min(1, pct) * c;
  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6eeea" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={pct > 1 ? "#d06a4f" : color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CalorieHero({ day }) {
  const remaining = day.remaining;
  const consumed = day.consumed.calories;
  const target = day.targets.calorieTarget;
  const over = remaining < 0;
  const stepCount = day.steps?.steps || 0;
  const deficit = day.estimatedDeficit ?? ((day.tdee || target) - consumed + (day.activeKcal || 0));
  const surplus = deficit < 0;
  return (
    <section className="hero">
      <div className="hero-top">
        <div className="ring-wrap">
          <Ring value={consumed} max={target} />
          <div className="ring-label">
            <b>{formatNum(Math.abs(remaining))}</b>
            <span className="tiny">{over ? "kcal over max" : "left to eat"}</span>
          </div>
        </div>
        <div>
          <div className="kcal-center">
            <span className="tiny">Intake vs daily max</span>
            <strong>{formatNum(consumed)} / {formatNum(target)}</strong>
            <p className="tiny">{day.percent}% of the food maximum</p>
            <p className="tiny">Burned calories increase the deficit. They do not raise this max.</p>
          </div>
          <div className="stats-row">
            <div className="stat"><b>{formatNum(consumed)}</b><span>Consumed</span></div>
            <div className="stat"><b>{formatNum(day.activeKcal)}</b><span>Burned</span></div>
            <div className="stat"><b>{formatNum(stepCount)}</b><span>Steps</span></div>
            <div className="stat">
              <b>{formatNum(Math.abs(deficit))}</b>
              <span>{surplus ? "Est. surplus" : "Est. deficit"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="macro-row">
        {[
          ["Protein", day.consumed.protein, day.targets.proteinTarget, "g", "#1b9e8a"],
          ["Carbs", day.consumed.carbs, day.targets.carbTarget, "g", "#d4a017"],
          ["Fat", day.consumed.fat, day.targets.fatTarget, "g", "#d06a4f"],
          ["Fiber", day.consumed.fiber, day.targets.fiberTarget, "g", "#5d8a46"],
        ].map(([label, v, t, u, color]) => (
          <div className="macro" key={label}>
            <div className="mini-ring">
              <Ring value={v} max={t} size={58} stroke={6} color={color} />
              <em>{Math.round(t ? (v / t) * 100 : 0)}%</em>
            </div>
            <small>{label}</small>
            <b>{formatNum(v, 0)}/{formatNum(t, 0)}{u}</b>
          </div>
        ))}
      </div>
      <p className="est" style={{ marginTop: 10 }}>Nutrition values are estimates. Mess and restaurant food varies with oil and portion size.</p>
    </section>
  );
}

export function WeekSelector({ weekStart, onChange }) {
  return (
    <div className="week-bar">
      <button type="button" onClick={() => onChange(addDays(weekStart, -7))}>‹</button>
      <div>
        <strong>{formatDate(weekStart, { day: "numeric", month: "short" })} – {formatDate(addDays(weekStart, 6), { day: "numeric", month: "short" })}</strong>
        {weekStart === startOfWeek(todayKey()) && <div className="tiny">This week</div>}
      </div>
      <button type="button" onClick={() => onChange(addDays(weekStart, 7))}>›</button>
    </div>
  );
}

export function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function ProgressTabs() {
  const loc = useLocation();
  const nav = useNavigate();
  const tabs = [
    ["/progress", "Weekly"],
    ["/progress/journey", "Weight"],
    ["/progress/workouts", "Training"],
    ["/progress/timeline", "Timeline"],
    ["/progress/nutrients", "Nutrients"],
    ["/summary", "Summary"],
  ];
  return (
    <div className="tabs">
      {tabs.map(([to, label]) => (
        <button key={to} className={loc.pathname === to ? "on" : ""} onClick={() => nav(to)}>{label}</button>
      ))}
    </div>
  );
}
