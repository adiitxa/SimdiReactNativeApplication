import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from "react-native";
import { PieChart, BarChart } from "react-native-chart-kit";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from "../components/Header";
import api from "../api/client";

const { width } = Dimensions.get('window');

const DEFAULT_CHART_DATA = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    data: [12000, 15000, 8000, 22000, 18000, 25000, 19000]
  }]
};

const GAP_SIZE = 12;

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    productSales: [],
    monthlyRevenue: [],
    customerStats: [],
    dealerStats: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  async function fetchAnalyticsData() {
    setLoading(true);
    try {
      const billsResponse = await api.get("/api/bills?limit=100");
      const bills = billsResponse.data?.bills || billsResponse.data || [];
      
      const productsResponse = await api.get("/api/products");
      const products = productsResponse.data || [];
      
      const analytics = generateAnalyticsData(bills, products);
      setAnalyticsData(analytics);
    } catch (err) {
      console.warn("Analytics error:", err.message || err);
    } finally {
      setLoading(false);
    }
  }

  const generateAnalyticsData = (bills, products) => {
    const productSalesMap = {};
    bills.forEach(bill => {
      bill.items?.forEach(item => {
        const productId = item.productId;
        const product = products.find(p => p._id === productId);
        const productName = product?.name || `Product ${productId}`;
        const quantity = item.quantity || 0;
        
        if (productSalesMap[productName]) {
          productSalesMap[productName] += quantity;
        } else {
          productSalesMap[productName] = quantity;
        }
      });
    });

    const productSales = Object.entries(productSalesMap)
      .map(([name, quantity]) => ({
        name,
        quantity,
        color: getRandomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    const monthlyRevenue = Array(6).fill(0).map((_, index) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - index));
      const monthKey = month.toLocaleString('default', { month: 'short' });
      const year = month.getFullYear().toString().slice(-2);
      
      const monthBills = bills.filter(bill => {
        if (!bill.createdAt) return false;
        const billDate = new Date(bill.createdAt);
        return billDate.getMonth() === month.getMonth() && 
               billDate.getFullYear() === month.getFullYear();
      });
      
      const revenue = monthBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      
      return {
        month: `${monthKey} '${year}`,
        revenue: revenue,
        fullMonth: month.toLocaleString('default', { month: 'long', year: 'numeric' })
      };
    });

    const customerMap = {};
    bills.forEach(bill => {
      const customer = bill.customerName || 'Unknown Customer';
      const amount = bill.totalAmount || 0;
      
      if (customerMap[customer]) {
        customerMap[customer].totalAmount += amount;
        customerMap[customer].transactionCount += 1;
      } else {
        customerMap[customer] = {
          totalAmount: amount,
          transactionCount: 1
        };
      }
    });

    const customerStats = Object.entries(customerMap)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    const dealerMap = {};
    bills.forEach(bill => {
      bill.items?.forEach(item => {
        const dealer = item.dealerName || 'Unknown Dealer';
        const commission = ((item.rate || 0) * (item.quantity || 0) * (item.commissionPercent || 0)) / 100;
        
        if (dealerMap[dealer]) {
          dealerMap[dealer].totalCommission += commission;
          dealerMap[dealer].salesCount += 1;
        } else {
          dealerMap[dealer] = {
            totalCommission: commission,
            salesCount: 1
          };
        }
      });
    });

    const dealerStats = Object.entries(dealerMap)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 5);

    return {
      productSales,
      monthlyRevenue,
      customerStats,
      dealerStats
    };
  };

  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const totalSixMonthRevenue = analyticsData.monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);

  return (
    <View style={styles.container}>
      <Header title="Analytics" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#22c55e"]}
            tintColor="#22c55e"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard
            title="6 Month Revenue"
            value={`₹${Number(totalSixMonthRevenue).toLocaleString('en-IN')}`}
            subtitle="Last 6 months total"
            icon="cash-multiple"
            color="#10b981"
          />
          <StatCard
            title="Active Products"
            value={analyticsData.productSales.length}
            subtitle="Top selling"
            icon="package-variant"
            color="#3b82f6"
          />
          <StatCard
            title="Top Customers"
            value={analyticsData.customerStats.length}
            subtitle="By spending"
            icon="account-group"
            color="#f59e0b"
          />
          <StatCard
            title="Active Employee"
            value={analyticsData.dealerStats.length}
            subtitle="By commission"
            icon="account-tie"
            color="#8b5cf6"
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Product Sales</Text>
          {analyticsData.productSales.length > 0 ? (
            <PieChart
              data={analyticsData.productSales}
              width={width - 48}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="quantity"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.chartPlaceholder}>
              <Icon name="chart-pie" size={48} color="#d1d5db" />
              <Text style={styles.placeholderText}>No product sales data</Text>
            </View>
          )}
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>6 Months Revenue</Text>
            <Text style={styles.chartSubtitle}>
              Total: ₹{Number(totalSixMonthRevenue).toLocaleString('en-IN')}
            </Text>
          </View>
          {analyticsData.monthlyRevenue.some(m => m.revenue > 0) ? (
            <BarChart
              data={{
                labels: analyticsData.monthlyRevenue.map(m => m.month),
                datasets: [{
                  data: analyticsData.monthlyRevenue.map(m => m.revenue)
                }]
              }}
              width={width - 48}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                barPercentage: 0.6,
              }}
              style={styles.chart}
              fromZero={true}
            />
          ) : (
            <View style={styles.chartPlaceholder}>
              <Icon name="chart-bar" size={48} color="#d1d5db" />
              <Text style={styles.placeholderText}>No revenue data for last 6 months</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Customers</Text>
          {analyticsData.customerStats.length > 0 ? (
            analyticsData.customerStats.map((customer, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <View style={[styles.itemIcon, { backgroundColor: '#e0f2f7' }]}> {/* Changed background color */}
                    <Icon name="account-circle" size={20} color="#007bff" /> {/* Customer Icon */}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{customer.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {customer.transactionCount} transaction{customer.transactionCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemAmount}>
                  ₹{Number(customer.totalAmount).toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="account-search" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>No customer data available</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Employee</Text>
          {analyticsData.dealerStats.length > 0 ? (
            analyticsData.dealerStats.map((dealer, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <View style={[styles.itemIcon, { backgroundColor: '#e6f7ed' }]}> {/* Changed background color */}
                    <Icon name="account-tie" size={20} color="#18a558" /> {/* Dealer Icon */}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{dealer.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {dealer.salesCount} sale{dealer.salesCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemAmount}>
                  ₹{Number(dealer.totalCommission).toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="account-tie-outline" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>No dealer data available</Text>
            </View>
          )}
        </View>

        {loading && (
          <ActivityIndicator size="large" color="#22c55e" style={styles.loader} />
        )}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  statSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#1f2937",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22c55e",
  },
  emptyState: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
});