import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { CalorieHero, DateStrip, DeficitSummary, ActivityCard, GoalSnapshot, Shell } from "../components";
import { api } from "../api";
import { formatDate, formatNum, MEALS } from "../lib";

function WeighInCard({ day, user }) {
  const { setUser, refreshDay, date } = useApp();
  const w = day?.weighIn;
  const [kg, setKg] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    setKg(w?.lastWeightKg || user?.profile?.currentWeightKg || "");
    setErr("");
    setSaved("");
  }, [w?.askDate, w?.lastWeightKg, user?.profile?.currentWeightKg]);

  if (!w) return null;

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setSaved("");
    try {
      const res = await api.saveWeight(w.askDate, {
        weightKg: Number(kg),
        note: `${w.weekday} weigh-in`,
      });
      setUser(res.user);
      await refreshDay(date);
      setSaved(res.plan?.note || "Weight saved. TDEE and targets were updated.");
    } catch (error) {
      setErr(error.message || "Could not save weight.");
    } finally {
      setBusy(false);
    }
  }

  const change = w.weekChangeKg;
  const changeText = change == null ? "" : ` · ${change > 0 ? "+" : ""}${formatNum(change, 2)} kg Mon to Sat`;

  return (
    <>
      {w.needed && (
        <form className="card weigh-in" onSubmit={save}>
          <h2>{w.weekday} weigh-in</h2>
          <p className="tiny">
            Log weight on Monday and Saturday each week. That updates TDEE, food max, and weekly progress from the change.
          </p>
          {w.lastWeightKg ? <p className="tiny">Last logged weight: {formatNum(w.lastWeightKg, 2)} kg</p> : null}
          <div className="field" style={{ marginTop: 10 }}>
            <label>Weight for {formatDate(w.askDate, { weekday: "long", day: "numeric", month: "short" })} (kg)</label>
            <input type="number" step="0.1" min="30" max="250" value={kg} onChange={(e) => setKg(e.target.value)} required />
          </div>
          {err && <p className="error">{err}</p>}
          {saved && <p className="note">{saved}</p>}
          <button className="btn block" disabled={busy}>{busy ? "Saving…" : `Save ${w.weekday} weight`}</button>
        </form>
      )}
      {(w.mondayKg || w.saturdayKg) && (
        <p className="note">
          This week: Mon {w.mondayKg != null ? `${formatNum(w.mondayKg, 2)} kg` : "not logged"}
          {" · "}Sat {w.saturdayKg != null ? `${formatNum(w.saturdayKg, 2)} kg` : "not logged"}
          {changeText}
        </p>
      )}
    </>
  );
}

export default function Dashboard() {
  const { user, day, loading, date } = useApp();
  const nav = useNavigate();
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">{hello}</div>
          <h1>{user?.name?.split(" ")[0]}</h1>
          <p className="tiny">{formatDate(date, { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <button className="btn compact ghost" onClick={() => nav("/food/add")}>
          <span className="btn-short">+</span>
          <span className="btn-full">+ Add food</span>
        </button>
      </header>
      <DateStrip />
      {day && <WeighInCard day={day} user={user} />}
      {loading && !day && <div className="skeleton" style={{ height: 220, marginBottom: 16 }} />}
      {day && (
        <>
          <DeficitSummary day={day} />
          <div className="dash-stack">
            <CalorieHero day={day} />
            <div className="dash-grid">
              <ActivityCard day={day} />
              <GoalSnapshot day={day} user={user} />
            </div>
          </div>
        </>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Today's meals</h2>
          <Link to="/progress/timeline">Timeline</Link>
        </div>
        {MEALS.map((m) => {
          const meal = day?.meals?.[m.slot];
          return (
            <article className="meal" key={m.slot}>
              <div className="meal-head">
                <div>
                  <h3>{m.label}</h3>
                  <p className="tiny">{meal?.totals?.calories ? `${formatNum(meal.totals.calories)} kcal · est.` : m.hint}</p>
                </div>
                <button className="add-btn" aria-label={`Add to ${m.label}`} onClick={() => nav(`/food/add?meal=${m.slot}`)}>+</button>
              </div>
              {!meal?.items?.length && <p className="empty-line">Nothing logged yet</p>}
              {meal?.items?.slice(0, 3).map((item) => (
                <button key={item._id} className="food-row" onClick={() => nav(`/meals/${m.slot}`)}>
                  <div>
                    <b>{item.foodName}</b>
                    <span className="tiny">{item.quantity} {item.unit}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <b>{formatNum(item.calories)}</b>
                    <div className="tiny">kcal</div>
                  </div>
                </button>
              ))}
              {meal?.items?.length > 3 && (
                <button className="link" style={{ background: "none", border: 0, color: "var(--teal)", fontWeight: 700 }} onClick={() => nav(`/meals/${m.slot}`)}>
                  View all {meal.items.length} items
                </button>
              )}
            </article>
          );
        })}
      </section>
    </Shell>
  );
}
