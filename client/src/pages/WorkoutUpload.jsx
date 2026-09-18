import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import { Shell } from "../components";
import { formatActiveKcal, formatNum, formatSetScheme, todayKey } from "../lib";

const TEMPLATE = `workout,exercise,mode,sets,reps,weight,unit,equipment,date,duration_min,distance_km,notes
Push day,Barbell Bench Press,strength,3,10,60,kg,barbell,${todayKey()},,,
Push day,Lat Pulldown,strength,3,12,40,kg,machine,${todayKey()},,,
Push day,Treadmill,cardio,1,,,,machine,${todayKey()},20,3.5,`;

const ALIAS = {
  workout: ["workout", "workout_name", "session", "title"],
  exercise: ["exercise", "exercise_name", "name", "movement"],
  mode: ["mode", "kind", "type"],
  sets: ["sets", "set"],
  reps: ["reps", "rep"],
  weight: ["weight", "load"],
  unit: ["unit"],
  equipment: ["equipment", "equipment_used"],
  date: ["date"],
  duration_min: ["duration_min", "duration", "minutes", "min"],
  distance_km: ["distance_km", "distance"],
  speed_kmh: ["speed_kmh", "speed"],
  incline: ["incline"],
  notes: ["notes", "note"],
};

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseCsv(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"));
  if (lines.length < 2) return { rows: [], error: "Need a header row and at least one exercise row." };
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const indexFor = (field) => {
    const names = ALIAS[field] || [field];
    return headers.findIndex((h) => names.includes(h));
  };
  const map = {};
  for (const key of Object.keys(ALIAS)) map[key] = indexFor(key);
  if (map.exercise < 0) return { rows: [], error: "CSV needs an exercise column." };
  const rows = lines.slice(1).map((line, i) => {
    const cols = splitCsvLine(line);
    const pick = (field) => (map[field] >= 0 ? cols[map[field]] || "" : "");
    return {
      line: i + 2,
      workout: pick("workout"),
      exercise: pick("exercise"),
      mode: pick("mode"),
      sets: pick("sets"),
      reps: pick("reps"),
      weight: pick("weight"),
      unit: pick("unit"),
      equipment: pick("equipment"),
      date: pick("date"),
      duration_min: pick("duration_min"),
      distance_km: pick("distance_km"),
      speed_kmh: pick("speed_kmh"),
      incline: pick("incline"),
      notes: pick("notes"),
    };
  });
  return { rows, error: "" };
}

export default function WorkoutUpload() {
  const { date, setDay, refreshDay } = useApp();
  const nav = useNavigate();
  const [text, setText] = useState(TEMPLATE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const parsed = useMemo(() => parseCsv(text), [text]);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workout-upload.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function importRows() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      if (parsed.error) throw new Error(parsed.error);
      const data = await api.bulkWorkouts({ date, rows: parsed.rows });
      if (data.day) setDay(data.day);
      else await refreshDay(date);
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not import workouts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <header className="page-head">
        <div>
          <div className="greet">Training</div>
          <h1>Bulk upload</h1>
        </div>
        <button className="btn compact secondary" type="button" onClick={() => nav("/workout")}>Back</button>
      </header>

      <div className="card">
        <h3>CSV columns</h3>
        <p className="tiny">One row per exercise. Same workout name + date become one session. Mode is strength or cardio.</p>
        <p className="tiny">Needed: exercise, sets, reps. Also useful: workout, mode, weight, unit, equipment, date, duration_min, distance_km, notes.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn secondary" type="button" onClick={downloadTemplate}>Download template</button>
          <label className="btn ghost" style={{ margin: 0 }}>
            Choose CSV
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      <div className="field">
        <label>Paste CSV</label>
        <textarea className="csv-paste" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </div>

      {parsed.error && <p className="error">{parsed.error}</p>}
      {!parsed.error && (
        <p className="tiny">{parsed.rows.length} exercise row{parsed.rows.length === 1 ? "" : "s"} ready.</p>
      )}

      <div className="list-card csv-preview">
        {parsed.rows.slice(0, 12).map((row) => (
          <div className="food-row" key={row.line} style={{ cursor: "default" }}>
            <div>
              <b>{row.exercise || "Missing exercise"}</b>
              <span className="tiny">
                {row.workout || "Gym session"} · {row.mode || "strength"} · {formatSetScheme(
                  Array.from({ length: Math.max(1, Number(row.sets) || 3) }, () => ({
                    reps: Number(row.reps) || 0,
                    weight: Number(row.weight) || 0,
                    unit: row.unit || "kg",
                    durationMin: Number(row.duration_min) || 0,
                    distanceKm: Number(row.distance_km) || 0,
                  })),
                  row.mode === "cardio" ? "cardio" : "strength",
                  row.equipment
                )}
              </span>
            </div>
            <span className="tiny">{row.date || date}</span>
          </div>
        ))}
      </div>
      {parsed.rows.length > 12 && <p className="tiny">Showing first 12 rows.</p>}

      {error && <p className="error">{error}</p>}
      {result && (
        <div className="note">
          Imported {result.imported} workout{result.imported === 1 ? "" : "s"}.
          {result.workouts?.map((w) => (
            <p key={w.id} className="tiny" style={{ marginTop: 6 }}>
              {w.date} · {w.title} · {w.exercises} exercises · {formatActiveKcal(w.calories)} active kcal
              {w.unmatched?.length ? ` · unmatched: ${w.unmatched.join(", ")}` : ""}
            </p>
          ))}
          {result.errors?.length > 0 && (
            <p className="tiny" style={{ marginTop: 6 }}>Skipped {result.errors.length} row(s) with missing names.</p>
          )}
        </div>
      )}

      <button className="btn block lg" type="button" disabled={busy || !!parsed.error || !parsed.rows.length} onClick={importRows}>
        {busy ? "Importing…" : "Import workouts"}
      </button>
      <p className="est">Active calories are estimates from your body weight, workout duration and intensity. Unmatched names are still logged as custom exercises.</p>
    </Shell>
  );
}
