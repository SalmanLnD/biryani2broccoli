import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { createContext, useContext, useState } from "react";
import { addDays, formatActiveKcal, formatDate, formatNum, startOfWeek, todayKey, TIPS } from "./lib";
import { useApp } from "./AppContext";

const TipCtx = createContext(null);

export function Explainer({ children }) {
  const [msg, setMsg] = useState("");
  return (
    <TipCtx.Provider value={{ msg, setMsg }}>
      {children}
      {msg ? <p className="note tip-note">{msg}</p> : null}
    </TipCtx.Provider>
  );
}

export function Icon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "home") return <svg viewBox="0 0 24 24" {...common}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1z"/></svg>;
  if (name === "food") return <svg viewBox="0 0 24 24" {...common}><path d="M4 12h16M7 12c0-5 1.5-8 2.5-8S12 7 12 12m5 0c0-5-1.5-8-2.5-8S12 7 12 12v8"/></svg>;
  if (name === "gym") return <svg viewBox="0 0 24 24" {...common}><path d="M6 9v6M18 9v6M8 10v4h8v-4zM4 10.5v3M20 10.5v3"/></svg>;
  if (name === "progress") return <svg viewBox="0 0 24 24" {...common}><path d="M4 19V5M4 19h16M8 15v4M12 11v8M16 8v11"/></svg>;
  if (name === "user") return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="3.5"/><path d="M5 19c1.5-3.2 4-5 7-5s5.5 1.8 7 5"/></svg>;
  if (name === "search") return <svg width="20" height="20" viewBox="0 0 24 24" {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>;
  if (name === "info") return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.5h.01"/></svg>;
  return null;
}

export function Tip({ text }) {
  const ctx = useContext(TipCtx);
  const on = ctx?.msg === text;
  return (
    <button
      type="button"
      className={`tip ${on ? "on" : ""}`}
      aria-label="More info"
      aria-expanded={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        ctx?.setMsg(on ? "" : text);
      }}
    >
      i
    </button>
  );
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
            <span className="tiny">Food intake vs daily max</span>
            <strong>{formatNum(consumed)} / {formatNum(target)}</strong>
            <p className="tiny">{day.percent}% of today's food maximum</p>
          </div>
          <div className="stats-row three">
            <div className="stat"><b>{formatNum(consumed)}</b><span>Consumed</span></div>
            <div className="stat"><b>{formatNum(target)}</b><span>Food max</span></div>
            <div className="stat"><b>{formatNum(Math.abs(remaining))}</b><span>{over ? "Over" : "Left to eat"}</span></div>
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

function energyFrom(day) {
  if (day?.energy) return day.energy;
  const food = day?.consumed?.calories || 0;
  const tdee = day?.tdee || day?.targets?.calorieTarget || 0;
  const estimatedDeficit = Math.round(tdee - food);
  return {
    method: "tdee",
    tdee,
    foodCalories: food,
    estimatedDeficit,
    surplus: estimatedDeficit < 0,
    activityLabel: day?.activityLabel || "",
    methodNote: TIPS.activity,
    bmr: day?.bmr || 0,
    baselineKcal: 0,
    walkActiveKcal: day?.stepKcal || 0,
    workoutActiveKcal: day?.exerciseKcal || 0,
    stepKcal: day?.stepKcal || 0,
    exerciseKcal: day?.exerciseKcal || 0,
    cardioKcal: 0,
  };
}

export function DeficitSummary({ day }) {
  const energy = energyFrom(day);
  const surplus = energy.surplus;
  const amount = formatNum(Math.abs(energy.estimatedDeficit));
  const noFood = !(energy.foodCalories > 0);
  return (
    <section className="hero deficit-card">
      <Explainer>
        <p className="tiny">Daily calorie summary</p>
        <p className="tiny">Today's estimated deficit <Tip text={TIPS.deficit} /></p>
        <strong className={`deficit-num ${surplus ? "surplus" : ""}`}>
          {surplus ? "+" : ""}{amount}
          <span>kcal {surplus ? "surplus" : "deficit"}</span>
        </strong>
        <div className="kv-list">
          {energy.method === "activity" ? (
            <>
              <div className="kv"><span>Sedentary baseline <Tip text={TIPS.bmr} /></span><b>{formatNum(energy.baselineKcal)} kcal</b></div>
              <div className="kv"><span>Active walking <Tip text={TIPS.activeCalories} /></span><b>{formatNum(energy.walkActiveKcal)} kcal</b></div>
              <div className="kv"><span>Active workout</span><b>{formatNum(energy.workoutActiveKcal)} kcal</b></div>
            </>
          ) : (
            <div className="kv">
              <span>TDEE / maintenance <Tip text={TIPS.tdee} /></span>
              <b>{formatNum(energy.tdee)} kcal</b>
            </div>
          )}
          <p className="tiny activity-tag">{energy.activityLabel ? `${energy.activityLabel} · BMR ${formatNum(energy.bmr)} kcal` : "Maintenance estimate"}</p>
          <div className="kv"><span>Food consumed</span><b>{formatNum(energy.foodCalories)} kcal</b></div>
          <div className="kv total">
            <span>{surplus ? "Estimated surplus" : "Estimated deficit"} <Tip text={TIPS.doubleCount} /></span>
            <b>{surplus ? "+" : ""}{amount} kcal</b>
          </div>
        </div>
      </Explainer>
      <p className="est">{energy.methodNote}</p>
      {noFood && <p className="tiny">Log today's meals to estimate the deficit. With no food logged, this equals maintenance.</p>}
    </section>
  );
}

export function ActivityCard({ day }) {
  const energy = energyFrom(day);
  const steps = day.steps?.steps || 0;
  const workout = day.workout || { count: day.workouts?.length || 0, durationMin: 0, calories: day.exerciseKcal || 0, cardioKcal: 0 };
  const completed = workout.count > 0;
  return (
    <section className="card activity-card">
      <Explainer>
        <div className="section-head" style={{ marginBottom: 8 }}>
          <h2>Today's activity</h2>
          <span className="ref-badge">Reference only <Tip text={TIPS.activity} /></span>
        </div>
        <p className="tiny" style={{ marginBottom: 10 }}>Activity stats — not added to TDEE</p>
        <div className="kv-list">
          <div className="kv">
            <span>Walking <Tip text={TIPS.walkingCalories} /></span>
            <b>{formatNum(steps)} steps</b>
          </div>
          <div className="kv">
            <span>Estimated burn</span>
            <b>{formatActiveKcal(energy.walkActiveKcal || energy.stepKcal)} active kcal</b>
          </div>
          <div className="kv"><span>Workout</span><b>{completed ? "Completed" : "Not logged"}</b></div>
          <div className="kv"><span>Workout duration</span><b>{formatNum(workout.durationMin)} min</b></div>
          <div className="kv">
            <span>Active calories <Tip text={TIPS.activeCalories} /></span>
            <b>{formatActiveKcal(workout.calories || energy.exerciseKcal)} active kcal</b>
          </div>
          {workout.cardioKcal > 0 && (
            <div className="kv"><span>Cardio calories</span><b>{formatNum(workout.cardioKcal)} kcal</b></div>
          )}
        </div>
      </Explainer>
      <p className="est">These are estimated active calories, not extra calories to add to your TDEE deficit.</p>
    </section>
  );
}

export function GoalSnapshot({ day, user }) {
  const goal = day.goal || {};
  const p = user?.profile || {};
  const current = goal.currentWeightKg || p.currentWeightKg;
  const target = goal.targetWeightKg || p.targetWeightKg;
  const remaining = goal.remainingKg ?? Math.round(((current || 0) - (target || 0)) * 10) / 10;
  const dateLabel = (goal.targetDate || p.targetDate)
    ? formatDate(goal.targetDate || p.targetDate, { day: "numeric", month: "short", year: "numeric" })
    : "—";
  return (
    <section className="card">
      <div className="section-head" style={{ marginBottom: 8 }}>
        <h2>Weight-loss target</h2>
        <Link to="/progress/journey">Journey</Link>
      </div>
      <div className="kv-list">
        <div className="kv"><span>Current weight</span><b>{formatNum(current, 2)} kg</b></div>
        <div className="kv"><span>Target weight</span><b>{formatNum(target, 2)} kg</b></div>
        <div className="kv"><span>Remaining</span><b>{formatNum(remaining, 2)} kg</b></div>
        <div className="kv"><span>Target date</span><b>{dateLabel}</b></div>
        <div className="kv"><span>Required weekly loss</span><b>~{formatNum(goal.requiredWeeklyLossKg || 0, 2)} kg</b></div>
        <div className="kv"><span>Required daily deficit</span><b>~{formatNum(goal.requiredDailyDeficit || 0)} kcal</b></div>
        <div className="kv"><span>Required weekly deficit</span><b>~{formatNum(goal.requiredWeeklyDeficit || 0)} kcal</b></div>
      </div>
      <p className="est">{TIPS.goal}</p>
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
