import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import { Icon, Shell } from "../components";
import { formatNum, MEALS, scaleFood, UNIT_LABEL, UNITS } from "../lib";

export default function FoodPage() {
  const { day, date } = useApp();
  const nav = useNavigate();
  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">Food diary</div>
          <h1>Track a meal</h1>
        </div>
        <button className="btn compact" onClick={() => nav("/food/add")}>
          <span className="btn-short">+</span>
          <span className="btn-full">+ Add food</span>
        </button>
      </header>
      {MEALS.map((m) => {
        const meal = day?.meals?.[m.slot];
        return (
          <article className="meal" key={m.slot} onClick={() => nav(`/meals/${m.slot}`)} style={{ cursor: "pointer" }}>
            <div className="meal-head">
              <div>
                <h3>{m.label}</h3>
                <p className="tiny">{meal?.items?.length || 0} items · {formatNum(meal?.totals?.calories || 0)} kcal</p>
              </div>
              <span className="tiny">{formatNum(meal?.totals?.protein || 0)}p · {formatNum(meal?.totals?.carbs || 0)}c · {formatNum(meal?.totals?.fat || 0)}f</span>
            </div>
          </article>
        );
      })}
      <p className="est">Showing {date}. All nutrition figures are estimates.</p>
    </Shell>
  );
}

export function AddFood() {
  const { date, setDay } = useApp();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [meal, setMeal] = useState(params.get("meal") || "breakfast");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [foods, setFoods] = useState([]);
  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState(100);
  const [unit, setUnit] = useState("grams");
  const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", calories: 200, protein: 10, carbs: 20, fat: 8, fiber: 2, sugar: 2, sodium: 200 });

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (category !== "all") qs.set("category", category);
      api.foods(`?${qs.toString()}`).then((d) => setFoods(d.foods));
    }, 180);
    return () => clearTimeout(t);
  }, [q, category]);

  const nutrition = useMemo(() => (picked ? scaleFood(picked, qty, unit) : null), [picked, qty, unit]);

  async function save() {
    setBusy(true);
    try {
      let foodId = picked?._id;
      if (custom) {
        const created = await api.createFood({
          name: form.name,
          category: "other",
          nutritionPer100g: form,
          defaultUnit: "grams",
          defaultQuantity: 100,
        });
        foodId = created.food._id;
      }
      const data = await api.addFood(meal, { date, foodId, quantity: custom ? 100 : qty, unit: custom ? "grams" : unit });
      setDay(data);
      nav(`/meals/${meal}`);
    } finally {
      setBusy(false);
    }
  }

  function choose(food) {
    setPicked(food);
    setUnit(food.defaultUnit || "grams");
    setQty(food.defaultQuantity || 100);
    setCustom(false);
  }

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">Add food</div>
          <h1>Log something</h1>
        </div>
        <button className="btn compact secondary" onClick={() => nav(-1)}>Close</button>
      </header>
      <div className="chips">
        {MEALS.map((m) => (
          <button key={m.slot} className={`chip ${meal === m.slot ? "on" : ""}`} onClick={() => setMeal(m.slot)}>{m.label}</button>
        ))}
      </div>
      <div className="search">
        <Icon name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search idli, dosa, biryani…" />
      </div>
      <div className="chips">
        {["all", "breakfast", "rice", "curry", "chutney", "snacks", "restaurant", "fruits", "dairy", "beverages"].map((c) => (
          <button key={c} className={`chip ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
        <button className={`chip ${custom ? "on" : ""}`} onClick={() => { setCustom(true); setPicked(null); }}>Custom</button>
      </div>

      {!picked && !custom && (
        <div className="list-card">
          {foods.map((f) => (
            <button key={f._id} className="food-row" onClick={() => choose(f)}>
              <div>
                <b>{f.name}</b>
                <span className="tiny">{f.category} · ~{f.nutritionPer100g.calories} kcal / 100g · est.</span>
              </div>
              <span className="tiny">Add</span>
            </button>
          ))}
        </div>
      )}

      {custom && (
        <div className="card">
          <div className="field"><label>Food name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid-2">
            {["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"].map((k) => (
              <div className="field" key={k}>
                <label>{k} / 100g</label>
                <input type="number" value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} />
              </div>
            ))}
          </div>
          <p className="est">Enter values per 100 grams. They will be stored as estimates.</p>
        </div>
      )}

      {picked && nutrition && (
        <div className="card">
          <h2>{picked.name}</h2>
          <p className="tiny">Estimated per logged quantity</p>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}
            </select>
          </div>
          <div className="qty">
            <button type="button" onClick={() => setQty(Math.max(0.5, +(qty - (unit === "grams" ? 10 : 1)).toFixed(1)))}>−</button>
            <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            <button type="button" onClick={() => setQty(+(qty + (unit === "grams" ? 10 : 1)).toFixed(1))}>+</button>
          </div>
          <p className="tiny" style={{ textAlign: "center" }}>{nutrition.grams} g</p>
          <div className="nutrition-grid">
            <div><b>{nutrition.calories}</b><span>kcal</span></div>
            <div><b>{nutrition.protein}g</b><span>protein</span></div>
            <div><b>{nutrition.carbs}g</b><span>carbs</span></div>
            <div><b>{nutrition.fat}g</b><span>fat</span></div>
            <div><b>{nutrition.fiber}g</b><span>fiber</span></div>
            <div><b>{nutrition.sugar}g</b><span>sugar</span></div>
            <div><b>{nutrition.sodium}</b><span>sodium mg</span></div>
            <div><b>est.</b><span>not lab values</span></div>
          </div>
        </div>
      )}

      {(picked || custom) && (
        <div className="sticky-cta">
          <button className="btn block lg" disabled={busy || (!picked && !form.name)} onClick={save}>
            {busy ? "Adding…" : "Add to meal"}
          </button>
        </div>
      )}
    </Shell>
  );
}

export function MealDetail() {
  const { date, day, setDay } = useApp();
  const { slot } = useParams();
  const meal = day?.meals?.[slot];
  const nav = useNavigate();
  const [editing, setEditing] = useState(null);
  const [qty, setQty] = useState(0);
  const [unit, setUnit] = useState("grams");
  const [foods, setFoods] = useState({});

  useEffect(() => {
    api.foods().then((d) => {
      const map = {};
      d.foods.forEach((f) => { map[f._id] = f; });
      setFoods(map);
    });
  }, []);

  if (!meal) return <Shell><p>Loading meal…</p></Shell>;

  async function remove(id) {
    const data = await api.deleteFood(slot, id, date);
    setDay(data);
  }
  async function dup(id) {
    const data = await api.duplicateFood(slot, id, date);
    setDay(data);
  }
  async function saveEdit() {
    const data = await api.editFood(slot, editing._id, { date, quantity: qty, unit, foodId: editing.food });
    setDay(data);
    setEditing(null);
  }

  const live = editing && foods[String(editing.food)] ? scaleFood(foods[String(editing.food)], qty, unit) : null;

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">Meal</div>
          <h1>{meal.label}</h1>
        </div>
        <button className="btn compact" onClick={() => nav(`/food/add?meal=${slot}`)}>+ Food</button>
      </header>
      {meal.items.map((item) => (
        <div className="card" key={item._id}>
          <div className="meal-head">
            <div>
              <h3>{item.foodName}</h3>
              <p className="tiny">{item.quantity} {item.unit} · {item.grams}g · estimate</p>
            </div>
            <b>{formatNum(item.calories)} kcal</b>
          </div>
          <div className="macros-inline" style={{ marginTop: 8 }}>
            <span>P {item.protein}g</span><span>C {item.carbs}g</span><span>F {item.fat}g</span><span>Fi {item.fiber}g</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn secondary" onClick={() => { setEditing(item); setQty(item.quantity); setUnit(item.unit); }}>Edit</button>
            <button className="btn ghost" onClick={() => dup(item._id)}>Duplicate</button>
            <button className="btn danger" onClick={() => remove(item._id)}>Delete</button>
          </div>
        </div>
      ))}
      {!meal.items.length && <p className="empty">No foods in this meal yet.</p>}
      <div className="card">
        <h3>Meal total</h3>
        <div className="nutrition-grid">
          <div><b>{formatNum(meal.totals.calories)}</b><span>kcal</span></div>
          <div><b>{meal.totals.protein}g</b><span>protein</span></div>
          <div><b>{meal.totals.carbs}g</b><span>carbs</span></div>
          <div><b>{meal.totals.fat}g</b><span>fat</span></div>
        </div>
      </div>

      {editing && (
        <div className="card">
          <h3>Edit {editing.foodName}</h3>
          <div className="field"><label>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}
            </select>
          </div>
          <div className="qty">
            <button type="button" onClick={() => setQty(Math.max(0.5, qty - 1))}>−</button>
            <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            <button type="button" onClick={() => setQty(qty + 1)}>+</button>
          </div>
          {live && <p className="tiny">{live.calories} kcal · {live.protein}g protein</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={saveEdit}>Save</button>
            <button className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </Shell>
  );
}
