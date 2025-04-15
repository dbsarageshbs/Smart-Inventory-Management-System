import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  FlatList,
  ActivityIndicator, 
  Modal, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  RefreshControl
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import {
  getUserInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../../lib/inventoryService';
import ProductScannerComponent from '../../components/ProductScanner';

const categories = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'dairy', name: 'Dairy', icon: 'water-outline' },
  { id: 'bakery', name: 'Bakery', icon: 'bread-slice', isMaterialCommunity: true },
  { id: 'snacks', name: 'Snacks', icon: 'cookie', isMaterialCommunity: true },
  { id: 'fruits', name: 'Fruits', icon: 'nutrition', isMaterialCommunity: true },
  { id: 'vegetables', name: 'Vegetables', icon: 'food-apple-outline', isMaterialCommunity: true },
  { id: 'poultry', name: 'Poultry', icon: 'egg'},
  { id: 'meat', name: 'Meat', icon: 'food-steak', isMaterialCommunity: true },
  { id: 'seafood', name: 'Seafood', icon: 'fish', isMaterialCommunity: true },
  { id: 'grains', name: 'Grains', icon: 'rice', isMaterialCommunity: true },
  { id: 'beverages', name: 'Beverages', icon: 'cafe' },
  { id: 'personal care', name: 'Personal Care', icon: 'meditation', isMaterialCommunity: true }
];

const Inventory = () => {
  const { user } = useGlobalContext();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [scanningMode, setScanningMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'expiry', 'recent'
  
  // Form state for adding/editing items
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'pcs',
    category: 'dairy',
    expiryDays: '30',
    status: 'good'
  });

  useEffect(() => {
    if (user?.$id) fetchInventory();
  }, [user?.$id]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const items = await getUserInventory(user.$id);
      setInventory(items);
    } catch (error) {
      console.error("Error loading inventory:", error);
      Alert.alert("Error", "Failed to load inventory items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const toggleModal = (item = null) => {
    if (item) {
      // Editing existing item
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        quantity: item.quantity?.toString() || '1',
        unit: item.unit || 'pcs',
        category: item.category?.toLowerCase() || 'dairy',
        expiryDays: item.expiryDays?.toString() || '15',
        status: item.status || 'good'
      });
    } else {
      // Adding new item
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: '1',
        unit: 'pcs',
        category: 'dairy',
        expiryDays: '15',
        status: 'good'
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert("Error", "Please enter a name for the item");
        return;
      }

      setLoading(true);
      
      if (editingItem) {
        // Update existing item
        await updateInventoryItem(editingItem.$id, formData);
        Alert.alert("Success", "Item updated successfully");
      } else {
        // Add new item
        await addInventoryItem(user.$id, formData);
        Alert.alert("Success", "Item added successfully");
      }

      setModalVisible(false);
      fetchInventory();
    } catch (error) {
      console.error("Error saving item:", error);
      Alert.alert("Error", "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteInventoryItem(itemId);
              fetchInventory();
              Alert.alert("Success", "Item deleted successfully");
            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Failed to delete item");
            } finally {
              setLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Filter inventory items based on search and category
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category?.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort inventory items based on sortBy
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'expiry') {
      return (a.expiryDays || 999) - (b.expiryDays || 999);
    } else if (sortBy === 'recent') {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
    return 0;
  });

  // Group inventory by category for section list
  const groupedInventory = sortedInventory.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    acc[category].push(item);
    return acc;
  }, {});

  // Convert to array for section list
  const inventorySections = Object.keys(groupedInventory).map(category => ({
    title: category,
    data: groupedInventory[category]
  }));

  const handleProductAdded = () => {
    // Refresh inventory after product is added
    fetchInventory();
  };

  const renderInventoryItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => toggleModal(item)}
      className="bg-black-100 rounded-xl p-4 mb-3"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-full bg-secondary/30 items-center justify-center mr-3`}>
            {item.category && categories.find(cat => cat.id === item.category.toLowerCase())?.isMaterialCommunity ? (
              <MaterialCommunityIcons 
                name={categories.find(cat => cat.id === item.category.toLowerCase())?.icon || 'food'} 
                size={20} 
                color="#86efac" 
              />
            ) : (
              <Ionicons 
                name={categories.find(cat => cat.id === item.category.toLowerCase())?.icon || 'apps'} 
                size={20} 
                color="#86efac" 
              />
            )}
          </View>
          <View className="flex-1 mr-2">
            <Text className="text-white font-pmedium text-base">{item.name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-gray-200 text-xs font-plight">
                {item.quantity} {item.unit} • {item.category}
              </Text>
            </View>
          </View>
        </View>
        
        <View className="flex-row items-center">
          {item.expiryDays !== null && (
            <View className={`rounded-lg px-2 py-1 mr-2 ${
              item.expiryDays <= 3 ? 'bg-red-500/30' : 
              item.expiryDays <= 5 ? 'bg-yellow-500/30' : 'bg-green-500/30'
            }`}>
              <Text className={`text-xs font-pmedium ${
                item.expiryDays <= 3 ? 'text-red-500' : 
                item.expiryDays <= 5 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {item.expiryDays} days
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            onPress={() => handleDelete(item.$id)}
            className="p-2"
          >
            <Feather name="trash-2" size={18} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {scanningMode ? (
        <ProductScannerComponent 
          userId={user.$id}
          onClose={() => setScanningMode(false)}
          onProductAdded={handleProductAdded}
        />
      ) : (
        <>
          <View className="p-6 pb-3">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-pbold text-3xl">Inventory</Text>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => setSortBy(sortBy === 'name' ? 'expiry' : sortBy === 'expiry' ? 'recent' : 'name')}
                  className="bg-black-100 mr-3 rounded-full h-10 w-10 items-center justify-center"
                >
                  <Ionicons
                    name={
                      sortBy === 'name' ? 'text' : 
                      sortBy === 'expiry' ? 'time-outline' : 
                      'calendar-outline'
                    }
                    size={20}
                    color="#86efac"
                  />
                  <View className="absolute -bottom-1 -right-1 bg-secondary rounded-full w-5 h-5 items-center justify-center">
                    <Ionicons name="swap-vertical" size={12} color="#1A2E35" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setScanningMode(true)}
                  className="bg-black-100 mr-3 rounded-full h-10 w-10 items-center justify-center"
                >
                  <MaterialCommunityIcons name="barcode-scan" size={20} color="#86efac" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => toggleModal()}
                  className="bg-secondary rounded-full h-10 w-10 items-center justify-center"
                >
                  <Ionicons name="add" size={24} color="#1A2E35" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search bar */}
            <View className="flex-row items-center bg-black-100 rounded-xl px-3 py-2 mb-4">
              <Ionicons name="search" size={20} color="#86efac" />
              <TextInput
                className="flex-1 text-white ml-2 font-pregular"
                placeholder="Search inventory..."
                placeholderTextColor="#B0B7C1"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#B0B7C1" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Categories */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="mb-4"
            >
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`mr-3 px-3 py-2 rounded-lg flex-row items-center ${
                    selectedCategory === category.id ? 'bg-secondary' : 'bg-black-100'
                  }`}
                >
                  {category.isMaterialCommunity ? (
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={16}
                      color={selectedCategory === category.id ? '#1A2E35' : '#86efac'}
                      className="mr-1"
                    />
                  ) : (
                    <Ionicons
                      name={category.icon}
                      size={16}
                      color={selectedCategory === category.id ? '#1A2E35' : '#86efac'}
                      className="mr-1"
                    />
                  )}
                  <Text className={`font-pmedium ${
                    selectedCategory === category.id ? 'text-primary' : 'text-white'
                  }`}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quick stats */}
            <View className="flex-row mb-4">
              <View className="bg-black-100 p-3 rounded-xl flex-1 mr-2">
                <Text className="text-gray-200 font-plight text-xs">Total Items</Text>
                <Text className="text-white font-pbold text-xl">{inventory.length}</Text>
              </View>
              
              <View className="bg-black-100 p-3 rounded-xl flex-1 mr-2">
                <Text className="text-gray-200 font-plight text-xs">Categories</Text>
                <Text className="text-white font-pbold text-xl">
                  {new Set(inventory.map(item => item.category)).size}
                </Text>
              </View>
              
              <View className="bg-black-100 p-3 rounded-xl flex-1">
                <Text className="text-gray-200 font-plight text-xs">Expiring Soon</Text>
                <Text className="text-white font-pbold text-xl">
                  {inventory.filter(item => item.expiryDays <= 5).length}
                </Text>
              </View>
            </View>
          </View>

          {/* Inventory list */}
          {loading && !refreshing ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator color="#86efac" size="large" />
              <Text className="text-gray-200 mt-4 font-pmedium">Loading inventory...</Text>
            </View>
          ) : sortedInventory.length === 0 ? (
            <View className="flex-1 justify-center items-center p-6">
              <MaterialCommunityIcons name="food-off-outline" size={60} color="#3E5359" />
              <Text className="text-white font-pmedium text-lg mt-4">No items found</Text>
              <Text className="text-gray-200 text-center font-plight mt-2">
                {searchQuery || selectedCategory !== 'all' 
                  ? "Try changing your search or filter" 
                  : "Add items to your inventory by clicking the + button"}
              </Text>
              
              <TouchableOpacity 
                onPress={() => toggleModal()}
                className="mt-6 bg-secondary rounded-xl px-6 py-3 flex-row items-center"
              >
                <Ionicons name="add-circle-outline" size={24} color="#1A2E35" className="mr-2" />
                <Text className="text-primary font-psemibold text-base">Add First Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={sortedInventory}
              renderItem={renderInventoryItem}
              keyExtractor={item => item.$id}
              contentContainerStyle={{ padding: 20, paddingTop: 0 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#86efac"
                  colors={["#86efac"]}
                />
              }
              ListFooterComponent={<View className="h-20" />}
            />
          )}

          {/* Add/Edit Modal */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1 justify-end"
            >
              <View className="bg-black-100 rounded-t-3xl">
                <View className="p-6">
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-white font-pbold text-2xl">
                      {editingItem ? "Edit Item" : "Add New Item"}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close-circle" size={24} color="#86efac" />
                    </TouchableOpacity>
                  </View>

                  {/* Form Fields */}
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Item Name */}
                    <View className="mb-4">
                      <Text className="text-gray-100 font-pmedium mb-2">Item Name</Text>
                      <TextInput
                        className="bg-black-200 text-white px-3 py-3 rounded-xl font-pregular"
                        placeholder="Enter item name"
                        placeholderTextColor="#B0B7C1"
                        value={formData.name}
                        onChangeText={(text) => setFormData({...formData, name: text})}
                      />
                    </View>

                    {/* Quantity and Unit */}
                    <View className="flex-row mb-4">
                      <View className="flex-1 mr-2">
                        <Text className="text-gray-100 font-pmedium mb-2">Quantity</Text>
                        <TextInput
                          className="bg-black-200 text-white px-3 py-3 rounded-xl font-pregular"
                          placeholder="1"
                          placeholderTextColor="#B0B7C1"
                          keyboardType="numeric"
                          value={formData.quantity}
                          onChangeText={(text) => setFormData({...formData, quantity: text})}
                        />
                      </View>
                      <View className="flex-1 ml-2">
                        <Text className="text-gray-100 font-pmedium mb-2">Unit</Text>
                        <TextInput
                          className="bg-black-200 text-white px-3 py-3 rounded-xl font-pregular"
                          placeholder="pcs, kg, liter..."
                          placeholderTextColor="#B0B7C1"
                          value={formData.unit}
                          onChangeText={(text) => setFormData({...formData, unit: text})}
                        />
                      </View>
                    </View>

                    {/* Category */}
                    <View className="mb-4">
                      <Text className="text-gray-100 font-pmedium mb-2">Category</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                        {categories.slice(1).map(category => (
                          <TouchableOpacity
                            key={category.id}
                            onPress={() => setFormData({...formData, category: category.id})}
                            className={`mr-2 p-3 rounded-lg flex-row items-center ${
                              formData.category === category.id ? 'bg-secondary' : 'bg-black-200'
                            }`}
                          >
                            {category.isMaterialCommunity ? (
                              <MaterialCommunityIcons
                                name={category.icon}
                                size={16}
                                color={formData.category === category.id ? '#1A2E35' : '#86efac'}
                              />
                            ) : (
                              <Ionicons
                                name={category.icon}
                                size={16}
                                color={formData.category === category.id ? '#1A2E35' : '#86efac'}
                              />
                            )}
                            <Text className={`ml-1 font-pmedium ${
                              formData.category === category.id ? 'text-primary' : 'text-white'
                            }`}>
                              {category.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Expiry Days */}
                    <View className="mb-6">
                      <Text className="text-gray-100 font-pmedium mb-2">Days Until Expiry</Text>
                      <TextInput
                        className="bg-black-200 text-white px-3 py-3 rounded-xl font-pregular"
                        placeholder="Number of days until expiry"
                        placeholderTextColor="#B0B7C1"
                        keyboardType="numeric"
                        value={formData.expiryDays}
                        onChangeText={(text) => {
                          const days = parseInt(text) || 0;
                          setFormData({
                            ...formData, 
                            expiryDays: text,
                            status: days <= 5 ? 'warning' : 'good'
                          });
                        }}
                      />
                    </View>

                    {/* Image Upload Option */}
                    <View className="mb-6">
                      <TouchableOpacity
                        onPress={() => {
                          setModalVisible(false);
                          setTimeout(() => setScanningMode(true), 300);
                        }}
                        className="bg-secondary/30 rounded-xl py-3 flex-row justify-center items-center"
                      >
                        <MaterialCommunityIcons name="camera-outline" size={20} color="#86efac" />
                        <Text className="text-secondary font-pmedium ml-2">
                          Scan Product Label
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      onPress={handleSubmit}
                      className="bg-secondary rounded-xl py-4 mb-6"
                    >
                      <Text className="text-primary font-pbold text-center text-lg">
                        {editingItem ? "Update Item" : "Add to Inventory"}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

export default Inventory;