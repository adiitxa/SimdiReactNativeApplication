import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveLoginSession = async () => {
  const expiry = Date.now() + 3600 * 1000; // 1 hr
  await AsyncStorage.setItem("loginExpiry", expiry.toString());
};

export const isSessionValid = async () => {
  const stored = await AsyncStorage.getItem("loginExpiry");
  if (!stored) return false;

  return Date.now() < parseInt(stored);
};

export const logout = async () => {
  await AsyncStorage.removeItem("loginExpiry");
};
