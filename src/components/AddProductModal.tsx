import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Move InputField outside of AddProductModal
const InputField = ({ label, value, onChange, placeholder, keyboardType = "default", icon, error, suffix }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, error && styles.inputError]}>
      <Icon name={icon} size={20} color="#6b7280" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChange}
      />
      {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function AddProductModal({ visible, initial, onClose, onSave }) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [commission, setCommission] = useState("3");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setName(initial.name || "");
      setQty(String(initial.quantity || ""));
      setRate(String(initial.rate || ""));
      setCommission(String(initial.commissionPercent ?? 3));
    } else {
      setName("");
      setQty("");
      setRate("");
      setCommission("3");
    }
    setErrors({});
  }, [initial, visible]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) newErrors.name = "Product name is required";
    if (!qty.trim()) newErrors.qty = "Quantity is required";
    else if (isNaN(qty) || Number(qty) < 0) newErrors.qty = "Enter valid quantity";
    if (!rate.trim()) newErrors.rate = "Rate is required";
    else if (isNaN(rate) || Number(rate) <= 0) newErrors.rate = "Enter valid rate";
    if (commission && (isNaN(commission) || Number(commission) < 0 || Number(commission) > 100)) {
      newErrors.commission = "Commission must be between 0-100%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = () => {
    if (!validateForm()) return;
    
    onSave({
      name: name.trim(),
      quantity: Number(qty),
      rate: Number(rate),
      commissionPercent: Number(commission)
    });
  };

  const calculateStockValue = () => {
    if (qty && rate && !isNaN(qty) && !isNaN(rate)) {
      return Number(qty) * Number(rate);
    }
    return 0;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Icon 
                  name={initial ? "pencil" : "plus-circle"} 
                  size={24} 
                  color="#22c55e" 
                />
                <Text style={styles.title}>
                  {initial ? "Edit Product" : "Add New Product"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <InputField
                label="Product Name"
                value={name}
                onChange={setName}
                placeholder="Enter product name"
                icon="tag-outline"
                error={errors.name}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <InputField
                    label="Quantity"
                    value={qty}
                    onChange={setQty}
                    placeholder="0"
                    keyboardType="numeric"
                    icon="package-variant"
                    error={errors.qty}
                    suffix="bags"
                  />
                </View>
                <View style={styles.halfInput}>
                  <InputField
                    label="Rate per Bag"
                    value={rate}
                    onChange={setRate}
                    placeholder="0"
                    keyboardType="numeric"
                    icon="currency-inr"
                    error={errors.rate}
                    suffix="₹"
                  />
                </View>
              </View>

              <InputField
                label="Commission Percentage"
                value={commission}
                onChange={setCommission}
                placeholder="3"
                keyboardType="numeric"
                icon="percent"
                error={errors.commission}
                suffix="%"
              />

              {/* Stock Value Preview */}
              {calculateStockValue() > 0 && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>Stock Value</Text>
                  <Text style={styles.previewValue}>
                    ₹{calculateStockValue().toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.previewSubtitle}>
                    {qty} bags × ₹{Number(rate).toLocaleString('en-IN')} per bag
                  </Text>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={[styles.button, styles.cancelButton]}
                >
                  <Icon name="close" size={18} color="#6b7280" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={submit} 
                  style={[styles.button, styles.saveButton]}
                  disabled={!name.trim() || !qty.trim() || !rate.trim()}
                >
                  <Icon 
                    name={initial ? "content-save" : "plus"} 
                    size={18} 
                    color="#fff" 
                  />
                  <Text style={styles.saveButtonText}>
                    {initial ? "Update Product" : "Add Product"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
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
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  inputIcon: {
    marginRight: 8,
  },
  inputSuffix: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    marginLeft: 8,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  previewCard: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
    marginTop: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#065f46",
  },
  previewSubtitle: {
    fontSize: 12,
    color: "#059669",
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  saveButton: {
    backgroundColor: "#22c55e",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginLeft: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
});