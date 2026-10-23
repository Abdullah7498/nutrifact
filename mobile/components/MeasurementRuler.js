import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Text } from "react-native-paper";

const accent = "#9A4B27";
const ink = "#302820";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 10) / 10;

export default function MeasurementRuler({ label, value, min, max, step, defaultValue, format, onChange }) {
  const selected = Number.isFinite(value);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(defaultValue);
  const displayed = clamp(dragging ? preview : selected ? value : defaultValue, min, max);
  const touchX = useRef(0);
  const touchY = useRef(0);
  const start = useRef(displayed);
  const last = useRef(displayed);
  function move(event) {
    const next = round(clamp(start.current - Math.round((event.nativeEvent.pageX - touchX.current) / 10) * step, min, max));
    if (next !== last.current) { last.current = next; setPreview(next); }
  }
  const update = (next) => onChange(round(clamp(next, min, max)));
  const finish = () => { onChange(last.current); setDragging(false); };
  const selectedIndex = Math.round((displayed - min) / step);
  return <View>
    <Text style={{ color: ink, fontFamily: "Manrope_700Bold", fontSize: 17, marginBottom: 12 }}>{label}</Text>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 15, marginBottom: 13 }}>
      <Pressable onPress={() => update(displayed - step)} accessibilityRole="button" accessibilityLabel={`Decrease ${label.toLowerCase()}`} style={{ width: 43, height: 43, borderRadius: 13, backgroundColor: "#F1E7E0", alignItems: "center", justifyContent: "center" }}><MaterialCommunityIcons name="minus" size={23} color={ink} /></Pressable>
      <View style={{ minWidth: 118, alignItems: "center" }}><Text style={{ color: selected || dragging ? accent : "#A99A90", fontSize: 27, fontFamily: "Manrope_700Bold" }}>{format(displayed)}</Text><Text style={{ color: "#8A7C73", fontSize: 10 }}>{selected || dragging ? "Selected" : "Drag to select"}</Text></View>
      <Pressable onPress={() => update(displayed + step)} accessibilityRole="button" accessibilityLabel={`Increase ${label.toLowerCase()}`} style={{ width: 43, height: 43, borderRadius: 13, backgroundColor: "#F1E7E0", alignItems: "center", justifyContent: "center" }}><MaterialCommunityIcons name="plus" size={23} color={ink} /></Pressable>
    </View>
    <View onTouchStart={(event) => { touchX.current = event.nativeEvent.pageX; touchY.current = event.nativeEvent.pageY; }} onMoveShouldSetResponder={(event) => Math.abs(event.nativeEvent.pageX - touchX.current) > 4 && Math.abs(event.nativeEvent.pageX - touchX.current) > Math.abs(event.nativeEvent.pageY - touchY.current)} onResponderGrant={() => { start.current = displayed; last.current = displayed; setPreview(displayed); setDragging(true); }} onResponderMove={move} onResponderRelease={finish} onResponderTerminate={finish} accessibilityRole="adjustable" accessibilityLabel={`${label} ruler`} accessibilityValue={{ min, max, now: displayed }} accessibilityActions={[{ name: "increment" }, { name: "decrement" }]} onAccessibilityAction={(event) => update(displayed + (event.nativeEvent.actionName === "increment" ? step : -step))} style={{ height: 75, borderRadius: 16, backgroundColor: "#F3ECE7", justifyContent: "center", overflow: "hidden" }}>
      <View pointerEvents="none" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", height: 55, paddingHorizontal: 8 }}>
        {Array.from({ length: 31 }, (_, index) => {
          const tick = selectedIndex + index - 15;
          const inRange = tick >= 0 && tick <= Math.round((max - min) / step);
          return <View key={index} style={{ width: tick % 10 === 0 ? 2 : 1, height: tick % 10 === 0 ? 31 : tick % 5 === 0 ? 23 : 13, backgroundColor: inRange ? (tick % 10 === 0 ? accent : "#A89A91") : "#D8CDC5" }} />;
        })}
      </View>
      <View pointerEvents="none" style={{ position: "absolute", left: "50%", marginLeft: -2, width: 4, height: 61, top: 7, backgroundColor: accent, borderRadius: 3 }} />
    </View>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 7 }}><Text style={{ color: "#8A7C73", fontSize: 11 }}>{format(min)}</Text><Text style={{ color: "#8A7C73", fontSize: 11 }}>Drag left or right</Text><Text style={{ color: "#8A7C73", fontSize: 11 }}>{format(max)}</Text></View>
  </View>;
}
