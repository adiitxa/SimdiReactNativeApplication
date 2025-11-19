// src/navigation/AppNavigator.js
import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthContext } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ProductsScreen from "../screens/ProductsScreen";
import BillingScreen from "../screens/BillingScreen";
import ReportsScreen from "../screens/ReportsScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import TransactionDetailScreen from "../screens/TransactionDetailScreen"; // ADD THIS IMPORT

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { loggedIn } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!loggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Products" component={ProductsScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            {/* ADD THIS NEW SCREEN */}
            <Stack.Screen 
              name="TransactionDetail" 
              component={TransactionDetailScreen}
              options={{ title: 'Transaction Details' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}