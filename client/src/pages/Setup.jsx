import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import { ACTIVITY } from "../lib";

const empty = {
  name: "",
  email: "",
  password: "",
  age: 28,
  sex: "male",
  heightCm: 170,
  currentWeightKg: 78,
  targetWeightKg: 70,
  targetDate: "",
  activityLevel: "light",
  stepTarget: 8000,
};

export default function Setup() {
  const nav = useNavigate();
  const { register, startDemo } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return { ...empty, targetDate: d.toISOString().slice(0, 10) };
  });
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const validStep = useMemo(() => {
    if (step === 0) return form.name && form.email && form.password.length >= 6;
    if (step === 1) return form.age >= 16 && form.heightCm >= 120 && form.currentWeightKg >= 35;
    if (step === 2) return form.targetWeightKg >= 35 && form.targetDate;
    return true;
  }, [form, step]);

  useEffect(() => {
    if (step !== 3) return;
    api.preview(form).then((d) => setPlan(d.plan)).catch(() => setPlan(null));
  }, [step, form]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        profile: form,
      });
      nav("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 8 }}>
          <div className="brand-mark">B</div>
          <div>
            <strong>Biryani2Broccoli</strong>
            <small>Weight loss, without the crash diet</small>
          </div>
        </div>
        <h1>{["Create your space", "Your body stats", "Your goal", "Estimated targets"][step]}</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          {[
            "A few details so calorie and protein targets can be calculated for you.",
            "Used for BMI, BMR and TDEE estimates — not medical advice.",
            "Weekly pace is calculated from your current weight, goal weight, and target date.",
            "These numbers are estimates. You can edit them later in Profile.",
          ][step]}
        </p>
        <div className="steps">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
        {error && <div className="error">{error}</div>}

        {step === 0 && (
          <>
            <div className="field"><label>Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></div>
            <div className="field"><label>Password</label><input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" /></div>
          </>
        )}
        {step === 1 && (
          <>
            <div className="grid-2">
              <div className="field"><label>Age</label><input type="number" value={form.age} onChange={(e) => set("age", Number(e.target.value))} /></div>
              <div className="field">
                <label>Sex</label>
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
          </>
        )}
        {step === 2 && (
          <>
            <div className="grid-2">
              <div className="field"><label>Target weight (kg)</label><input type="number" step="0.1" value={form.targetWeightKg} onChange={(e) => set("targetWeightKg", Number(e.target.value))} /></div>
              <div className="field"><label>Target date</label><input type="date" value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} /></div>
            </div>
            <div className="field"><label>Activity level</label>
              <select value={form.activityLevel} onChange={(e) => set("activityLevel", e.target.value)}>
                {ACTIVITY.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.hint}</option>)}
              </select>
            </div>
            <div className="field"><label>Daily step target (optional)</label><input type="number" value={form.stepTarget} onChange={(e) => set("stepTarget", Number(e.target.value))} /></div>
          </>
        )}
        {step === 3 && plan && (
          <>
            <div className="plan-box">
              <div><span className="tiny">BMI</span><b>{plan.bmi}</b></div>
              <div><span className="tiny">BMR</span><b>{plan.bmr} kcal</b></div>
              <div><span className="tiny">TDEE</span><b>{plan.tdee} kcal</b></div>
              <div><span className="tiny">Activity</span><b>{plan.activityLabel}</b></div>
              <div><span className="tiny">Daily food max</span><b>{plan.calorieTarget} kcal</b></div>
              <div><span className="tiny">Protein</span><b>{plan.proteinTarget} g</b></div>
              <div><span className="tiny">Carbs</span><b>{plan.carbTarget} g</b></div>
              <div><span className="tiny">Fat</span><b>{plan.fatTarget} g</b></div>
              <div><span className="tiny">Fiber</span><b>{plan.fiberTarget} g</b></div>
            </div>
            <p className="note">{plan.note}</p>
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {step > 0 && <button className="btn secondary" onClick={() => setStep(step - 1)}>Back</button>}
          {step < 3 && <button className="btn lg" style={{ flex: 1 }} disabled={!validStep} onClick={() => setStep(step + 1)}>Continue</button>}
          {step === 3 && <button className="btn lg" style={{ flex: 1 }} disabled={busy} onClick={submit}>{busy ? "Saving…" : "Start tracking"}</button>}
        </div>
        <p className="tiny" style={{ marginTop: 16, textAlign: "center" }}>
          Already set up? <Link to="/login">Sign in</Link>
        </p>
        <button
          type="button"
          className="btn secondary block"
          style={{ marginTop: 10 }}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await startDemo();
              nav("/");
            } catch (err) {
              setError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Explore with sample breakfast
        </button>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login({ email, password });
      nav("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand">
          <div className="brand-mark">B</div>
          <div><strong>Biryani2Broccoli</strong><small>Welcome back</small></div>
        </div>
        <h1>Sign in</h1>
        {error && <div className="error">{error}</div>}
        <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <button className="btn block lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="tiny" style={{ marginTop: 16, textAlign: "center" }}>New here? <Link to="/setup">Create a profile</Link></p>
      </form>
    </div>
  );
}
