import { useState } from "react";
import { useApp } from "../AppContext";
import { Shell } from "../components";
import { ACTIVITY } from "../lib";
import { api } from "../api";

export default function Profile() {
  const { user, setUser, logout } = useApp();
  const p = user?.profile || {};
  const [form, setForm] = useState({
    name: user?.name || "",
    age: p.age,
    sex: p.sex,
    heightCm: p.heightCm,
    currentWeightKg: p.currentWeightKg,
    targetWeightKg: p.targetWeightKg,
    targetDate: p.targetDate,
    activityLevel: p.activityLevel,
    stepTarget: p.stepTarget,
  });
  const [plan, setPlan] = useState(null);
  const [msg, setMsg] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save(e) {
    e.preventDefault();
    const data = await api.updateProfile(form);
    setUser(data.user);
    setPlan(data.plan);
    setMsg("Profile updated. Targets were recalculated from your stats.");
  }

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">Settings</div>
          <h1>Profile</h1>
        </div>
        <button className="btn secondary" onClick={logout}>Sign out</button>
      </header>
      <form onSubmit={save}>
        <div className="field"><label>Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="grid-2">
          <div className="field"><label>Age</label><input type="number" value={form.age} onChange={(e) => set("age", Number(e.target.value))} /></div>
          <div className="field"><label>Sex</label>
            <select value={form.sex} onChange={(e) => set("sex", e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Height (cm)</label><input type="number" value={form.heightCm} onChange={(e) => set("heightCm", Number(e.target.value))} /></div>
          <div className="field"><label>Current weight (kg)</label><input type="number" step="0.1" value={form.currentWeightKg} onChange={(e) => set("currentWeightKg", Number(e.target.value))} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Target weight (kg)</label><input type="number" step="0.1" value={form.targetWeightKg} onChange={(e) => set("targetWeightKg", Number(e.target.value))} /></div>
          <div className="field"><label>Target date</label><input type="date" value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} /></div>
        </div>
        <div className="field"><label>Activity</label>
          <select value={form.activityLevel} onChange={(e) => set("activityLevel", e.target.value)}>
            {ACTIVITY.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div className="field"><label>Step target</label><input type="number" value={form.stepTarget} onChange={(e) => set("stepTarget", Number(e.target.value))} /></div>
        <button className="btn block">Recalculate targets</button>
      </form>
      {msg && <p className="note" style={{ marginTop: 12 }}>{msg}</p>}
      <div className="plan-box" style={{ marginTop: 16 }}>
        <div><span className="tiny">BMI</span><b>{p.bmi}</b></div>
        <div><span className="tiny">BMR</span><b>{p.bmr}</b></div>
        <div><span className="tiny">TDEE</span><b>{p.tdee}</b></div>
        <div><span className="tiny">Calories</span><b>{p.calorieTarget}</b></div>
        <div><span className="tiny">Protein</span><b>{p.proteinTarget}g</b></div>
        <div><span className="tiny">Carbs</span><b>{p.carbTarget}g</b></div>
        <div><span className="tiny">Fat</span><b>{p.fatTarget}g</b></div>
        <div><span className="tiny">Fiber</span><b>{p.fiberTarget}g</b></div>
      </div>
      <p className="est">{p.estimatesNote}</p>
      {plan && <p className="tiny">Latest plan note: {plan.note}</p>}
    </Shell>
  );
}
