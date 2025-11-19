// src/screens/ReportsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  Modal
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import api from "../api/client";
import moment from "moment";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const navigation = useNavigation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [dealer, setDealer] = useState("");
  const [bills, setBills] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    averageBill: 0
  });
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  // Dealer dropdown states
  const [dealers, setDealers] = useState([]);
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [dealerSearch, setDealerSearch] = useState("");

  useEffect(() => {
    fetchBills(page);
    fetchDealers();
  }, [page]);

  const isValidDate = (str) => /^\d{4}-\d{2}-\d{2}$/.test(str);

  // Fetch unique dealers from bills
  async function fetchDealers() {
    try {
      const res = await api.get("/api/bills/dealers");
      setDealers(res.data?.dealers || []);
    } catch (err) {
      console.warn("Error fetching Employee:", err.message);
      // If endpoint doesn't exist, extract dealers from bills
      extractDealersFromBills();
    }
  }

  // Extract dealers from existing bills data
  const extractDealersFromBills = () => {
    const dealerSet = new Set();
    bills.forEach(bill => {
      bill.items?.forEach(item => {
        if (item.dealerName && item.dealerName !== "N/A") {
          dealerSet.add(item.dealerName);
        }
      });
    });
    setDealers(Array.from(dealerSet).sort());
  };

  async function fetchBills(p = 1) {
    setLoading(true);
    try {
      const params = { 
        page: p, 
        limit: 5
      };

      // Add filters if provided
      if (customer.trim() !== "") {
        params.customer = customer.trim();
      }

      if (dealer.trim() !== "") {
        params.dealer = dealer.trim();
      }

      if (isValidDate(startDate)) params.startDate = startDate;
      if (isValidDate(endDate)) params.endDate = endDate;

      console.log("Fetching bills with params:", params);

      const res = await api.get("/api/bills/filter", { params });
      
      console.log("API Response:", res.data);

      const billsData = res.data?.data || res.data?.bills || res.data || [];
      const totalPagesCount = res.data?.pages || res.data?.totalPages || 1;
      const totalTransactions = res.data?.total || 0;

      setBills(billsData);
      setTotalPages(totalPagesCount);
      
      // Extract dealers from new bills data if needed
      if (dealers.length === 0) {
        extractDealersFromBills();
      }
      
      // Calculate statistics
      if (customer || dealer || startDate || endDate) {
        calculateStats(billsData, totalTransactions);
      } else {
        fetchAllBillsForStats(params);
      }
    } catch (err) {
      console.warn("Error fetching bills:", err.message);
      Alert.alert("Error", "Failed to fetch bills: " + err.message);
      setBills([]);
      setStats({ totalAmount: 0, totalTransactions: 0, averageBill: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Fetch all bills for accurate statistics
  async function fetchAllBillsForStats(filterParams = {}) {
    try {
      const params = { ...filterParams, limit: 1000 };
      delete params.page;

      const res = await api.get("/api/bills/filter", { params });
      const allBillsData = res.data?.data || res.data?.bills || res.data || [];
      
      calculateStatsFromAllData(allBillsData);
    } catch (err) {
      console.warn("Error fetching all bills for stats:", err.message);
      calculateStats(bills, res.data?.total || 0);
    }
  }

  const calculateStatsFromAllData = (allBillsData) => {
    const totalAmount = allBillsData.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const totalTransactions = allBillsData.length;
    const averageBill = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    setStats({
      totalAmount,
      totalTransactions,
      averageBill
    });
  };

  const calculateStats = (billsData, totalCount = null) => {
    const totalAmount = billsData.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const totalTransactions = totalCount || billsData.length;
    const averageBill = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    setStats({
      totalAmount,
      totalTransactions,
      averageBill
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBills(page);
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setCustomer("");
    setDealer("");
    setDealerSearch("");
    setPage(1);
    fetchBills(1);
  };

  const applyFilters = () => {
    setPage(1);
    fetchBills(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Date Picker Functions
  const handleStartDatePress = () => {
    setTempStartDate(startDate ? new Date(startDate) : new Date());
    setShowStartDatePicker(true);
  };

  const handleEndDatePress = () => {
    setTempEndDate(endDate ? new Date(endDate) : new Date());
    setShowEndDatePicker(true);
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
      setStartDate(formattedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
      setEndDate(formattedDate);
    }
  };

  const clearStartDate = () => {
    setStartDate("");
  };

  const clearEndDate = () => {
    setEndDate("");
  };

  // Dealer Dropdown Functions
  const handleDealerSelect = (selectedDealer) => {
    setDealer(selectedDealer);
    setShowDealerDropdown(false);
    setDealerSearch("");
  };

  const clearDealer = () => {
    setDealer("");
    setDealerSearch("");
  };

  const toggleDealerDropdown = () => {
    setShowDealerDropdown(!showDealerDropdown);
    setDealerSearch("");
  };

  // Filter dealers based on search
  const filteredDealers = dealers.filter(dealerName =>
    dealerName.toLowerCase().includes(dealerSearch.toLowerCase())
  );

  // ENHANCED BillItem Component
  const BillItem = ({ item }) => (
    <View style={styles.billCard}>
      {/* Header */}
      <View style={styles.billHeader}>
        <View style={styles.customerSection}>
          <View style={styles.customerAvatar}>
            <Icon name="account" size={20} color="#fff" />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.date}>
              {moment(item.createdAt).format("DD MMM YYYY • hh:mm A")}
            </Text>
          </View>
        </View>
        <View style={styles.amountSection}>
          <Text style={styles.amount}>₹{Number(item.totalAmount).toLocaleString()}</Text>
          <View style={styles.statusBadge}>
            <Icon name="check-circle" size={9} color="#10b981" />
            <Text style={styles.statusText}>completed</Text>
          </View>
        </View>
      </View>
      
      {/* ENHANCED ITEMS SECTION */}
      <View style={styles.itemsContainer}>
        <View style={styles.itemsHeader}>
         
          <View style={styles.itemsSummary}>
            <Text style={styles.itemsSummaryText}>
              Total: {item.items?.reduce((sum, it) => sum + (it.quantity || 0), 0)} units
            </Text>
          </View>
        </View>
        
        <View style={styles.itemsList}>
          {item.items?.slice(0, 3).map((it, idx) => (
            <View key={idx} style={styles.itemCard}>
              <View style={styles.itemMainInfo}>
                <View style={styles.itemNameSection}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {it.productName}
                  </Text>
                  {it.dealerName && it.dealerName !== "N/A" && (
                    <View style={styles.dealerTag}>
                      <Icon name="store" size={10} color="#8b5cf6" />
                      <Text style={styles.dealerTagText}>{it.dealerName}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.quantityBadge}>
                    <Icon name="cube-outline" size={12} color="#6b7280" />
                    <Text style={styles.quantityText}>×{it.quantity}</Text>
                  </View>
                  
                  <View style={styles.priceSection}>
                    <Text style={styles.rateText}>₹{it.rate}</Text>
                    <Text style={styles.itemTotalText}>
                      ₹{(it.quantity * it.rate).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
              
              {it.description && (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {it.description}
                </Text>
              )}
            </View>
          ))}
        </View>
        
        {item.items && item.items.length > 3 && (
          <TouchableOpacity style={styles.moreItemsButton}>
            <Text style={styles.moreItemsText}>
              +{item.items.length - 3} more items
            </Text>
            <Icon name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Footer */}
      <View style={styles.billFooter}>
        <View style={styles.footerInfo}>
          {item.discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Icon name="tag-outline" size={12} color="#f59e0b" />
              <Text style={styles.discountText}>{item.discountPercent}% OFF</Text>
            </View>
          )}

          <View style={styles.paymentMethod}>
            <Icon name="credit-card" size={12} color="#6b7280" />
             <Text style={styles.itemsLabel}> ITEMS {item.items?.length || 0}</Text>
          </View>
          
        </View>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
        >
          <Icon name="eye-outline" size={12} color="#22c55e" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const DealerDropdown = () => (
    <Modal
      visible={showDealerDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDealerDropdown(false)}
    >
      <TouchableOpacity 
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setShowDealerDropdown(false)}
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Select Employee</Text>
            <TouchableOpacity onPress={() => setShowDealerDropdown(false)}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchInputContainer}>
            <Icon name="magnify" size={20} color="#6b7280" />
            <TextInput
              placeholder="Search Employee..."
              value={dealerSearch}
              onChangeText={setDealerSearch}
              style={styles.dropdownSearchInput}
              placeholderTextColor="#9ca3af"
              autoFocus={true}
            />
          </View>

          <FlatList
            data={filteredDealers}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dealerOption}
                onPress={() => handleDealerSelect(item)}
              >
                <Text style={styles.dealerOptionText}>{item}</Text>
                {dealer === item && (
                  <Icon name="check" size={20} color="#22c55e" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.noDealersContainer}>
                <Icon name="account-alert" size={40} color="#d1d5db" />
                <Text style={styles.noDealersText}>No Employee found</Text>
                <Text style={styles.noDealersSubtext}>
                  {dealerSearch ? "Try a different search term" : "No Employee available"}
                </Text>
              </View>
            }
            style={styles.dropdownList}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Transaction History" />
      
      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={tempStartDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          maximumDate={new Date()}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={tempEndDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          maximumDate={new Date()}
          minimumDate={startDate ? new Date(startDate) : undefined}
        />
      )}

      {/* Dealer Dropdown */}
      <DealerDropdown />
      
      <ScrollView 
        style={styles.scrollView}
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
        <View style={styles.content}>
          {/* STATISTICS SECTION */}
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Revenue"
                value={`₹${Number(stats.totalAmount).toLocaleString()}`}
                subtitle="All transactions"
                icon="cash"
                color="#22c55e"
              />
              <StatCard
                title="Transactions"
                value={stats.totalTransactions.toString()}
                subtitle="Total bills"
                icon="receipt"
                color="#3b82f6"
              />
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                title="Average Bill"
                value={`₹${Number(stats.averageBill).toFixed(0)}`}
                subtitle="Per transaction"
                icon="chart-box"
                color="#f59e0b"
              />
              <StatCard
                title="Current Page"
                value={bills.length.toString()}
                subtitle="Displayed now"
                icon="file-document"
                color="#8b5cf6"
              />
            </View>
          </View>

          {/* FILTERS SECTION */}
          <View style={styles.filtersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Filters & Search</Text>
              <TouchableOpacity style={styles.filterButton} onPress={resetFilters}>
                <Icon name="filter-variant-remove" size={18} color="#6b7280" />
                <Text style={styles.filterButtonText}>Reset All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterGrid}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>
                  <Icon name="calendar" size={14} color="#6b7280" /> Date Range
                </Text>
                <View style={styles.dateInputs}>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={handleStartDatePress}
                  >
                    <Text style={[styles.dateInputText, !startDate && styles.placeholderText]}>
                      {startDate || "Start Date"}
                    </Text>
                    <View style={styles.dateInputIcons}>
                      {startDate ? (
                        <TouchableOpacity onPress={clearStartDate} style={styles.clearButton}>
                          <Icon name="close-circle" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      ) : null}
                      <Icon name="calendar" size={18} color="#6b7280" />
                    </View>
                  </TouchableOpacity>
                  
                  <Text style={styles.dateSeparator}>to</Text>
                  
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={handleEndDatePress}
                  >
                    <Text style={[styles.dateInputText, !endDate && styles.placeholderText]}>
                      {endDate || "End Date"}
                    </Text>
                    <View style={styles.dateInputIcons}>
                      {endDate ? (
                        <TouchableOpacity onPress={clearEndDate} style={styles.clearButton}>
                          <Icon name="close-circle" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      ) : null}
                      <Icon name="calendar" size={18} color="#6b7280" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>
                  <Icon name="account-tie" size={14} color="#6b7280" /> Employee
                </Text>
                <TouchableOpacity 
                  style={styles.dealerInput}
                  onPress={toggleDealerDropdown}
                >
                  <Text style={[styles.dealerInputText, !dealer && styles.placeholderText]}>
                    {dealer || "Select Employee"}
                  </Text>
                  <View style={styles.dealerInputIcons}>
                    {dealer ? (
                      <TouchableOpacity onPress={clearDealer} style={styles.clearButton}>
                        <Icon name="close-circle" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    ) : null}
                    <Icon name="chevron-down" size={18} color="#6b7280" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>
                  <Icon name="account" size={14} color="#6b7280" /> Customer
                </Text>
                <View style={styles.searchInput}>
                  <Icon name="magnify" size={20} color="#6b7280" style={styles.inputLeadingIcon} />
                  <TextInput
                    placeholder="Search customer name..."
                    value={customer}
                    onChangeText={setCustomer}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                    onSubmitEditing={applyFilters}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={applyFilters}
              style={styles.searchButton}
            >
              <Icon name="database-search" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>Search Transactions</Text>
            </TouchableOpacity>
          </View>

          {/* TRANSACTIONS LIST */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <Text style={styles.sectionSubtitle}>
                  Showing {bills.length} of {stats.totalTransactions} transactions
                  {dealer && ` • Dealer: ${dealer}`}
                </Text>
              </View>
              <TouchableOpacity style={styles.exportButton}>
                <Icon name="export" size={18} color="#22c55e" />
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            ) : (
              <>
                {!bills || bills.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <Icon name="chart-bar" size={64} color="#d1d5db" />
                    </View>
                    <Text style={styles.emptyText}>No transactions found</Text>
                    <Text style={styles.emptySubtext}>
                      {customer || dealer || startDate || endDate 
                        ? "Try adjusting your search criteria" 
                        : "Start creating bills to see your transaction history"
                      }
                    </Text>
                    <TouchableOpacity style={styles.emptyActionButton}>
                      <Icon name="plus" size={18} color="#fff" />
                      <Text style={styles.emptyActionText}>Create First Bill</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={bills}
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    renderItem={({ item }) => <BillItem item={item} />}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                )}

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <View style={styles.simplePagination}>
                    <TouchableOpacity
                      disabled={page === 1}
                      onPress={() => handlePageChange(page - 1)}
                      style={[
                        styles.paginationButton,
                        page === 1 && styles.paginationButtonDisabled
                      ]}
                    >
                      <Icon name="chevron-left" size={20} color={page === 1 ? "#9ca3af" : "#374151"} />
                      <Text style={[
                        styles.paginationButtonText,
                        page === 1 && styles.paginationButtonTextDisabled
                      ]}>Previous</Text>
                    </TouchableOpacity>

                    <View style={styles.paginationInfo}>
                      <Text style={styles.paginationText}>
                        Page <Text style={styles.paginationCurrent}>{page}</Text> of {totalPages}
                      </Text>
                    </View>

                    <TouchableOpacity
                      disabled={page >= totalPages}
                      onPress={() => handlePageChange(page + 1)}
                      style={[
                        styles.paginationButton,
                        page >= totalPages && styles.paginationButtonDisabled
                      ]}
                    >
                      <Text style={[
                        styles.paginationButtonText,
                        page >= totalPages && styles.paginationButtonTextDisabled
                      ]}>Next</Text>
                      <Icon name="chevron-right" size={20} color={page >= totalPages ? "#9ca3af" : "#374151"} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
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
  content: {
    padding: 16,
  },
  statsSection: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statContent: {
    flexShrink: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: "#9ca3af",
  },
  filtersSection: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  filterButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterGrid: {
    marginBottom: 20,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dateInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateInputText: {
    fontSize: 16,
    color: "#374151",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  dateInputIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    marginRight: 8,
  },
  dateSeparator: {
    fontSize: 14,
    color: "#6b7280",
    marginHorizontal: 8,
  },
  // Dealer Input Styles
  dealerInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dealerInputText: {
    fontSize: 16,
    color: "#374151",
  },
  dealerInputIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Dropdown Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#374151",
  },
  dropdownList: {
    maxHeight: 300,
  },
  dealerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dealerOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  noDealersContainer: {
    alignItems: "center",
    padding: 40,
  },
  noDealersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  noDealersSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 4,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#374151",
  },
  inputLeadingIcon: {
    marginRight: 8,
  },
  searchButton: {
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
  searchButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  transactionsSection: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  exportButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#22c55e",
  },
  listContent: {
    paddingTop: 8,
  },
  // ENHANCED Bill Card Styles
  billCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  customerSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  amountSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#22c55e",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10b981",
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  // ENHANCED Items Container
  itemsContainer: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6b7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  itemsSummary: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemsSummaryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  itemMainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  itemNameSection: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 4,
  },
  dealerTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f5ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  dealerTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8b5cf6",
    marginLeft: 3,
  },
  itemDetails: {
    alignItems: "flex-end",
  },
  quantityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    marginLeft: 2,
  },
  priceSection: {
    alignItems: "flex-end",
  },
  rateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 1,
  },
  itemTotalText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#22c55e",
  },
  itemDescription: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
    lineHeight: 14,
  },
  moreItemsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
  },
  moreItemsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginRight: 4,
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f59e0b",
    marginLeft: 4,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    marginLeft: 3,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dcfce7",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22c55e",
    marginLeft: 6,
    letterSpacing: -0.2,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  // Simple Pagination Styles
  simplePagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 100,
    justifyContent: "center",
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginHorizontal: 4,
  },
  paginationButtonTextDisabled: {
    color: "#9ca3af",
  },
  paginationInfo: {
    alignItems: "center",
  },
  paginationText: {
    fontSize: 14,
    color: "#6b7280",
  },
  paginationCurrent: {
    fontWeight: "800",
    color: "#22c55e",
  },
});