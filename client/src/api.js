const TOKEN_KEY = "b2b_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  preview: (profile) => request("/auth/preview", { method: "POST", body: JSON.stringify(profile) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  demo: () => request("/auth/demo", { method: "POST", body: "{}" }),
  me: () => request("/me"),
  updateProfile: (payload) => request("/profile", { method: "PUT", body: JSON.stringify(payload) }),
  foods: (params = "") => request(`/foods${params}`),
  createFood: (payload) => request("/foods", { method: "POST", body: JSON.stringify(payload) }),
  scale: (payload) => request("/foods/scale", { method: "POST", body: JSON.stringify(payload) }),
  day: (date) => request(`/day/${date}`),
  addFood: (slot, payload) => request(`/meals/${slot}/items`, { method: "POST", body: JSON.stringify(payload) }),
  editFood: (slot, itemId, payload) => request(`/meals/${slot}/items/${itemId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteFood: (slot, itemId, date) => request(`/meals/${slot}/items/${itemId}?date=${date}`, { method: "DELETE" }),
  duplicateFood: (slot, itemId, date) => request(`/meals/${slot}/items/${itemId}/duplicate`, { method: "POST", body: JSON.stringify({ date }) }),
  exercises: (params = "") => request(`/exercises${params}`),
  exercise: (id) => request(`/exercises/${id}`),
  workouts: (date) => request(`/workouts${date ? `?date=${date}` : ""}`),
  createWorkout: (payload) => request("/workouts", { method: "POST", body: JSON.stringify(payload) }),
  addExercise: (id, payload) => request(`/workouts/${id}/exercises`, { method: "POST", body: JSON.stringify(payload) }),
  saveWorkout: (id, payload) => request(`/workouts/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteWorkout: (id) => request(`/workouts/${id}`, { method: "DELETE" }),
  setSteps: (date, steps) => request(`/steps/${date}`, { method: "PUT", body: JSON.stringify({ steps }) }),
  weight: () => request("/weight"),
  saveWeight: (date, payload) => request(`/weight/${date}`, { method: "PUT", body: JSON.stringify(payload) }),
  week: (weekStart) => request(`/week/${weekStart}`),
  journey: () => request("/journey"),
  timeline: (date) => request(`/timeline/${date}`),
  nutrients: (date) => request(`/nutrients/${date}`),
};
