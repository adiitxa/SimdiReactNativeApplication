// src/screens/TransactionDetailScreen.js
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Share
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from "moment";
import api from "../api/client";

export default function TransactionDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { transaction } = route.params;

  const handleDownloadPDF = async () => {
    try {
      const pdfUrl = `${api.defaults.baseURL}/api/bills/${transaction._id}/pdf`;
      
      // For web/demo - you can use Linking to open the PDF
      const supported = await Linking.canOpenURL(pdfUrl);
      
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert("Error", "Cannot open PDF on this device");
      }
    } catch (error) {
      console.error("PDF Download Error:", error);
      Alert.alert("Error", "Failed to download PDF");
    }
  };

  const handleShare = async () => {
    try {
      const pdfUrl = `${api.defaults.baseURL}/api/bills/${transaction._id}/pdf`;
      
      await Share.share({
        message: `Transaction Bill - ${transaction.customerName}`,
        url: pdfUrl,
        title: 'Transaction Bill'
      });
    } catch (error) {
      console.error("Share Error:", error);
    }
  };

  const calculateItemsTotal = () => {
    return transaction.items.reduce((sum, item) => sum + (item.itemAmount || 0), 0);
  };

  const calculateCommissionTotal = () => {
    return transaction.items.reduce((sum, item) => sum + (item.commissionAmount || 0), 0);
  };

  const getDiscountAmount = () => {
    const itemsTotal = calculateItemsTotal();
    const commissionTotal = calculateCommissionTotal();
    return (itemsTotal + commissionTotal) * (transaction.discountPercent / 100);
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Transaction Details" 
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.avatar}>
              <Icon name="account" size={32} color="#fff" />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{transaction.customerName}</Text>
              <Text style={styles.transactionDate}>
                {moment(transaction.createdAt).format("DD MMM YYYY • hh:mm A")}
              </Text>
              <View style={styles.statusBadge}>
                <Icon name="check-circle" size={14} color="#10b981" />
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.amountSection}>
            <Text style={styles.amount}>₹{Number(transaction.totalAmount).toLocaleString()}</Text>
            <Text style={styles.amountLabel}>Total Amount</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
            <Icon name="download" size={20} color="#fff" />
            <Text style={styles.downloadButtonText}>Download PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share-variant" size={20} color="#3b82f6" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Bill ID</Text>
              <Text style={styles.summaryValue}>
                {transaction._id.toString().slice(-8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>
                {moment(transaction.createdAt).format("DD/MM/YYYY • hh:mm A")}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Items Count</Text>
              <Text style={styles.summaryValue}>
                {transaction.items?.length || 0} items
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>
                {transaction.discountPercent > 0 ? `${transaction.discountPercent}%` : "None"}
              </Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items Purchased</Text>
            <Text style={styles.itemsCount}>
              {transaction.items?.length || 0} items
            </Text>
          </View>
          
          <View style={styles.itemsList}>
            {transaction.items?.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemTotal}>
                    ₹{Number(item.lineTotal || item.itemAmount).toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantity:</Text>
                    <Text style={styles.detailValue}>{item.quantity}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rate:</Text>
                    <Text style={styles.detailValue}>₹{Number(item.rate).toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Base Amount:</Text>
                    <Text style={styles.detailValue}>₹{Number(item.itemAmount).toLocaleString()}</Text>
                  </View>
                  {item.commissionPercent > 0 && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Commission:</Text>
                        <Text style={styles.detailValue}>{item.commissionPercent}%</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Commission Amount:</Text>
                        <Text style={styles.detailValue}>
                          ₹{Number(item.commissionAmount).toLocaleString()}
                        </Text>
                      </View>
                    </>
                  )}
                  {item.dealerName && item.dealerName !== "N/A" && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Employee:</Text>
                      <Text style={[styles.detailValue, styles.dealerValue]}>
                        {item.dealerName}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Items Total</Text>
              <Text style={styles.priceValue}>
                ₹{Number(calculateItemsTotal()).toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Commission</Text>
              <Text style={styles.priceValue}>
                ₹{Number(calculateCommissionTotal()).toLocaleString()}
              </Text>
            </View>
            
            {transaction.discountPercent > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Discount ({transaction.discountPercent}%)
                </Text>
                <Text style={[styles.priceValue, styles.discountValue]}>
                  -₹{Number(getDiscountAmount()).toLocaleString()}
                </Text>
              </View>
            )}
            
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Final Amount</Text>
              <Text style={styles.totalValue}>
                ₹{Number(transaction.totalAmount).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Icon name="shield-check" size={20} color="#10b981" />
          <Text style={styles.footerText}>
            This is a computer generated invoice and doesn't require signature.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
    marginLeft: 4,
  },
  amountSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#22c55e",
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  downloadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3b82f6",
    minWidth: 80,
  },
  shareButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  section: {
    backgroundColor: "#ffffff",
    margin: 16,
    marginTop: 0,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 16,
  },
  itemsCount: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  summaryItem: {
    width: "50%",
    padding: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "700",
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
    marginRight: 12,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22c55e",
  },
  itemDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  dealerValue: {
    color: "#f59e0b",
    fontWeight: "700",
  },
  priceBreakdown: {
    gap: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  priceLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  discountValue: {
    color: "#ef4444",
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#22c55e",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginBottom: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },
});