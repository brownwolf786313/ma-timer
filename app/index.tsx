import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, NativeModules, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

type Usage = {
  packageName: string;
  appName: string;
  minutes: number;
};

const { MaTimerUsage } = NativeModules;

const demo: Usage[] = [
  { packageName: "youtube", appName: "YouTube", minutes: 108 },
  { packageName: "instagram", appName: "Instagram", minutes: 72 },
  { packageName: "whatsapp", appName: "WhatsApp", minutes: 36 },
  { packageName: "chrome", appName: "Chrome", minutes: 22 }
];

const formatMinutes = (m: number) => Math.floor(m / 60) + "h " + (m % 60) + "m";

export default function Index() {
  const [tab, setTab] = useState("Home");
  const [apps, setApps] = useState<Usage[]>(demo);
  const [granted, setGranted] = useState(false);
  const [seconds, setSeconds] = useState(1500);
  const [running, setRunning] = useState(false);

  const total = useMemo(() => apps.reduce((sum, item) => sum + item.minutes, 0), [apps]);

  useEffect(() => {
    let alive = true;

    const loadUsage = async () => {
      if (!MaTimerUsage?.hasUsageAccess) return;
      try {
        const ok = await MaTimerUsage.hasUsageAccess();
        if (!alive) return;
        setGranted(Boolean(ok));
        if (ok && MaTimerUsage.getTodayUsage) {
          const data = await MaTimerUsage.getTodayUsage();
          if (alive && Array.isArray(data)) {
            const sorted = data
              .filter((x: Usage) => x && typeof x.minutes === "number")
              .sort((a: Usage, b: Usage) => b.minutes - a.minutes);
            if (sorted.length) setApps(sorted.slice(0, 8));
          }
        }
      } catch {
        if (alive) setGranted(false);
      }
    };

    loadUsage();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          clearInterval(id);
          setRunning(false);
          Alert.alert("Focus complete", "Your focus session is finished.");
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running]);

  const openUsageSettings = async () => {
    try {
      if (MaTimerUsage?.openUsageAccessSettings) {
        await MaTimerUsage.openUsageAccessSettings();
      } else {
        await Linking.openSettings();
      }
    } catch {
      Alert.alert("Usage Access", "Open Android Settings and enable Usage Access for Ma Timer.");
    }
  };

  const timer = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");

  const home = (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Ma <Text style={styles.green}>Timer</Text></Text>
          <Text style={styles.muted}>Screen time & focus</Text>
        </View>
        <Text style={styles.phone}>◷</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroText}>if you uninstall this nothing going to change</Text>
      </View>

      {!granted && (
        <Pressable style={styles.permission} onPress={openUsageSettings}>
          <Text style={styles.white}>Enable real app usage</Text>
          <Text style={styles.muted}>Allow Usage Access to read today's Android screen-time.</Text>
          <Text style={styles.green}>OPEN SETTINGS →</Text>
        </Pressable>
      )}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.muted}>Today's Usage</Text>
          <Text style={styles.value}>{formatMinutes(total)}</Text>
          <Text style={styles.green}>{granted ? "Live data" : "Demo data"}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.muted}>Daily Target</Text>
          <Text style={styles.value}>3h 0m</Text>
          <Text style={styles.green}>{Math.min(100, Math.round((total / 180) * 100))}%</Text>
        </View>
      </View>

      <Text style={styles.section}>Top Apps</Text>
      <View style={styles.card}>
        {apps.slice(0, 4).map((item, index) => (
          <View style={styles.row} key={item.packageName || String(index)}>
            <Text style={styles.icon}>{["▶", "◎", "◉", "⌕"][index]}</Text>
            <Text style={styles.app}>{item.appName}</Text>
            <Text style={styles.time}>{formatMinutes(item.minutes)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quote}>
        <Text style={styles.white}>◈ Less phone, more life.</Text>
        <Text style={styles.muted}>You can do better!</Text>
      </View>
    </ScrollView>
  );

  const appsPage = (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Apps</Text>
      <View style={styles.card}>
        {apps.map((item) => (
          <View style={styles.row} key={item.packageName}>
            <Text style={styles.icon}>◉</Text>
            <Text style={styles.app}>{item.appName}</Text>
            <Text style={styles.time}>{formatMinutes(item.minutes)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const timerPage = (
    <ScrollView contentContainerStyle={styles.center}>
      <Text style={styles.title}>Focus Timer</Text>
      <View style={styles.ring}>
        <Text style={styles.timer}>{timer}</Text>
        <Text style={styles.muted}>Focus Time</Text>
      </View>
      <Pressable style={styles.start} onPress={() => setRunning(!running)}>
        <Text style={styles.startText}>{running ? "Pause" : "Start"}</Text>
      </Pressable>
      <View style={styles.choices}>
        {[25, 45, 60].map((minutes) => (
          <Pressable
            key={minutes}
            style={styles.choice}
            onPress={() => {
              setRunning(false);
              setSeconds(minutes * 60);
            }}
          >
            <Text style={styles.white}>{minutes} min</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const trendPage = (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Trend</Text>
      <View style={styles.card}>
        <Text style={styles.muted}>Screen Time Today</Text>
        <Text style={styles.big}>{formatMinutes(total)}</Text>
        <Text style={styles.green}>Live from Android Usage Access</Text>
      </View>
    </ScrollView>
  );

  const settingsPage = (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Pressable style={styles.setting} onPress={openUsageSettings}>
        <Text style={styles.white}>App Usage</Text>
        <Text style={styles.muted}>›</Text>
      </Pressable>
      <View style={styles.hero}>
        <Text style={styles.heroText}>if you uninstall this nothing going to change</Text>
      </View>
      <Text style={styles.muted}>Ma Timer 1.0.0</Text>
    </ScrollView>
  );

  const page =
    tab === "Home" ? home :
    tab === "Apps" ? appsPage :
    tab === "Timer" ? timerPage :
    tab === "Trend" ? trendPage :
    settingsPage;

  return (
    <SafeAreaView style={styles.safe}>
      {page}
      <View style={styles.nav}>
        {["Home", "Apps", "Timer", "Trend", "More"].map((item) => (
          <Pressable key={item} style={styles.navItem} onPress={() => setTab(item)}>
            <Text style={[styles.navText, tab === item && styles.green]}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020a12" },
  content: { padding: 18, paddingBottom: 90 },
  center: { flex: 1, alignItems: "center", padding: 18, paddingBottom: 90 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  brand: { fontSize: 25, fontWeight: "800", color: "#fff" },
  green: { color: "#18e0ab" },
  muted: { color: "#91a3af", marginTop: 4 },
  phone: { fontSize: 28, color: "#18e0ab" },
  hero: { backgroundColor: "#063b3c", borderRadius: 22, padding: 24, alignItems: "center", marginBottom: 14 },
  heroText: { fontSize: 21, fontWeight: "800", textAlign: "center", color: "#fff", lineHeight: 28 },
  permission: { backgroundColor: "#09222b", borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#116c6b" },
  white: { color: "#fff", fontWeight: "700" },
  stats: { flexDirection: "row", gap: 10, marginBottom: 20 },
  stat: { flex: 1, backgroundColor: "#071725", borderRadius: 15, padding: 14 },
  value: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 8 },
  section: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 10 },
  card: { backgroundColor: "#061521", borderRadius: 16, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: "#102b3b" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#10232f" },
  icon: { width: 30, color: "#18e0ab", fontSize: 18 },
  app: { flex: 1, color: "#e9f0f4" },
  time: { color: "#b9c6ce" },
  quote: { backgroundColor: "#063537", borderRadius: 16, padding: 18, marginTop: 2 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 18 },
  ring: { width: 250, height: 250, borderRadius: 125, borderWidth: 18, borderColor: "#18e0ab", alignItems: "center", justifyContent: "center", marginTop: 25 },
  timer: { fontSize: 44, fontWeight: "800", color: "#fff" },
  start: { marginTop: 30, width: "90%", backgroundColor: "#18e0ab", borderRadius: 30, padding: 18, alignItems: "center" },
  startText: { fontSize: 18, fontWeight: "900", color: "#00130f" },
  choices: { flexDirection: "row", gap: 10, marginTop: 22 },
  choice: { borderWidth: 1, borderColor: "#1d3b4f", borderRadius: 15, padding: 16 },
  big: { fontSize: 34, fontWeight: "900", color: "#fff", marginVertical: 8 },
  setting: { flexDirection: "row", justifyContent: "space-between", padding: 18, borderBottomWidth: 1, borderBottomColor: "#112533" },
  nav: { position: "absolute", left: 0, right: 0, bottom: 0, height: 64, backgroundColor: "#04111b", borderTopWidth: 1, borderTopColor: "#123040", flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  navItem: { padding: 8 },
  navText: { color: "#91a3af", fontSize: 12 }
});
