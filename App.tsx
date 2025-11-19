import React from "react";
import { StatusBar, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";

function App() {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Authentication context */}
      <AuthProvider>
        {/* Whole App Navigation */}
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
