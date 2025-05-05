import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fontScale, horizontalScale, verticalScale } from "../utils/responsive";

export interface PickerItem {
  label: string;
  value: string | number;
}

export interface PickerProps {
  items: PickerItem[];
  value?: string | number;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const Picker: React.FC<PickerProps> = ({
  items,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Find the selected item label
  const selectedItem = items.find((item) => item.value === value);
  const displayText = selectedItem ? selectedItem.label : placeholder;
  const isPlaceholder = !selectedItem;

  const handleSelect = (selectedValue: string | number) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, disabled && styles.disabledContainer]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.pickerText,
            isPlaceholder && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={fontScale(20)} color="#BDC3D8" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select an option</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={fontScale(24)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.value === value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons
                      name="checkmark"
                      size={fontScale(20)}
                      color="#FF7B00"
                    />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2D3548",
    borderRadius: 8,
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(16),
    marginVertical: verticalScale(8),
    backgroundColor: "#1E2435",
    height: verticalScale(56),
  },
  disabledContainer: {
    opacity: 0.7,
    backgroundColor: "#20273A",
  },
  pickerText: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  placeholderText: {
    color: "#BDC3D8",
  },
  disabledText: {
    color: "#8F98AD",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#161A28",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: horizontalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#2D3548",
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: horizontalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#2D3548",
  },
  selectedOption: {
    backgroundColor: "rgba(255, 123, 0, 0.1)",
  },
  optionText: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  selectedOptionText: {
    color: "#FF7B00",
    fontFamily: "Inter-SemiBold",
  },
});
