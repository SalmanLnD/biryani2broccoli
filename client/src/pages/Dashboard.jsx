import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../AppContext";
import { CalorieHero, DateStrip, Shell } from "../components";
import { formatDate, formatNum, MEALS } from "../lib";

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
      {loading && !day && <div className="skeleton" style={{ height: 220, marginBottom: 16 }} />}
      {day && <CalorieHero day={day} />}

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
