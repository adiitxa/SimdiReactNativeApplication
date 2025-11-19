// src/components/Header.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Header({ title, onMenu, rightComponent }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 18,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eef6ef",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#123e2a"
  },
  right: {
    flexDirection: "row",
    alignItems: "center"
  }
});
