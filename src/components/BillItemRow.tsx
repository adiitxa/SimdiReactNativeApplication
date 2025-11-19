// src/components/BillItemRow.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function BillItemRow({ item, onDelete }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.details}>
            {item.quantity} bags × ₹{Number(item.rate).toLocaleString('en-IN')}
          </Text>
          {item.dealerName && item.dealerName !== "Not Specified" && (
            <Text style={styles.dealerText}>Dealer: {item.dealerName}</Text>
          )}
        </View>
        
        <View style={styles.amountSection}>
          <Text style={styles.itemAmount}>
            Item: ₹{Number(item.itemAmount).toLocaleString('en-IN')}
            {item.commissionAmount > 0 && (
              <Text style={styles.commissionText}>
                + Commission: ₹{Number(item.commissionAmount).toLocaleString('en-IN')}
              </Text>
            )}
          </Text>
          <Text style={styles.commissionPercent}>
            Commission: {item.commissionPercent}%
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        onPress={() => onDelete(item)}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="delete-outline" size={22} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  content: {
    flex: 1,
    marginRight: 12, // Added margin to separate from delete button
  },
  mainInfo: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  dealerText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  amountSection: {
    marginTop: 4,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  commissionText: {
    fontSize: 13,
    color: '#059669',
  },
  commissionPercent: {
    fontSize: 13,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 4,
    alignSelf: 'flex-start', // Ensure it stays at top right
    marginTop: 2,
  },
});