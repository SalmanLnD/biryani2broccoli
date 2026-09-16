import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { useApp } from "../AppContext";
import { DateStrip, ProgressTabs, Shell, WeekSelector } from "../components";
import { formatDate, formatNum, MEALS, startOfWeek, todayKey } from "../lib";

const tooltip = { background: "#fff", border: "1px solid #dce7e2", borderRadius: 8, fontSize: 12 };

export default function Weekly() {
  const { date } = useApp();
  const [weekStart, setWeekStart] = useState(startOfWeek(date));
  const [data, setData] = useState(null);
  useEffect(() => { api.week(weekStart).then(setData); }, [weekStart]);
  const chart = (data?.days || []).map((d) => ({
    name: formatDate(d.date, { weekday: "short" }),
    target: d.targets.calorieTarget,
    consumed: d.consumed.calories,
  }));
  return (
    <Shell>
      <header className="page-head"><div><div className="greet">Progress</div><h1>Weekly nutrition</h1></div></header>
      <ProgressTabs />
      <WeekSelector weekStart={weekStart} onChange={setWeekStart} />
      {!data ? <div className="skeleton" style={{ height: 180 }} /> : (
        <>
          <div className="kpi">
            <div><b>{formatNum(data.weekly.caloriesConsumed)}</b><span>Weekly kcal in</span></div>
            <div><b>{formatNum(data.weekly.caloriesTarget)}</b><span>Weekly target</span></div>
            <div><b>{formatNum(data.weekly.avgCalories)}</b><span>Avg daily kcal</span></div>
            <div><b>{formatNum(data.weekly.protein, 0)}g</b><span>Weekly protein</span></div>
            <div><b>{data.weekly.avgProtein}g</b><span>Avg daily protein</span></div>
            <div><b>{formatNum(data.weekly.carbs, 0)}g</b><span>Weekly carbs</span></div>
            <div><b>{formatNum(data.weekly.fat, 0)}g</b><span>Weekly fat</span></div>
            <div><b>{formatNum(data.weekly.fiber, 0)}g</b><span>Weekly fiber</span></div>
          </div>
          <p className="note" style={{ margin: "12px 0" }}>{data.weekly.daysWithinTarget} of 7 days within calorie target</p>
          <div className="card">
            <h3>Daily target vs consumed</h3>
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={chart}>
                  <CartesianGrid stroke="#e6eeea" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltip} />
                  <Bar dataKey="target" fill="#c8eadf" radius={6} />
                  <Bar dataKey="consumed" fill="#0e8f78" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}

export function Journey() {
  const { date, setUser } = useApp();
  const [data, setData] = useState(null);
  const [weight, setWeight] = useState("");
  useEffect(() => { api.journey().then((d) => { setData(d); setWeight(d.currentWeight); }); }, [date]);
  async function save() {
    const res = await api.saveWeight(date, { weightKg: Number(weight) });
    setUser(res.user);
    setData(await api.journey());
  }
  const chart = (data?.logs || []).map((l) => ({ date: l.date.slice(5), kg: l.weightKg }));
  return (
    <Shell>
      <header className="page-head"><div><div className="greet">Progress</div><h1>Weight journey</h1></div></header>
      <ProgressTabs />
      {data && (
        <>
          <div className="kpi">
            <div><b>{data.startWeight} kg</b><span>Starting</span></div>
            <div><b>{data.currentWeight} kg</b><span>Current</span></div>
            <div><b>{data.targetWeight} kg</b><span>Target</span></div>
            <div><b>{data.totalLost} kg</b><span>Change so far</span></div>
            <div><b>{data.remaining} kg</b><span>Remaining</span></div>
            <div><b>{data.progress}%</b><span>Progress</span></div>
          </div>
          <p className="tiny" style={{ margin: "8px 0 12px" }}>Target date {data.targetDate}. A sustainable pace is about 0.25–0.75 kg per week.</p>
          <div className="card">
            <h3>Weight vs date</h3>
            <div className="chart-box">
              <ResponsiveContainer>
                <LineChart data={chart}>
                  <CartesianGrid stroke="#e6eeea" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltip} />
                  <Line type="monotone" dataKey="kg" stroke="#145c50" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="field" style={{ marginTop: 12 }}><label>Log weight for {date}</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <button className="btn" onClick={save}>Save weight</button>
          </div>
        </>
      )}
    </Shell>
  );
}

export function WeeklyWorkouts() {
  const [weekStart, setWeekStart] = useState(startOfWeek(todayKey()));
  const [data, setData] = useState(null);
  useEffect(() => { api.week(weekStart).then(setData); }, [weekStart]);
  const chart = (data?.days || []).map((d) => ({
    name: formatDate(d.date, { weekday: "short" }),
    target: Math.round((data.weekly.burnTarget || 0) / 7),
    actual: d.activeKcal,
  }));
  return (
    <Shell>
      <header className="page-head"><div><div className="greet">Progress</div><h1>Weekly training</h1></div></header>
      <ProgressTabs />
      <WeekSelector weekStart={weekStart} onChange={setWeekStart} />
      {data && (
        <>
          <div className="kpi">
            <div><b>{data.weekly.workoutsDone} / 7</b><span>Workouts logged</span></div>
            <div><b>{formatNum(data.weekly.burnActual)}</b><span>kcal burned</span></div>
            <div><b>{formatNum(data.weekly.burnTarget)}</b><span>Weekly burn target</span></div>
            <div><b>{formatNum(data.weekly.burnDiff)}</b><span>Difference</span></div>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            {(data.days || []).map((d) => {
              const sets = d.workouts.reduce((s, w) => s + w.exercises.reduce((a, e) => a + (e.sets?.length || 0), 0), 0);
              const volume = d.workouts.reduce((s, w) => s + w.exercises.reduce((a, e) => a + e.sets.reduce((x, set) => x + (set.reps || 0) * (set.weight || 0), 0), 0), 0);
              return (
                <p key={d.date} className="insight">
                  {formatDate(d.date, { weekday: "short" })} · {d.workouts.length ? "completed" : "not completed"} · {d.workouts[0]?.durationMin || 0} min · {formatNum(d.activeKcal)} kcal · {d.steps.steps || 0} steps · {sets} sets · {formatNum(volume)} kg volume
                </p>
              );
            })}
          </div>
          <div className="card">
            <h3>Target burn vs actual</h3>
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={chart}>
                  <CartesianGrid stroke="#e6eeea" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltip} />
                  <Bar dataKey="target" fill="#f1e3b8" radius={6} />
                  <Bar dataKey="actual" fill="#0e8f78" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}

export function Timeline() {
  const { date } = useApp();
  const [data, setData] = useState(null);
  useEffect(() => { api.timeline(date).then(setData); }, [date]);
  return (
    <Shell>
      <header className="page-head"><div><div className="greet">Today</div><h1>Daily timeline</h1></div></header>
      <ProgressTabs />
      <DateStrip />
      <div className="timeline">
        {(data?.events || []).map((e, i) => (
          <div className="tl-item" key={i}>
            <div className="tiny">{e.at ? new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} · {e.label}</div>
            <h3>{e.title}</h3>
            <p className="tiny">{e.detail} · {formatNum(e.calories)} kcal</p>
          </div>
        ))}
        {!data?.events?.length && <p className="empty">Nothing logged on this day yet.</p>}
      </div>
    </Shell>
  );
}

export function Nutrients() {
  const { date } = useApp();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState("protein");
  useEffect(() => { api.nutrients(date).then(setData); }, [date]);
  const keys = [
    ["calories", "Calories", "kcal", "calorieTarget"],
    ["protein", "Protein", "g", "proteinTarget"],
    ["carbs", "Carbohydrates", "g", "carbTarget"],
    ["fat", "Fat", "g", "fatTarget"],
    ["fiber", "Fiber", "g", "fiberTarget"],
    ["sugar", "Sugar", "g", "sugarLimit"],
    ["sodium", "Sodium", "mg", "sodiumLimit"],
  ];
  return (
    <Shell>
      <header className="page-head"><div><div className="greet">Nutrition</div><h1>Nutrient breakdown</h1></div></header>
      <ProgressTabs />
      {data && keys.map(([k, label, unit, t]) => (
        <button key={k} className="food-row" onClick={() => setOpen(k)}>
          <div>
            <b>{label}</b>
            <span className="tiny">Daily {formatNum(data.daily[k], k === "calories" ? 0 : 1)} / {formatNum(data.targets[t] || 0)} {unit}</span>
          </div>
          <span className="tiny">Avg {formatNum(data.weeklyAverage[k], 0)} {unit}</span>
        </button>
      ))}
      {data && (
        <div className="card">
          <h3>{open} by meal</h3>
          {MEALS.map((m) => (
            <p key={m.slot} className="insight">{m.label}: {formatNum(data.byMeal[m.slot]?.[open] || 0, 1)}</p>
          ))}
        </div>
      )}
    </Shell>
  );
}

export function DailySummary() {
  const { day, date } = useApp();
  if (!day) return <Shell><p>Loading…</p></Shell>;
  return (
    <Shell>
      <header className="page-head"><div><div className="greet">{formatDate(date)}</div><h1>Daily summary</h1></div></header>
      <ProgressTabs />
      <div className="card">
        <p>Calories: {formatNum(day.consumed.calories)} / {formatNum(day.targets.calorieTarget)}</p>
        <p>Protein: {formatNum(day.consumed.protein, 0)} / {day.targets.proteinTarget}g</p>
        <p>Carbs: {formatNum(day.consumed.carbs, 0)} / {day.targets.carbTarget}g</p>
        <p>Fat: {formatNum(day.consumed.fat, 0)} / {day.targets.fatTarget}g</p>
        <p>Exercise: {formatNum(day.activeKcal)} kcal</p>
      </div>
      <div className="card">
        <h3>Observations</h3>
        {day.insights.map((i) => <p key={i} className="insight">{i}</p>)}
        <p className="est">Neutral notes only. Food quality varies; these are tracking aids, not judgements.</p>
      </div>
    </Shell>
  );
}
