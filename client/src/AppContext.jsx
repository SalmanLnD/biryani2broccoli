import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";
import { todayKey } from "./lib";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [boot, setBoot] = useState(true);
  const [date, setDate] = useState(todayKey());
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMe() {
    if (!getToken()) {
      setBoot(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setBoot(false);
    }
  }

  async function refreshDay(nextDate = date) {
    if (!getToken()) return;
    setLoading(true);
    try {
      const data = await api.day(nextDate);
      setDay(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    if (user) refreshDay(date);
  }, [user, date]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      boot,
      date,
      setDate,
      day,
      setDay,
      loading,
      error,
      setError,
      refreshDay,
      async login(payload) {
        const data = await api.login(payload);
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      async register(payload) {
        const data = await api.register(payload);
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      async startDemo() {
        const data = await api.demo();
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      logout() {
        setToken(null);
        setUser(null);
        setDay(null);
      },
    }),
    [user, boot, date, day, loading, error]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
