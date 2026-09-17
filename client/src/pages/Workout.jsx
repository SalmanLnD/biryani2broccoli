import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import { Icon, Shell } from "../components";
import { ExercisePoses } from "../ExercisePoses";
import { EQUIPMENT, formatNum, MUSCLES } from "../lib";

function walkKcal(steps, weightKg) {
  const w = Number(weightKg) || 70;
  return Math.round(Math.max(0, Number(steps) || 0) * 0.04 * (w / 70));
}

export default function WorkoutHome() {
  const { date, day, user, setDay } = useApp();
  const nav = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [exercises, setExercises] = useState([]);
  const [steps, setSteps] = useState(day?.steps?.steps || 0);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [stepError, setStepError] = useState("");

  useEffect(() => {
    api.workouts(date).then((d) => setWorkouts(d.workouts));
  }, [date]);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (muscle !== "all") qs.set("muscle", muscle);
      api.exercises(`?${qs}`).then((d) => setExercises(d.exercises));
    }, 150);
    return () => clearTimeout(t);
  }, [q, muscle]);
  useEffect(() => setSteps(day?.steps?.steps || 0), [day]);

  async function start(title) {
    const data = await api.createWorkout({ date, title });
    nav(`/workout/session/${data.workout._id}`);
  }

  async function saveSteps(e) {
    e?.preventDefault();
    setBusy(true);
    setSaved("");
    setStepError("");
    try {
      const count = Math.max(0, Math.round(Number(steps) || 0));
      const data = await api.setSteps(date, count);
      if (data.day) setDay(data.day);
      setSteps(data.steps?.steps ?? count);
      setSaved(`Saved ${Number(data.steps?.steps || count).toLocaleString()} steps. About ${formatNum(data.steps?.calories || 0)} kcal burned — that increases the deficit, not the food max.`);
    } catch (err) {
      setStepError(err.message || "Could not save steps.");
    } finally {
      setBusy(false);
    }
  }

  const open = workouts.find((w) => w.status === "in_progress");

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">Training</div>
          <h1>Workout</h1>
        </div>
        {open ? (
          <div className="head-actions">
            <button className="btn compact secondary" type="button" onClick={() => nav("/workout/upload")}>Upload</button>
            <button className="btn compact" onClick={() => nav(`/workout/session/${open._id}`)}>Resume</button>
          </div>
        ) : (
          <div className="head-actions">
            <button className="btn compact secondary" type="button" onClick={() => nav("/workout/upload")}>Upload</button>
            <button className="btn compact" onClick={() => start("Gym session")}>
              <span className="btn-short">Start</span>
              <span className="btn-full">Start workout</span>
            </button>
          </div>
        )}
      </header>

      <form className="card" onSubmit={saveSteps}>
        <h3>Steps</h3>
        <p className="tiny">Walking calories count as energy burned. They increase today's deficit and do not raise the food maximum. Estimate only.</p>
        <div className="qty">
          <button type="button" onClick={() => setSteps(Math.max(0, Number(steps) - 500))}>−</button>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="100000"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            aria-label="Today's steps"
          />
          <button type="button" onClick={() => setSteps(Number(steps) + 500)}>+</button>
        </div>
        <p className="tiny">~{formatNum(walkKcal(steps, user?.profile?.currentWeightKg))} kcal from these steps</p>
        {stepError && <p className="error">{stepError}</p>}
        {saved && <p className="note">{saved}</p>}
        <button className="btn block" type="submit" disabled={busy}>{busy ? "Saving…" : "Save steps"}</button>
      </form>

      {workouts.filter((w) => w.status === "completed").map((w) => (
        <button key={w._id} className="food-row" onClick={() => nav(`/workout/summary/${w._id}`)}>
          <div>
            <b>{w.title}</b>
            <span className="tiny">{w.durationMin || 0} min · {w.exercises.length} exercises</span>
          </div>
          <b>{formatNum(w.calories)} kcal</b>
        </button>
      ))}

      <div className="section-head"><h2>Exercise library</h2></div>
      <div className="search">
        <Icon name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bench press, squat, treadmill…" />
      </div>
      <div className="chips">
        {MUSCLES.map((m) => (
          <button key={m} className={`chip ${muscle === m ? "on" : ""}`} onClick={() => setMuscle(m)}>{m}</button>
        ))}
      </div>
      <div className="list-card">
        {exercises.map((ex) => (
          <button key={ex._id} className="ex-row" onClick={() => nav(`/workout/exercise/${ex._id}`)}>
            <div>
              <b>{ex.name}</b>
              <span className="tiny">{ex.muscleGroup} · {ex.difficulty} · {ex.kind}</span>
            </div>
            <span className="tiny">Open</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

export function ExerciseDetail() {
  const { id } = useParams();
  const { date } = useApp();
  const nav = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.exercise(id).then((d) => {
      setExercise(d.exercise);
      setHistory(d.history || []);
    });
  }, [id]);

  if (!exercise) return <Shell><p>Loading…</p></Shell>;

  async function addToWorkout() {
    const open = (await api.workouts(date)).workouts.find((w) => w.status === "in_progress");
    const workout = open || (await api.createWorkout({ date, title: `${exercise.muscleGroup} session` })).workout;
    await api.addExercise(workout._id, { exerciseId: exercise._id });
    nav(`/workout/session/${workout._id}`);
  }

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">{exercise.muscleGroup}</div>
          <h1>{exercise.name}</h1>
          <p className="tiny">{exercise.difficulty} · {exercise.equipment.join(", ")}</p>
        </div>
      </header>
      <ExercisePoses pose={exercise.pose} />
      <div className="card">
        <h3>How to do it</h3>
        <ol>{exercise.instructions.map((line) => <li key={line}>{line}</li>)}</ol>
      </div>
      {history.length > 0 && (
        <div className="card">
          <h3>Previous sessions</h3>
          {history.slice(0, 4).map((w) => (
            <p key={w._id} className="insight">{w.date} · {w.title} · {formatNum(w.calories)} kcal</p>
          ))}
        </div>
      )}
      <button className="btn block lg" onClick={addToWorkout}>Log this exercise</button>
    </Shell>
  );
}

export function WorkoutSession() {
  const { id } = useParams();
  const nav = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [saveError, setSaveError] = useState("");

  async function load() {
    const all = await api.workouts();
    const w = all.workouts.find((x) => x._id === id);
    setWorkout(w);
    setTitle(w?.title || "");
  }
  useEffect(() => { load(); }, [id]);

  function updateSet(ei, si, key, val) {
    const next = structuredClone(workout);
    next.exercises[ei].sets[si][key] = val;
    setWorkout(next);
  }
  function addSet(ei) {
    const next = structuredClone(workout);
    const kind = next.exercises[ei].kind;
    next.exercises[ei].sets.push(kind === "cardio" ? { durationMin: 10, calories: 0 } : { reps: 10, weight: 20, unit: "kg" });
    setWorkout(next);
  }
  function removeSet(ei, si) {
    const next = structuredClone(workout);
    if (next.exercises[ei].sets.length <= 1) return;
    next.exercises[ei].sets.splice(si, 1);
    setWorkout(next);
  }
  function removeExercise(ei) {
    const next = structuredClone(workout);
    next.exercises.splice(ei, 1);
    setWorkout(next);
  }
  async function persist(extra = {}) {
    setSaveError("");
    setSaved("");
    setBusy(true);
    try {
      const data = await api.saveWorkout(id, {
        title,
        exercises: workout.exercises,
        notes: workout.notes,
        ...extra,
      });
      setWorkout(data.workout);
      if (!extra.status) setSaved("Session saved.");
      return data;
    } catch (err) {
      setSaveError(err.message || "Could not save the session.");
      throw err;
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    try {
      const data = await persist({ status: "completed" });
      nav(`/workout/summary/${data.workout._id}`);
    } catch {
      /* error shown on the session */
    }
  }

  if (!workout) return <Shell><p>Loading session…</p></Shell>;

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">In progress</div>
          <h1>Session</h1>
        </div>
        <button className="btn compact" type="button" disabled={busy} onClick={finish}>Finish</button>
      </header>
      <div className="field"><label>Workout name</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      {workout.exercises.map((block, ei) => (
        <div className="card" key={block._id || ei}>
          <div className="meal-head">
            <div>
              <h3>{block.name}</h3>
              <p className="tiny">{block.muscleGroup}</p>
            </div>
            <button className="btn ghost compact" type="button" onClick={() => removeExercise(ei)}>Remove</button>
          </div>
          {block.kind !== "cardio" && (
            <div className="field"><label>Equipment</label>
              <select value={block.equipmentUsed} onChange={(e) => {
                const next = structuredClone(workout);
                next.exercises[ei].equipmentUsed = e.target.value;
                setWorkout(next);
              }}>
                {EQUIPMENT.map((eq) => <option key={eq} value={eq}>{eq.replace("_", " ")}</option>)}
              </select>
            </div>
          )}
          {block.kind === "cardio"
            ? block.sets.map((s, si) => (
              <div key={si} className="grid-2" style={{ marginBottom: 8 }}>
                <div className="field"><label>Duration min</label><input type="number" value={s.durationMin || ""} onChange={(e) => updateSet(ei, si, "durationMin", Number(e.target.value))} /></div>
                <div className="field"><label>Distance km</label><input type="number" step="0.1" value={s.distanceKm || ""} onChange={(e) => updateSet(ei, si, "distanceKm", Number(e.target.value))} /></div>
                <div className="field"><label>Speed km/h</label><input type="number" step="0.1" value={s.speedKmh || ""} onChange={(e) => updateSet(ei, si, "speedKmh", Number(e.target.value))} /></div>
                <div className="field"><label>Incline</label><input type="number" step="0.5" value={s.incline || ""} onChange={(e) => updateSet(ei, si, "incline", Number(e.target.value))} /></div>
                {block.sets.length > 1 && (
                  <button className="btn ghost" type="button" onClick={() => removeSet(ei, si)}>Remove set</button>
                )}
              </div>
            ))
            : block.sets.map((s, si) => (
              <div className="set-row" key={si}>
                <span className="tiny">S{si + 1}</span>
                <input type="number" placeholder="Reps" value={s.reps || ""} onChange={(e) => updateSet(ei, si, "reps", Number(e.target.value))} />
                {block.equipmentUsed !== "bodyweight" && (
                  <input type="number" placeholder="Weight" value={s.weight || ""} onChange={(e) => updateSet(ei, si, "weight", Number(e.target.value))} />
                )}
                {block.equipmentUsed !== "bodyweight" && (
                  <select value={s.unit || "kg"} onChange={(e) => updateSet(ei, si, "unit", e.target.value)}>
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                )}
                {block.sets.length > 1 ? (
                  <button className="set-del" type="button" aria-label={`Remove set ${si + 1}`} onClick={() => removeSet(ei, si)}>×</button>
                ) : <span />}
              </div>
            ))}
          <button className="btn ghost" type="button" onClick={() => addSet(ei)}>+ Set</button>
        </div>
      ))}
      {saveError && <p className="error">{saveError}</p>}
      {saved && <p className="note">{saved}</p>}
      <div className="session-actions">
        <button className="btn" type="button" disabled={busy} onClick={() => persist().catch(() => {})}>{busy ? "Saving…" : "Save"}</button>
        <button className="btn ghost" type="button" onClick={() => nav("/workout")}>Add exercise</button>
      </div>
    </Shell>
  );
}

export function WorkoutSummary() {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [prev, setPrev] = useState(null);

  useEffect(() => {
    api.workouts().then((d) => {
      const w = d.workouts.find((x) => x._id === id);
      setWorkout(w);
      const others = d.workouts.filter((x) => x.status === "completed" && x._id !== id);
      setPrev(others[0] || null);
    });
  }, [id]);

  if (!workout) return <Shell><p>Loading…</p></Shell>;
  const sets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);
  const reps = workout.exercises.reduce((s, e) => s + e.sets.reduce((a, x) => a + (x.reps || 0), 0), 0);
  const volume = workout.exercises.reduce((s, e) => s + e.sets.reduce((a, x) => a + (x.reps || 0) * (x.weight || 0), 0), 0);

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">Completed</div>
          <h1>{workout.title}</h1>
        </div>
      </header>
      <div className="kpi">
        <div><b>{workout.durationMin || 0} min</b><span>Duration</span></div>
        <div><b>{workout.exercises.length}</b><span>Exercises</span></div>
        <div><b>{sets}</b><span>Sets</span></div>
        <div><b>{formatNum(reps)}</b><span>Reps</span></div>
        <div><b>{formatNum(volume)} kg</b><span>Volume</span></div>
        <div><b>~{formatNum(workout.calories)}</b><span>kcal estimate</span></div>
      </div>
      {workout.personalRecords?.length > 0 && (
        <div className="card">
          <h3>Personal records</h3>
          {workout.personalRecords.map((p) => <p key={p} className="insight">{p}</p>)}
        </div>
      )}
      {prev && (
        <div className="card">
          <h3>Compared with previous</h3>
          <p className="insight">Last session {prev.date}: {prev.durationMin || 0} min, ~{formatNum(prev.calories)} kcal</p>
          <p className="tiny">Calories burned are estimates from duration, body weight and activity type.</p>
        </div>
      )}
      <div className="card">
        {workout.exercises.map((e) => (
          <p key={e._id || e.name} className="insight">{e.name} · {e.sets.length} sets</p>
        ))}
      </div>
    </Shell>
  );
}
