import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./AppContext";
import Setup, { Login } from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import FoodPage, { AddFood, MealDetail } from "./pages/Food";
import WorkoutHome, { ExerciseDetail, WorkoutSession, WorkoutSummary } from "./pages/Workout";
import WorkoutUpload from "./pages/WorkoutUpload";
import Weekly, { DailySummary, Journey, Nutrients, Timeline, WeeklyWorkouts } from "./pages/Progress";
import Profile from "./pages/Profile";

function Guard({ children }) {
  const ctx = useApp();
  if (!ctx) return <div className="auth"><p>Loading…</p></div>;
  if (ctx.boot) return <div className="auth"><p>Loading…</p></div>;
  if (!ctx.user) return <Navigate to="/setup" replace />;
  return children;
}

export default function App() {
  const ctx = useApp();
  if (!ctx || ctx.boot) return <div className="auth"><p>Loading Biryani2Broccoli…</p></div>;
  const { user } = ctx;

  return (
    <Routes>
      <Route path="/setup" element={user ? <Navigate to="/" /> : <Setup />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<Guard><Dashboard /></Guard>} />
      <Route path="/food" element={<Guard><FoodPage /></Guard>} />
      <Route path="/food/add" element={<Guard><AddFood /></Guard>} />
      <Route path="/meals/:slot" element={<Guard><MealDetail /></Guard>} />
      <Route path="/workout" element={<Guard><WorkoutHome /></Guard>} />
      <Route path="/workout/upload" element={<Guard><WorkoutUpload /></Guard>} />
      <Route path="/workout/exercise/:id" element={<Guard><ExerciseDetail /></Guard>} />
      <Route path="/workout/session/:id" element={<Guard><WorkoutSession /></Guard>} />
      <Route path="/workout/summary/:id" element={<Guard><WorkoutSummary /></Guard>} />
      <Route path="/progress" element={<Guard><Weekly /></Guard>} />
      <Route path="/progress/journey" element={<Guard><Journey /></Guard>} />
      <Route path="/progress/workouts" element={<Guard><WeeklyWorkouts /></Guard>} />
      <Route path="/progress/timeline" element={<Guard><Timeline /></Guard>} />
      <Route path="/progress/nutrients" element={<Guard><Nutrients /></Guard>} />
      <Route path="/summary" element={<Guard><DailySummary /></Guard>} />
      <Route path="/profile" element={<Guard><Profile /></Guard>} />
    </Routes>
  );
}
