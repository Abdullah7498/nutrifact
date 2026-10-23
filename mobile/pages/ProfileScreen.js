import React, { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ActivityIndicator, Button, HelperText, Text } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { apiRequest, uploadProfilePhoto } from "../services/auth";

const C = { background: "#F8F3F2", card: "#FFFCFA", ink: "#302820", muted: "#74665E", accent: "#9A4B27", line: "#E9DDD5", green: "#3F8B6B", blue: "#78A7C4" };
const goalNames = { lose: "Weight loss", maintain: "Maintenance", gain: "Weight gain", muscle: "Muscle building", recomp: "Fat loss + muscle" };
function ageFrom(date) {
  if (!date) return "—";
  const born = new Date(`${date}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age--;
  return age;
}
function Card({ children, style }) { return <View style={[{ backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.line, padding: 20 }, style]}>{children}</View>; }
function Stat({ label, value, note }) { return <View style={{ width: "50%", paddingVertical: 12 }}><Text style={{ color: C.muted, fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 }}>{label}</Text><Text style={{ color: C.ink, fontSize: 20, fontFamily: "Manrope_700Bold", marginTop: 3 }}>{value}</Text>{!!note && <Text style={{ color: C.accent, fontSize: 11 }}>{note}</Text>}</View>; }
function SectionRow({ icon, title, detail, onPress }) { return <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 15, borderTopWidth: 1, borderTopColor: C.line }}><View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3E7DF", alignItems: "center", justifyContent: "center", marginRight: 13 }}><MaterialCommunityIcons name={icon} size={21} color={C.accent} /></View><View style={{ flex: 1 }}><Text style={{ color: C.ink, fontSize: 15, fontFamily: "Manrope_700Bold" }}>{title}</Text><Text numberOfLines={1} style={{ color: C.muted, marginTop: 2 }}>{detail}</Text></View><MaterialCommunityIcons name="chevron-right" size={24} color={C.muted} /></Pressable>; }

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [error, setError] = useState("");
  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest("profile", { token: session.accessToken }).then((result) => { if (active) { setProfile(result.profile); setPhotoUrl(result.photoUrl); setError(""); } }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [session.accessToken]));

  async function changePhoto() {
    if (photoBusy) return;
    setPhotoError("");
    setPhotoStatus("Opening photo library…");
    setPhotoBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
      if (result.canceled || !result.assets?.[0]) return;
      setPhotoStatus("Uploading photo…");
      const uploaded = await uploadProfilePhoto(session.accessToken, result.assets[0]);
      setPhotoUrl(uploaded.photoUrl);
      setPhotoStatus("Photo updated");
    } catch (err) { setPhotoError(err.message || "Could not update your photo."); }
    finally { setPhotoBusy(false); setPhotoStatus((current) => current === "Photo updated" ? current : ""); }
  }
  async function logout() {
    setBusy(true); setError("");
    try { await signOut(); }
    catch (err) { setError(err.message || "Could not sign out. Please try again."); }
    finally { setBusy(false); }
  }
  const unitWeight = profile?.units === "imperial" ? "lb" : "kg";
  const displayWeight = (kg) => kg == null ? "—" : `${profile?.units === "imperial" ? Math.round(kg * 2.20462 * 10) / 10 : kg} ${unitWeight}`;
  const totalInches = profile?.heightCm ? Math.round(profile.heightCm / 2.54) : 0;
  const height = profile?.heightCm ? profile.units === "imperial" ? `${Math.floor(totalInches / 12)}′ ${totalInches % 12}″` : `${profile.heightCm} cm` : "—";
  const plan = profile?.plan;
  const macroEnergy = plan ? plan.protein * 4 + plan.carbs * 4 + plan.fats * 9 : 0;
  const macros = plan ? [["Protein", plan.protein, plan.protein * 4, C.accent], ["Carbs", plan.carbs, plan.carbs * 4, C.green], ["Fats", plan.fats, plan.fats * 9, C.blue]] : [];
  const prefs = profile?.dietaryPreferences;
  const prefText = [prefs?.vegan ? "Vegan" : prefs?.vegetarian ? "Vegetarian" : null, prefs?.halal ? "Halal" : null, prefs?.allergies ? "Allergies noted" : null, prefs?.foodsToAvoid ? "Foods to avoid noted" : null].filter(Boolean).join(" · ") || "No preferences added";
  const edit = () => router.push("/(app)/profile-setup");

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 44, gap: 18 }}>
      {/* <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}><Text style={{ color: C.ink, fontSize: 27, fontFamily: "Manrope_700Bold" }}>Your profile</Text><MaterialCommunityIcons name="account-circle-outline" size={28} color={C.accent} /></View> */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Pressable onPress={changePhoto} accessibilityRole="button" accessibilityLabel="Change profile photo" style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: "#EED7C9", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {photoUrl ? <Image source={{ uri: photoUrl }} style={{ width: 82, height: 82 }} /> : <Text style={{ fontSize: 30, color: C.accent, fontFamily: "Manrope_700Bold" }}>{session?.user.name?.slice(0, 1)?.toUpperCase() || "?"}</Text>}
            {photoBusy && <View style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF99", alignItems: "center", justifyContent: "center" }}><ActivityIndicator /></View>}
          </Pressable>
          <View style={{ flex: 1 }}><Text style={{ color: C.ink, fontSize: 21, fontFamily: "Manrope_700Bold" }}>{session?.user.name}</Text><Text style={{ color: C.muted, marginTop: 2 }}>@{session?.user.username}</Text><Text style={{ color: C.muted, marginTop: 4, fontSize: 12 }}>{session?.user.email}</Text></View>
        </View>
        <Pressable onPress={changePhoto} disabled={photoBusy} accessibilityRole="button" style={{ alignSelf: "flex-start", paddingVertical: 11 }}><Text style={{ color: C.accent, fontFamily: "Manrope_700Bold", fontSize: 12 }}>{photoBusy ? "Updating photo…" : "Change photo"}</Text></Pressable>
        {!!photoStatus && <Text accessibilityLiveRegion="polite" style={{ color: C.muted, fontSize: 12 }}>{photoStatus}</Text>}
        {!!photoError && <HelperText type="error" accessibilityLiveRegion="polite">{photoError}</HelperText>}
        <View style={{ flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: C.line, marginTop: 18, paddingTop: 5 }}><Stat label="CURRENT WEIGHT" value={displayWeight(profile?.weightKg)} /><Stat label="TARGET WEIGHT" value={displayWeight(profile?.targetWeightKg)} /><Stat label="HEIGHT" value={height} /><Stat label="AGE" value={ageFrom(profile?.dateOfBirth)} note="years" /></View>
      </Card>
      {plan && <Card>
        <Text style={{ color: C.muted, fontFamily: "Manrope_700Bold", fontSize: 11, letterSpacing: 1 }}>ACTIVE NUTRITION PLAN</Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}><Text style={{ flex: 1, color: C.ink, fontSize: 21, fontFamily: "Manrope_700Bold" }}>{goalNames[profile.goal]}</Text><Text style={{ color: C.accent, fontSize: 26, fontFamily: "Manrope_700Bold" }}>{plan.calories}<Text style={{ fontSize: 12 }}> kcal</Text></Text></View>
        <View style={{ flexDirection: "row", height: 10, borderRadius: 8, overflow: "hidden", marginTop: 20, marginBottom: 14 }}>{macros.map(([name, grams, energy, color]) => <View key={name} style={{ width: `${energy / macroEnergy * 100}%`, backgroundColor: color }} />)}</View>
        <View style={{ flexDirection: "row", gap: 6 }}>{macros.map(([name, grams, energy, color]) => <View key={name} style={{ flex: 1, padding: 9, borderRadius: 12, backgroundColor: "#F6F0EC" }}><View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} /><Text style={{ color: C.muted, fontSize: 11 }}>{name}</Text></View><Text style={{ color: C.ink, fontFamily: "Manrope_700Bold", marginTop: 4 }}>{grams} g</Text><Text style={{ color: C.muted, fontSize: 10 }}>{Math.round(energy / macroEnergy * 100)}%</Text></View>)}</View>
        <Button mode="contained-tonal" onPress={edit} style={{ marginTop: 18 }} icon="tune">Edit nutrition goals and macros</Button>
      </Card>}
      <Card style={{ paddingVertical: 4 }}>
        <SectionRow icon="card-account-details-outline" title="Personal and body data" detail="Birthday, height, weight and units" onPress={edit} />
        <SectionRow icon="target" title="Goal and activity" detail={`${goalNames[profile?.goal] || "Choose a goal"} · ${profile?.activity?.replace("_", " ") || "Activity"}`} onPress={edit} />
        <SectionRow icon="food-apple-outline" title="Dietary preferences" detail={prefText} onPress={edit} />
      </Card>
      {!!profile?.guidance?.length && <Card><Text style={{ color: C.ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 8 }}>Food guidance</Text>{profile.guidance.map((item) => <Text key={item} style={{ color: C.muted, lineHeight: 21, marginTop: 8 }}>• {item}</Text>)}</Card>}
      {!!error && <HelperText type="error">{error}</HelperText>}
      <Button mode="outlined" onPress={logout} loading={busy} disabled={busy} icon="logout" textColor={C.accent}>Sign out</Button>
    </ScrollView>
  </SafeAreaView>;
}
