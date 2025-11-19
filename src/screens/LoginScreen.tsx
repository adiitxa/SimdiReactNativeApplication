import React, { useState, useContext } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Image,
  Dimensions
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    setError("");

    const res = await login(username, password);
    if (!res.success) {
      setError("Invalid username or password");
    }

    setIsLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >

            {/* ===================== HEADER + CUSTOM LOGO ===================== */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoBackground}>
                  <Image 
                    source={require("./a.png")}   // your logo
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text style={styles.title}>Manage | Track | Grow</Text>
              <Text style={styles.subtitle}>Welcome back !! Please sign in to continue..</Text>
            </View>
            {/* ================================================================= */}


            {/* ===================== FORM SECTION ===================== */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  placeholder="Username"
                  placeholderTextColor="#94a3b8"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setError("");
                  }}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  secureTextEntry={!showPassword}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError("");
                  }}
                  style={styles.input}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#64748b" 
                  />
                </TouchableOpacity>
              </View>

              {errorMsg ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.error}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                onPress={handleLogin} 
                style={[styles.btn, isLoading && styles.btnDisabled]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.btnText}>Signing In...</Text>
                  </View>
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>Sign In</Text>
                    <Icon name="arrow-right" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot your password ?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2025 Smidi Fertilizers</Text>
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 28,
  },

  /** ---------------- HEADER & LOGO ---------------- */
  header: {
    alignItems: "center",
    marginBottom: 40,
  },

  logoContainer: { marginBottom: 20 },

  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#dcfce7",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    padding: 10,
  },

  logoImage: {
    width: "100%",
    height: "100%",
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    color: "#166534",
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#64748b",
    lineHeight: 22,
  },

  /** ---------------- FORM ---------------- */
  form: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    height: 56,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    paddingVertical: 8,
  },

  inputIcon: {
    marginRight: 12,
  },

  eyeIcon: { padding: 4 },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  error: {
    color: "#dc2626",
    marginLeft: 8,
    fontSize: 14,
  },

  /** ---------------- BUTTON ---------------- */
  btn: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    elevation: 6,
  },

  btnDisabled: { opacity: 0.7 },

  btnContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },

  forgotPassword: { alignItems: "center", padding: 8 },

  forgotPasswordText: { color: "#64748b", fontSize: 14 },

  footer: { marginTop: 32, alignItems: "center" },

  footerText: { color: "#94a3b8", fontSize: 12 },
});

