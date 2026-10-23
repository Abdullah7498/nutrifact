import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chip, HelperText, Text, TextInput } from "react-native-paper";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MeasurementRuler from "../components/MeasurementRuler";
import { apiRequest } from "../services/auth";
import { useAuth } from "../context/AuthContext";

const ink = "#302820";
const accent = "#9A4B27";
const muted = "#74665E";
const pale = "#FFFCFA";
const line = "#E9DDD5";
const titles = ["Tell us about yourself", "Your body measurements", "What is your goal?", "How active are you?", "Your food preferences", "Your nutrition plan"];
const subtitles = [
  "A few details help us estimate your daily energy needs. Your name and email are already saved.",
  "Your height and current weight help set a practical starting point.",
  "We'll use your goal and target weight to choose a calorie direction.",
  "Think about a typical week, including work, walking, and exercise.",
  "Help us shape food guidance around the way you eat. This step is optional.",
  "Review these estimates and adjust your daily targets before saving.",
];
const activities = [["sedentary", "Sedentary", "Mostly sitting; little planned movement", "1.2×"], ["light", "Lightly active", "Light movement or exercise 1–2 days a week", "1.375×"], ["moderate", "Moderately active", "Regular movement or exercise 3–4 days a week", "1.55×"], ["active", "Active", "Exercise or physical work most days", "1.725×"], ["very_active", "Very active", "Demanding training or physical work", "1.9×"]];
const goals = [["lose", "Lose weight", "A moderate calorie deficit"], ["maintain", "Maintain weight", "Keep your current weight steady"], ["gain", "Gain weight", "A modest calorie surplus"], ["muscle", "Build muscle", "Adjust calories toward your weight target"], ["recomp", "Lose fat and build muscle", "Higher protein with a goal-aware calorie target"]];
const fieldStyle = { backgroundColor: pale, marginBottom: 12 };
const asNumber = (value) => Number(value.replace(",", "."));
function Panel({ children, style }) { return <View style={[{ backgroundColor: pale, borderRadius: 22, borderWidth: 1, borderColor: line, padding: 18, marginBottom: 14 }, style]}>{children}</View>; }
function Choice({ value, options, onChange, compact = false }) {
  return <View style={{ gap: 9, marginBottom: 12 }}>{options.map(([key, label, detail, badge]) => <Pressable key={key} onPress={() => onChange(key)} accessibilityRole="radio" accessibilityState={{ selected: value === key }} style={{ flexDirection: "row", alignItems: "center", padding: compact ? 13 : 16, backgroundColor: value === key ? "#F2E2D8" : pale, borderRadius: 17, borderWidth: 1.5, borderColor: value === key ? accent : line }}><View style={{ flex: 1 }}><Text style={{ color: ink, fontSize: compact ? 15 : 17, fontFamily: "Manrope_700Bold" }}>{label}</Text>{!!detail && <Text style={{ color: muted, marginTop: 3, lineHeight: 19 }}>{detail}</Text>}</View>{!!badge && <Text style={{ color: accent, fontFamily: "Manrope_700Bold", marginRight: 10 }}>{badge}</Text>}<MaterialCommunityIcons name={value === key ? "check-circle" : "circle-outline"} size={23} color={value === key ? accent : "#CBBDB4"} /></Pressable>)}</View>;
}
function Field({ label, value, onChangeText, keyboardType, multiline, hint }) { return <TextInput mode="outlined" label={label} value={value} onChangeText={onChangeText} keyboardType={keyboardType} multiline={multiline} style={fieldStyle} outlineColor="#DDCFC5" activeOutlineColor={accent} autoCapitalize="none" accessibilityHint={hint} />; }
function Tag({ label, selected, onPress }) { return <Chip selected={selected} onPress={onPress} showSelectedCheck style={{ backgroundColor: selected ? "#EED7C9" : "#F5EEEA", marginRight: 7, marginBottom: 8 }}>{label}</Chip>; }

export default function ProfileOnboarding({ edit = false }) {
  const { session, completeProfile, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [sex, setSex] = useState("unspecified");
  const [units, setUnits] = useState("metric");
  const [height, setHeight] = useState("");
  const [inches, setInches] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("maintain");
  const [target, setTarget] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [vegetarian, setVegetarian] = useState(false);
  const [vegan, setVegan] = useState(false);
  const [halal, setHalal] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [avoid, setAvoid] = useState("");
  const [other, setOther] = useState("");
  const [plan, setPlan] = useState(null);
  const [guidance, setGuidance] = useState([]);

  useEffect(() => {
    if (!edit) return;
    apiRequest("profile", { token: session.accessToken }).then(({ profile }) => {
      if (!profile) return;
      const [year, month, day] = profile.dateOfBirth.split("-");
      setBirthYear(year); setBirthMonth(String(Number(month))); setBirthDay(String(Number(day)));
      setSex(profile.sexForEstimate);
      setUnits(profile.units);
      const totalInches = Math.round(profile.heightCm / 2.54);
      setHeight(String(profile.units === "metric" ? profile.heightCm : Math.floor(totalInches / 12)));
      setInches(profile.units === "imperial" ? String(totalInches % 12) : "");
      setWeight(String(profile.units === "metric" ? profile.weightKg : Math.round(profile.weightKg * 2.20462262)));
      setGoal(profile.goal);
      setTarget(profile.targetWeightKg == null ? "" : String(profile.units === "metric" ? profile.targetWeightKg : Math.round(profile.targetWeightKg * 2.20462262)));
      setActivity(profile.activity);
      setVegetarian(profile.dietaryPreferences.vegetarian);
      setVegan(profile.dietaryPreferences.vegan);
      setHalal(profile.dietaryPreferences.halal);
      setAllergies(profile.dietaryPreferences.allergies);
      setAvoid(profile.dietaryPreferences.foodsToAvoid);
      setOther(profile.dietaryPreferences.other);
    }).catch((err) => setError(err.message));
  }, [edit, session.accessToken]);

  const dateOfBirth = () => `${birthYear.trim()}-${birthMonth.trim().padStart(2, "0")}-${birthDay.trim().padStart(2, "0")}`;
  const profile = () => ({
    dateOfBirth: dateOfBirth(), sexForEstimate: sex, units,
    heightCm: units === "metric" ? asNumber(height) : Math.round((asNumber(height) * 12 + asNumber(inches || "0")) * 2.54 * 10) / 10,
    weightKg: units === "metric" ? asNumber(weight) : Math.round(asNumber(weight) / 2.20462262 * 10) / 10,
    goal,
    targetWeightKg: target.trim() && goal !== "maintain" ? (units === "metric" ? asNumber(target) : Math.round(asNumber(target) / 2.20462262 * 10) / 10) : null,
    activity,
    dietaryPreferences: { vegetarian, vegan, halal, allergies: allergies.trim(), foodsToAvoid: avoid.trim(), other: other.trim() },
  });

  function validate() {
    if (step === 0) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth())) return "Enter a valid month, day, and year.";
      const born = new Date(`${dateOfBirth()}T00:00:00Z`);
      if (Number.isNaN(born.getTime()) || born.toISOString().slice(0, 10) !== dateOfBirth()) return "Enter a valid date of birth.";
      const age = (Date.now() - born.getTime()) / 31556952000;
      if (age < 18 || age > 120) return "This estimate is available for adults aged 18 or older.";
    }
    if (step === 1) {
      const p = profile();
      if (!Number.isFinite(p.heightCm) || p.heightCm < 100 || p.heightCm > 250) return "Enter a height between 100 and 250 cm (about 3 ft 3 in to 8 ft 2 in).";
      if (!Number.isFinite(p.weightKg) || p.weightKg < 30 || p.weightKg > 350) return "Enter a weight between 30 and 350 kg (66–772 lb).";
      if (units === "imperial" && (!Number.isFinite(asNumber(inches || "0")) || asNumber(inches || "0") < 0 || asNumber(inches || "0") >= 12)) return "Enter inches from 0 to 11.";
    }
    if (step === 2 && target.trim()) {
      const p = profile();
      if (!Number.isFinite(p.targetWeightKg) || p.targetWeightKg < 30 || p.targetWeightKg > 350) return "Enter a valid target weight.";
      if (goal === "lose" && p.targetWeightKg >= p.weightKg) return "Target weight must be below your current weight.";
      if (goal === "gain" && p.targetWeightKg <= p.weightKg) return "Target weight must be above your current weight.";
    }
    return "";
  }

  function adjustTarget(direction) {
    const increment = units === "metric" ? 0.5 : 1;
    const current = target.trim() ? asNumber(target) : asNumber(weight || (units === "metric" ? "70" : "154"));
    const minimum = units === "metric" ? 30 : 67;
    const maximum = units === "metric" ? 350 : 771;
    setTarget(String(Math.round(Math.max(minimum, Math.min(maximum, current + direction * increment)) * 10) / 10));
  }

  async function next() {
    const issue = validate();
    if (issue) return setError(issue);
    setError("");
    if (step < 4) return setStep(step + 1);
    if (step === 4) {
      setBusy(true);
      try {
        const result = await apiRequest("profile/estimate", { token: session.accessToken, body: profile() });
        setGuidance(result.guidance);
        setPlan(Object.fromEntries(Object.entries(result.plan).map(([key, value]) => [key, String(value)])));
        setStep(5);
      } catch (err) { setError(err.message); }
      finally { setBusy(false); }
      return;
    }
    const values = Object.fromEntries(Object.entries(plan).map(([key, value]) => [key, Number(value)]));
    if (Object.values(values).some((value) => !Number.isInteger(value) || value <= 0)) return setError("Enter whole numbers for every target.");
    setBusy(true);
    try {
      await apiRequest("profile", { token: session.accessToken, method: "PUT", body: { ...profile(), plan: values } });
      if (edit) router.back();
      else await completeProfile();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const macroEnergy = plan ? Number(plan.protein) * 4 + Number(plan.carbs) * 4 + Number(plan.fats) * 9 : 0;
  const planMacros = plan ? [["Protein", "protein", "#9A4B27", Number(plan.protein) * 4], ["Carbohydrates", "carbs", "#3F8B6B", Number(plan.carbs) * 4], ["Fats", "fats", "#78A7C4", Number(plan.fats) * 9]] : [];
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F3F2" }}>
    <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: line }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Pressable onPress={() => step === 0 ? (edit ? router.back() : signOut().catch((err) => setError(err.message))) : setStep(step - 1)} accessibilityRole="button" accessibilityLabel="Go back" style={{ padding: 3 }}><MaterialCommunityIcons name="arrow-left" size={25} color={ink} /></Pressable><Text style={{ flex: 1, color: ink, fontFamily: "Manrope_700Bold", fontSize: 16 }}>Set up your profile</Text><Text style={{ color: accent, fontFamily: "Manrope_700Bold" }}>{step + 1} / 6</Text></View>
      <View style={{ height: 5, borderRadius: 4, backgroundColor: "#E7DCD4", marginTop: 15 }}><View style={{ width: `${(step + 1) / 6 * 100}%`, height: 5, borderRadius: 4, backgroundColor: accent }} /></View>
    </View>
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 25, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: accent, fontFamily: "Manrope_700Bold", fontSize: 12, letterSpacing: 1 }}>STEP {step + 1} OF 6 · {titles[step].toUpperCase()}</Text>
      <Text accessibilityRole="header" style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 27, lineHeight: 34, marginTop: 9 }}>{titles[step]}</Text>
      <Text style={{ color: muted, lineHeight: 23, fontSize: 14, marginTop: 9, marginBottom: 25 }}>{subtitles[step]}</Text>
      {step === 0 && <>
        <Panel><Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 14 }}>Date of birth</Text><View style={{ flexDirection: "row", gap: 8 }}><View style={{ flex: 1 }}><Field label="Month" value={birthMonth} onChangeText={setBirthMonth} keyboardType="number-pad" /></View><View style={{ flex: 1 }}><Field label="Day" value={birthDay} onChangeText={setBirthDay} keyboardType="number-pad" /></View><View style={{ flex: 1.35 }}><Field label="Year" value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" /></View></View><Text style={{ color: muted, fontSize: 12 }}>Used to estimate your resting energy needs.</Text></Panel>
        <Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginTop: 12, marginBottom: 12 }}>Sex used for the estimate <Text style={{ color: muted, fontSize: 12 }}>(optional)</Text></Text>
        <Choice value={sex} onChange={setSex} options={[["female", "Female", "Uses the female equation"], ["male", "Male", "Uses the male equation"], ["unspecified", "Prefer not to say", "Uses a midpoint estimate"]]} />
        <Panel style={{ marginTop: 10, backgroundColor: "#F4EBE6" }}><Text style={{ color: muted, lineHeight: 21 }}>These details help calculate an estimate. You can review and change the resulting plan before saving.</Text></Panel>
      </>}
      {step === 1 && <>
        <Panel><Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 12 }}>Preferred units</Text><View style={{ flexDirection: "row", flexWrap: "wrap" }}><Tag label="Metric · kg / cm" selected={units === "metric"} onPress={() => { setUnits("metric"); setHeight(""); setInches(""); setWeight(""); setTarget(""); }} /><Tag label="Imperial · lb / ft" selected={units === "imperial"} onPress={() => { setUnits("imperial"); setHeight(""); setInches(""); setWeight(""); setTarget(""); }} /></View></Panel>
        <Panel>
          <MeasurementRuler label="Height" value={height ? (units === "metric" ? asNumber(height) : asNumber(height) * 12 + asNumber(inches || "0")) : null} min={units === "metric" ? 100 : 40} max={units === "metric" ? 250 : 98} step={1} defaultValue={units === "metric" ? 170 : 67} format={(number) => units === "metric" ? `${number} cm` : `${Math.floor(number / 12)}′ ${number % 12}″`} onChange={(number) => { if (units === "metric") setHeight(String(number)); else { setHeight(String(Math.floor(number / 12))); setInches(String(number % 12)); } }} />
          <Text style={{ color: muted, marginTop: 15, marginBottom: 8, fontSize: 12 }}>Or enter an exact value</Text><View style={{ flexDirection: "row", gap: 8 }}><View style={{ flex: 1 }}><Field label={units === "metric" ? "Centimeters" : "Feet"} value={height} onChangeText={setHeight} keyboardType="decimal-pad" /></View>{units === "imperial" && <View style={{ flex: 1 }}><Field label="Inches" value={inches} onChangeText={setInches} keyboardType="decimal-pad" /></View>}</View>
        </Panel>
        <Panel>
          <MeasurementRuler label="Current weight" value={weight ? asNumber(weight) : null} min={units === "metric" ? 30 : 67} max={units === "metric" ? 350 : 771} step={units === "metric" ? 0.5 : 1} defaultValue={units === "metric" ? 70 : 154} format={(number) => `${number} ${units === "metric" ? "kg" : "lb"}`} onChange={(number) => setWeight(String(number))} />
          <Text style={{ color: muted, marginTop: 15, marginBottom: 8, fontSize: 12 }}>Or enter an exact value</Text><Field label={units === "metric" ? "Kilograms" : "Pounds"} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" /><Text style={{ color: muted, fontSize: 12 }}>Use your current weight, not your goal weight.</Text>
        </Panel>
      </>}
      {step === 2 && <>
        <Choice value={goal} onChange={(value) => { setGoal(value); setTarget(""); }} options={goals} />
        {goal !== "maintain" && <Panel style={{ marginTop: 12 }}><Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 12 }}>Target weight <Text style={{ color: muted, fontSize: 12 }}>(optional)</Text></Text><View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Pressable onPress={() => adjustTarget(-1)} accessibilityRole="button" accessibilityLabel="Decrease target weight" style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: "#F1E7E0", alignItems: "center", justifyContent: "center" }}><MaterialCommunityIcons name="minus" size={24} color={ink} /></Pressable><View style={{ flex: 1 }}><Field label={units === "metric" ? "Kilograms" : "Pounds"} value={target} onChangeText={setTarget} keyboardType="decimal-pad" /></View><Pressable onPress={() => adjustTarget(1)} accessibilityRole="button" accessibilityLabel="Increase target weight" style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: "#F1E7E0", alignItems: "center", justifyContent: "center" }}><MaterialCommunityIcons name="plus" size={24} color={ink} /></Pressable></View><Text style={{ color: muted, lineHeight: 20, fontSize: 12 }}>{["muscle", "recomp"].includes(goal) ? "A lower target gives a deficit with higher protein. A higher target gives a modest surplus." : "This helps us choose the direction of your calorie target."}</Text></Panel>}
      </>}
      {step === 3 && <><Panel style={{ backgroundColor: "#F1E7DF" }}><Text style={{ color: accent, fontFamily: "Manrope_700Bold" }}>Activity shapes your calorie estimate</Text><Text style={{ color: muted, marginTop: 5, lineHeight: 20 }}>Pick the level you can sustain most weeks. You can change it later.</Text></Panel><Choice value={activity} onChange={setActivity} options={activities} /></>}
      {step === 4 && <>
        <Panel><Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 12 }}>Diet types</Text><View style={{ flexDirection: "row", flexWrap: "wrap" }}><Tag label="Vegetarian" selected={vegetarian} onPress={() => { setVegetarian(!vegetarian); if (vegetarian) setVegan(false); }} /><Tag label="Vegan" selected={vegan} onPress={() => { setVegan(!vegan); if (!vegan) setVegetarian(true); }} /><Tag label="Halal" selected={halal} onPress={() => setHalal(!halal)} /></View></Panel>
        <Panel><Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 12 }}>Allergies and foods to avoid</Text><Field label="Allergies or intolerances" value={allergies} onChangeText={setAllergies} /><Field label="Foods to avoid" value={avoid} onChangeText={setAvoid} /><Field label="Other preferences" value={other} onChangeText={setOther} multiline /><Text style={{ color: muted, lineHeight: 20, fontSize: 12 }}>We save these restrictions but cannot verify every ingredient or cross-contact risk. Always check food labels.</Text></Panel>
      </>}
      {step === 5 && plan && <>
        <Panel style={{ backgroundColor: "#F1E7DF" }}><Text style={{ color: muted, fontFamily: "Manrope_700Bold", fontSize: 11, letterSpacing: 1 }}>DAILY ENERGY TARGET</Text><Text style={{ color: accent, fontFamily: "Manrope_700Bold", fontSize: 36, marginTop: 4 }}>{plan.calories} <Text style={{ fontSize: 15 }}>kcal</Text></Text><Text style={{ color: muted, marginTop: 6 }}>{goals.find(([key]) => key === goal)?.[1]} · {activities.find(([key]) => key === activity)?.[1]}</Text></Panel>
        <Panel><Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 12 }}>Adjust your targets</Text><Field label="Daily calories (kcal)" value={plan.calories} onChangeText={(value) => setPlan({ ...plan, calories: value })} keyboardType="number-pad" /><View style={{ flexDirection: "row", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 18 }}>{planMacros.map(([name, key, color, energy]) => <View key={key} style={{ width: `${macroEnergy > 0 ? energy / macroEnergy * 100 : 0}%`, backgroundColor: color }} />)}</View>{Math.abs(macroEnergy - Number(plan.calories)) > 50 && <Text style={{ color: accent, marginBottom: 12, fontSize: 12 }}>Macro calories total about {Math.round(macroEnergy)} kcal. Adjust grams to match your calorie target.</Text>}{planMacros.map(([name, key, color, energy]) => <View key={key} style={{ borderTopWidth: 1, borderTopColor: line, paddingTop: 13, marginTop: 4 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 }}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} /><Text style={{ flex: 1, color: ink, fontFamily: "Manrope_700Bold" }}>{name}</Text><Text style={{ color: muted }}>{macroEnergy > 0 ? Math.round(energy / macroEnergy * 100) : 0}%</Text></View><Field label={`${name} (g)`} value={plan[key]} onChangeText={(value) => setPlan({ ...plan, [key]: value })} keyboardType="number-pad" /></View>)}</Panel>
        <Panel><Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 8 }}>Food guidance for you</Text>{guidance.map((item) => <Text key={item} style={{ color: muted, lineHeight: 21, marginTop: 8 }}>• {item}</Text>)}</Panel><Text style={{ color: muted, fontSize: 12, lineHeight: 19 }}>For adults only. These are starting estimates and may not reflect medical needs.</Text>
      </>}
      {!!error && <HelperText type="error" style={{ marginTop: 4 }}>{error}</HelperText>}
    </ScrollView>
    <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 13, borderTopWidth: 1, borderTopColor: line, backgroundColor: "#F8F3F2", gap: 4 }}><Button mode="contained" buttonColor={accent} onPress={next} disabled={busy} loading={busy} contentStyle={{ minHeight: 50 }} labelStyle={{ fontFamily: "Manrope_700Bold" }}>{step === 5 ? "Save plan and continue" : step === 4 ? "Review nutrition plan" : "Continue"}</Button><Button onPress={() => { setError(""); step === 0 ? (edit ? router.back() : signOut().catch((err) => setError(err.message))) : setStep(step - 1); }} disabled={busy} textColor={muted}>{step === 0 ? (edit ? "Cancel" : "Sign out") : "Back"}</Button></View>
  </SafeAreaView>;
}
