// src/components/ProductRow.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ProductRow({ item, onEdit, onDelete }) {
  const stockValue = (item.quantity || 0) * (item.rate || 0);
  const isLowStock = (item.quantity || 0) < 10;

  return (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.productDetails}>
            <Text style={styles.productDetail}>
              Stock: <Text style={[styles.stockText, isLowStock && styles.lowStock]}>
                {item.quantity} units
              </Text>
            </Text>
            <Text style={styles.productDetail}>
              Rate: ₹{Number(item.rate).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
        
        <View style={styles.productValue}>
          <Text style={styles.valueText}>
            ₹{Number(stockValue).toLocaleString('en-IN')}
          </Text>
          {item.commissionPercent > 0 && (
            <Text style={styles.commissionText}>
              {item.commissionPercent}% commission
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => onEdit(item)}
        >
          <Icon name="pencil" size={16} color="#3b82f6" />
          <Text style={[styles.actionText, styles.editText]}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => onDelete(item)}
        >
          <Icon name="delete" size={16} color="#ef4444" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 6,
  },
  productDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  productDetail: {
    fontSize: 12,
    color: "#6b7280",
    marginRight: 12,
    marginBottom: 2,
  },
  stockText: {
    fontWeight: "600",
    color: "#10b981",
  },
  lowStock: {
    color: "#ef4444",
  },
  productValue: {
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22c55e",
    marginBottom: 4,
  },
  commissionText: {
    fontSize: 10,
    color: "#f59e0b",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  editText: {
    color: "#3b82f6",
  },
  deleteText: {
    color: "#ef4444",
  },
});