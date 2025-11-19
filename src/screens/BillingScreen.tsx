// src/screens/BillingScreen.js
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Modal,
  Platform,
  PermissionsAndroid
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import api from "../api/client";
import Header from "../components/Header";
import BillItemRow from "../components/BillItemRow";

const { width } = Dimensions.get('window');

export default function BillingScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [billDate, setBillDate] = useState(new Date());
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [qty, setQty] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");

  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => { 
    fetchProducts(); 
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  async function fetchProducts() {
    setLoading(true);
    try {
      const response = await api.get("/api/products");
      setProducts(response.data || []);
    } catch (err) { 
      console.warn("Products fetch error:", err.message);
      Alert.alert("Error", "Failed to load products");
    } finally { 
      setLoading(false); 
    }
  }

  function resetInputs() {
    setSelectedProductId(null); 
    setQty(""); 
    setDealerName(""); 
    setCommissionPercent("");
  }

  function addToBill() {
    if (!selectedProductId || !qty) {
      Alert.alert("Missing Information", "Please select a product and enter quantity");
      return;
    }

    const product = products.find(p => p._id === selectedProductId);
    if (!product) {
      Alert.alert("Error", "Selected product not found");
      return;
    }

    if (Number(qty) > product.quantity) {
      Alert.alert("Insufficient Stock", `Only ${product.quantity} bags available in stock`);
      return;
    }

    if (Number(qty) <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity");
      return;
    }

    const appliedCommission = commissionPercent !== "" ? Number(commissionPercent) : (product.commissionPercent ?? 3);
    const itemAmount = Number(qty) * product.rate;
    const commissionAmount = (itemAmount * appliedCommission) / 100;

    const newItem = {
      productId: product._id,
      productName: product.name,
      quantity: Number(qty),
      rate: product.rate,
      itemAmount,
      commissionAmount,
      dealerName: dealerName || "Not Specified",
      commissionPercent: appliedCommission,
      stock: product.quantity
    };

    setItems(prev => [...prev, newItem]);
    resetInputs();
  }

  function removeItem(item) {
    Alert.alert(
      "Remove Item",
      `Remove ${item.productName} from bill?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => setItems(prev => prev.filter(i => i !== item))
        }
      ]
    );
  }

  // Request storage permission for Android
  async function requestStoragePermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to download PDF files',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  }

  // Function to generate and download PDF
  async function generateAndDownloadPDF(billId, customerName) {
    setGeneratingPDF(true);
    try {
      // Request storage permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Storage permission is required to download PDF");
        return;
      }

      // Generate PDF filename
      const fileName = `Bill_${customerName.replace(/\s+/g, '_')}_${billId}.pdf`;
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      // Download PDF file
      const downloadOptions = {
        fromUrl: `${api.defaults.baseURL}/api/bills/${billId}/pdf`,
        toFile: downloadPath,
      };

      const downloadResult = await RNFS.downloadFile(downloadOptions).promise;

      if (downloadResult.statusCode === 200) {
        // Try to open the PDF file
        try {
          await FileViewer.open(downloadPath, {
            showOpenWithDialog: true,
            showAppsSuggestions: true,
          });
          Alert.alert(
            "Success", 
            `PDF generated and saved successfully!\n\nFile: ${fileName}`,
            [{ text: "OK" }]
          );
        } catch (openError) {
          console.warn('Error opening PDF:', openError);
          Alert.alert(
            "PDF Saved", 
            `PDF downloaded successfully but couldn't open automatically.\n\nFile: ${fileName}\nLocation: Downloads folder`,
            [{ text: "OK" }]
          );
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
      }

    } catch (err) {
      console.warn("PDF download error:", err.message);
      Alert.alert("Error", "Failed to download PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  }

  // Function to save bill and generate PDF
  async function saveBillAndGeneratePDF() {
    if (!customerName.trim()) {
      Alert.alert("Missing Information", "Please enter customer name");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Empty Bill", "Please add at least one item to the bill");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        discountPercent: 0,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          dealerName: i.dealerName,
          commissionPercent: i.commissionPercent
        }))
      };

      // Step 1: Save the bill
      const response = await api.post("/api/bills", payload);
      const billId = response.data._id || response.data.id;
      
      if (!billId) {
        throw new Error("No bill ID returned from server");
      }

      // Step 2: Generate and download PDF
      Alert.alert("Success", "Bill saved successfully! Generating PDF...");
      await generateAndDownloadPDF(billId, customerName.trim());
      
      // Reset form after successful operation
      setItems([]); 
      setCustomerName("");

    } catch (err) {
      console.warn("Save bill error:", err.message || err);
      Alert.alert("Error", err.response?.data?.message || "Failed to save bill");
    } finally { 
      setSaving(false); 
    }
  }

  // Original save bill function (without PDF)
  async function saveBill() {
    if (!customerName.trim()) {
      Alert.alert("Missing Information", "Please enter customer name");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Empty Bill", "Please add at least one item to the bill");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        discountPercent: 0,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          dealerName: i.dealerName,
          commissionPercent: i.commissionPercent
        }))
      };

      await api.post("/api/bills", payload);
      
      Alert.alert(
        "Success", 
        "Bill saved successfully!",
        [
          { 
            text: "OK", 
            onPress: () => {
              setItems([]); 
              setCustomerName("");
            }
          }
        ]
      );
    } catch (err) {
      console.warn("Save bill error:", err.message || err);
      Alert.alert("Error", err.response?.data?.message || "Failed to save bill");
    } finally { 
      setSaving(false); 
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.itemAmount + item.commissionAmount, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const selectedProduct = products.find(p => p._id === selectedProductId);

  // Function to handle product selection
  const handleProductSelect = (product) => {
    setSelectedProductId(product._id);
    setShowProductDropdown(false);
  };

  return (
    <View style={styles.container}>
      <Header title="Create Invoice" />
      
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoice Information</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.customerInputGroup]}>
                <Text style={styles.label}>Customer Name</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="account" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput 
                    value={customerName} 
                    onChangeText={setCustomerName} 
                    style={styles.input} 
                    placeholder="Customer Name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.dateInputGroup]}>
                <Text style={styles.label}>Bill Date</Text>
                <View style={[styles.inputWrapper, styles.disabledInput]}>
                  <Icon name="calendar" size={20} color="#6b7280" /> 
                  <TextInput 
                    value={billDate.toLocaleDateString('en-IN')} 
                    editable={false} 
                    style={[styles.input, styles.dateInputStyle]} 
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Items</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Product</Text>
              
              <TouchableOpacity 
                style={styles.dropdownTrigger}
                onPress={() => setShowProductDropdown(!showProductDropdown)}
              >
                <View style={styles.dropdownTriggerContent}>
                  {selectedProduct ? (
                    <View style={styles.selectedProductInfo}>
                      <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                      <Text style={styles.selectedProductDetails}>
                        Stock: {selectedProduct.quantity} • ₹{Number(selectedProduct.rate).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.dropdownPlaceholder}>Select a product</Text>
                  )}
                  <Icon 
                    name={showProductDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </View>
              </TouchableOpacity>

              <Modal
                visible={showProductDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProductDropdown(false)}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowProductDropdown(false)}
                >
                  <View style={styles.dropdownContainer}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#22c55e" style={styles.dropdownLoading} />
                    ) : products.length === 0 ? (
                      <Text style={styles.noProductsText}>No products available</Text>
                    ) : (
                      <FlatList
                        data={products}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.dropdownItem,
                              selectedProductId === item._id && styles.dropdownItemSelected
                            ]}
                            onPress={() => handleProductSelect(item)}
                          >
                            <View style={styles.dropdownItemContent}>
                              <Text style={styles.dropdownItemName}>{item.name}</Text>
                              <Text style={styles.dropdownItemDetails}>
                                Stock: {item.quantity} • ₹{Number(item.rate).toLocaleString('en-IN')}
                                {item.commissionPercent && ` • Commission: ${item.commissionPercent}%`}
                              </Text>
                            </View>
                            {selectedProductId === item._id && (
                              <Icon name="check" size={18} color="#22c55e" />
                            )}
                          </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={true}
                        style={styles.dropdownList}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Quantity (bags)</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="package-variant" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput 
                    keyboardType="numeric" 
                    value={qty} 
                    onChangeText={setQty} 
                    style={styles.input} 
                    placeholder="Enter quantity"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Commission %</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="percent" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput 
                    keyboardType="numeric" 
                    value={commissionPercent} 
                    onChangeText={setCommissionPercent} 
                    style={styles.input} 
                    placeholder={selectedProduct ? `Default: ${selectedProduct.commissionPercent || 3}%` : "Default"}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employee Name</Text>
              <View style={styles.inputWrapper}>
                <Icon name="account-tie" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput 
                  value={dealerName} 
                  onChangeText={setDealerName} 
                  style={styles.input} 
                  placeholder="Enter Employee name"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={addToBill} 
              style={styles.addToBillButton}
              disabled={!selectedProductId || !qty}
            >
              <Icon name="plus-circle" size={20} color="#fff" />
              <Text style={styles.addToBillText}>Add to Bill</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction Items</Text>
              {items.length > 0 && (
                <Text style={styles.itemsCount}>
                  {items.length} item{items.length !== 1 ? 's' : ''} • {totalItems} bags
                </Text>
              )}
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="receipt-text-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No items added yet</Text>
                <Text style={styles.emptySubtext}>
                  Select products and add them to the bill
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {items.map((item, index) => (
                  <BillItemRow 
                    key={index}
                    item={item} 
                    onDelete={removeItem} 
                  />
                ))}
              </View>
            )}

            {items.length > 0 && (
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalAmount}>
                    ₹{Number(totalAmount).toLocaleString('en-IN')}
                  </Text>
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    onPress={saveBill} 
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="content-save" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Save Bill</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={saveBillAndGeneratePDF} 
                    style={[styles.savePDFButton, (saving || generatingPDF) && styles.saveButtonDisabled]}
                    disabled={saving || generatingPDF}
                  >
                    {(saving || generatingPDF) ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="file-pdf-box" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ... (keep the same styles as before)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginTop: 45,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  customerInputGroup: {
    width: "57%",
    marginBottom: 16,
  },
  dateInputGroup: {
    width: "38%",
    marginBottom: 16,
  },
  dateInputStyle: {
    paddingHorizontal: 0, 
    textAlign: 'center',
    paddingLeft: 6,
  },
  inputGroup: {
    marginBottom: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dropdownTrigger: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownTriggerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  selectedProductDetails: {
    fontSize: 12,
    color: "#6b7280",
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    maxHeight: 400,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: "hidden",
  },
  dropdownLoading: {
    padding: 20,
  },
  noProductsText: {
    padding: 20,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
  },
  dropdownList: {
    maxHeight: 350,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemSelected: {
    backgroundColor: "#f0fdf4",
  },
  dropdownItemContent: {
    flex: 1,
    marginRight: 12,
  },
  dropdownItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  dropdownItemDetails: {
    fontSize: 12,
    color: "#6b7280",
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  halfInput: {
    width: "48%",
  },
  addToBillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addToBillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  itemsList: {
    borderRadius: 8,
    overflow: "hidden",
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
  totalSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#22c55e",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#15803d",
    padding: 16,
    borderRadius: 8,
    flex: 1,
  },
  savePDFButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
});