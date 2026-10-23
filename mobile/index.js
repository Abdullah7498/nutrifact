import React from "react";
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Keep the route directory literal so Metro does not need to inline
// EXPO_ROUTER_APP_ROOT in expo-router/_ctx.android.js.
export function App() {
  const context = require.context("./src/app");
  return <ExpoRoot context={context} />;
}

registerRootComponent(App);
