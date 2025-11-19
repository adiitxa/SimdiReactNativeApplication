// src/screens/DashboardScreen.js
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from "../api/client";
import Header from "../components/Header";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    totalProducts: 0,
    inventoryValue: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    latestTransactions: [],
    chartData: {
      labels: [],
      datasets: [{ data: [] }]
    }
  });

  const { logoutUser } = useContext(AuthContext);

  useEffect(() => {
    fetchDashboard();
    fetchRecentTransactions();
    fetchChartData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), fetchRecentTransactions(), fetchChartData()]);
    setRefreshing(false);
  };

  async function fetchDashboard() {
    setLoading(true);
    try {
      const response = await api.get("/api/dashboard");
      setData(prev => ({
        ...prev,
        ...response.data
      }));
    } catch (err) {
      console.warn("Dashboard error:", err.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentTransactions() {
    try {
      const response = await api.get("/api/bills?page=1&limit=5");
      const bills = response.data?.bills || response.data || [];
      setData(prev => ({
        ...prev,
        latestTransactions: bills.slice(0, 5)
      }));
    } catch (err) {
      console.warn("Recent transactions error:", err.message);
    }
  }

  // NEW: Fetch real chart data from bills
  async function fetchChartData() {
    try {
      // Get bills from the last 30 days to calculate weekly data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const response = await api.get(`/api/bills?startDate=${startDate}&limit=100`);
      const bills = response.data?.bills || response.data || [];
      
      const weeklyData = generateWeeklyRevenueData(bills);
      setData(prev => ({
        ...prev,
        chartData: weeklyData
      }));
    } catch (err) {
      console.warn("Chart data error:", err.message);
      // Fallback to empty chart data
      setData(prev => ({
        ...prev,
        chartData: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
        }
      }));
    }
  }

  // Generate weekly revenue data from bills
  const generateWeeklyRevenueData = (bills) => {
    // Get last 7 days
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[date.getDay()],
        revenue: 0
      });
    }

    // Calculate revenue for each day
    bills.forEach(bill => {
      if (bill.createdAt) {
        const billDate = new Date(bill.createdAt).toISOString().split('T')[0];
        const dayData = days.find(day => day.date === billDate);
        if (dayData) {
          dayData.revenue += bill.totalAmount || bill.total || 0;
        }
      }
    });

    // Prepare data for chart
    const labels = days.map(day => day.dayName);
    const revenueData = days.map(day => day.revenue);

    return {
      labels: labels,
      datasets: [{
        data: revenueData
      }]
    };
  };

  const StatCard = ({ title, value, icon, color, isCurrency = false }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>
        {isCurrency ? '₹' : ''}{Number(value).toLocaleString()}
      </Text>
    </View>
  );

  const QuickAction = ({ title, icon, onPress, color = "#22c55e" }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  // Check if chart has any data to display
  const hasChartData = data.chartData?.datasets?.[0]?.data?.some(value => value > 0);

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        rightComponent={
          <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
            <Icon name="logout" size={20} color="#22c55e" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        }
      />

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
        {/* === STATS GRID === */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Products" 
            value={data.totalProducts} 
            icon="package-variant"
            color="#3b82f6"
          />
          <StatCard 
            title="Inventory Value" 
            value={data.inventoryValue} 
            icon="warehouse"
            color="#8b5cf6"
            isCurrency={true}
          />
          <StatCard 
            title="Transactions" 
            value={data.totalTransactions} 
            icon="receipt"
            color="#f59e0b"
          />
          <StatCard 
            title="Total Revenue" 
            value={data.totalRevenue} 
            icon="cash-multiple"
            color="#10b981"
            isCurrency={true}
          />
        </View>

        {/* === REVENUE CHART === */}
        <View style={styles.chartContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Revenue</Text>
            <Text style={styles.chartSubtitle}>Last 7 days</Text>
          </View>
          
          {/* Real Chart Data */}
          {hasChartData ? (
            <LineChart
              data={data.chartData}
              width={width - 48}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#22c55e'
                },
                propsForLabels: {
                  fontSize: 10
                }
              }}
              bezier
              style={styles.chart}
              fromZero={true}
            />
          ) : (
            <View style={styles.chartPlaceholder}>
              <Icon name="chart-line" size={48} color="#d1d5db" />
              <Text style={styles.chartPlaceholderText}>No revenue data available</Text>
              <Text style={styles.chartPlaceholderSubtext}>
                Create bills to see revenue trends
              </Text>
            </View>
          )}
        </View>

        {/* === QUICK ACTIONS === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Manage Products"
              icon="package-variant"
              onPress={() => navigation.navigate("Products")}
              color="#3b82f6"
            />
            <QuickAction
              title="Create Invoice"
              icon="currency-inr"
              onPress={() => navigation.navigate("Billing")}
              color="#22c55e"
            />
            <QuickAction
              title="Transactions"
              icon="history"
              onPress={() => navigation.navigate("Reports")}
              color="#f59e0b"
            />
            <QuickAction
              title="Analytics"
              icon="chart-bar"
              onPress={() => navigation.navigate("Analytics")}
              color="#8b5cf6"
            />
          </View>
        </View>

        {/* === RECENT TRANSACTIONS === */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Reports")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {data.latestTransactions && data.latestTransactions.length > 0 ? (
            data.latestTransactions.map((transaction, index) => (
              <TouchableOpacity 
                key={transaction._id || index} 
                style={styles.transactionCard}
                onPress={() => navigation.navigate("Reports")}
              >
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: '#f0fdf4' }]}>
                    <Icon name="receipt" size={20} color="#22c55e" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.customerName}>
                      {transaction.customerName || "Customer"}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {transaction.createdAt ? 
                        new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 
                        "Today"
                      }
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>
                    ₹{Number(transaction.totalAmount || transaction.total || 0).toLocaleString('en-IN')}
                  </Text>
                  <Icon name="chevron-right" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="receipt-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No recent transactions</Text>
              <Text style={styles.emptySubtext}>
                Create your first bill to see transactions here
              </Text>
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
    marginTop: 42,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: "#22c55e",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
  },
  chartPlaceholderText: {
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
    marginLeft: -8,
  },
  quickAction: {
    width: (width - 72) / 2,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  viewAllText: {
    color: "#22c55e",
    fontWeight: "600",
    fontSize: 14,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerName: {
    fontWeight: "600",
    fontSize: 15,
    color: "#1f2937",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22c55e",
    marginRight: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "center",
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
});

