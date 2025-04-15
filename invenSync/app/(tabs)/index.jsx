import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, Dimensions } from 'react-native';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useState, useEffect } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getUserInventory, getExpiringItems, updateExpiryDays } from '../../lib/inventoryService';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';

// Category definitions with appropriate icons
const categories = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'dairy', name: 'Dairy', icon: 'water-outline' },
  { id: 'bakery', name: 'Bakery', icon: 'bread-slice', isMaterialCommunity: true },
  { id: 'snacks', name: 'Snacks', icon: 'cookie', isMaterialCommunity: true },
  { id: 'fruits', name: 'Fruits', icon: 'nutrition', isMaterialCommunity: true },
  { id: 'vegetables', name: 'Vegetables', icon: 'food-apple-outline', isMaterialCommunity: true },
  { id: 'poultry', name: 'Poultry', icon: 'egg', isMaterialCommunity: true },
  { id: 'meat', name: 'Meat', icon: 'food-steak', isMaterialCommunity: true },
  { id: 'seafood', name: 'Seafood', icon: 'fish', isMaterialCommunity: true },
  { id: 'grains', name: 'Grains', icon: 'rice', isMaterialCommunity: true },
  { id: 'beverages', name: 'Beverages', icon: 'cafe' },
  { id: 'personal care', name: 'Personal Care', icon: 'meditation', isMaterialCommunity: true }
];

const ip = '192.168.99.130:8000';

async function checkExpiringItems(userId) {
  try {
      const response = await fetch(`http://${ip}/check-expiring-items`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              userId: userId
          })
      });
      const data = await response.json();
      // Handle response
  } catch (error) {
      console.error('Error:',error);
  }
}


const index = () => {
  const { isLogged, user, loading } = useGlobalContext();
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [greeting, setGreeting] = useState('Welcome');
  const [stats, setStats] = useState({
    totalItems: 0,
    categories: 0,
    expiringSoon: 0,
    goodItems: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const screenWidth = Dimensions.get('window').width;

  // Get appropriate greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Update the handleScriptRun function to update the lastSyncTime
  const handleHardwareReq = async () => {
    try {
      const response = await fetch(`http://${ip}/run-script`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?.$id }), // or user?.id based on your data
      });

      const data = await response.json();

      if (response.ok) {
        setLastSyncTime(new Date().toLocaleTimeString()); // Update last sync time
        alert("Script executed successfully");
        console.log(data);
        // Consider refreshing your inventory data here too
        loadInventory();
      } else {
        alert("Failed to run script: " + data.detail);
        console.error(data);
      }
    } catch (error) {
      alert("⚠ Error occurred while calling the backend.");
      console.error(error);
    }
  };


  // Load inventory data
  const loadInventory = async () => {
    try {
      if (!user) return;
      
      // First update expiry days for all items
      await updateExpiryDays(user.$id);
      
      const items = await getUserInventory(user.$id);
      const expiring = await getExpiringItems(user.$id, 3); // Items expiring in 3 days or less
      
      // Calculate stats
      const uniqueCategories = [...new Set(items.map(item => item.category))];
      const goodItems = items.filter(item => item.status === 'good').length;
      
      // Generate data for category chart
      const categoryCount = {};
      items.forEach(item => {
        const category = item.category || 'uncategorized';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      
      // Create pie chart data
      const chartData = Object.keys(categoryCount).map((category, index) => {
        const colors = [
          '#86efac', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6', 
          '#fb7185', '#fb923c', '#fbbf24', '#a3e635', '#22d3ee'
        ];
        
        return {
          name: category,
          count: categoryCount[category],
          color: colors[index % colors.length],
          legendFontColor: '#ffffff',
          legendFontSize: 12,
        };
      });
      
      setCategoryData(chartData);
      setInventory(items);
      setExpiringItems(expiring);
      setStats({
        totalItems: items.length,
        categories: uniqueCategories.length,
        expiringSoon: expiring.length,
        goodItems
      });
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLogged && user) {
      loadInventory();
    }
  }, [isLogged, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  // Find the corresponding category object for a given category name
  const getCategoryInfo = (categoryName) => {
    const category = categories.find(c => 
      c.id === categoryName?.toLowerCase() || 
      c.name.toLowerCase() === categoryName?.toLowerCase()
    );
    return category || categories[0]; // default to "All" if not found
  };

  // Get sorted inventory by recency (recent first)
  const getRecentItems = () => {
    return [...inventory].sort((a, b) => 
      new Date(b.$createdAt || b.createdAt) - new Date(a.$createdAt || a.createdAt)
    ).slice(0, 3);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary">
        <Text className="text-white font-pregular">Loading dashboard...</Text>
      </View>
    );
  }

  // Quick actions for the dashboard
  const quickActions = [
    {
      id: '1',
      title: 'Add Item',
      icon: <Ionicons name="add" size={24} color="#1A2E35" />,
      action: () => router.push('/Inventory'),
      bgColor: 'bg-secondary'
    },
    {
      id: '2',
      title: 'Scan Item',
      icon: <MaterialCommunityIcons name="barcode-scan" size={24} color="#1A2E35" />,
      action: () => router.push('/Inventory'),
      bgColor: 'bg-secondary'
    },
    {
      id: '3',
      title: 'Expiring',
      icon: <MaterialCommunityIcons name="timer-sand" size={24} color="#1A2E35" />,
      action: () => router.push('/Inventory'),
      bgColor: 'bg-secondary'
    },
    {
      id: '4',
      title: 'Categories',
      icon: <Ionicons name="grid-outline" size={24} color="#1A2E35" />,
      action: () => router.push('/Inventory'),
      bgColor: 'bg-secondary'
    }
  ];

  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: '#1A2E35',
    backgroundGradientTo: '#1A2E35',
    color: (opacity = 1) => `rgba(134, 239, 172, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 15) + 10, 
               Math.floor(Math.random() * 15) + 15, Math.floor(Math.random() * 15) + 20, 
               Math.floor(Math.random() * 15) + 25, stats.totalItems],
        color: (opacity = 1) => `rgba(134, 239, 172, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Inventory Growth"]
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView 
        className="flex-1 bg-primary"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#86efac" />
        }
      >
        <View className="p-6">
          {/* Welcome Header */}
          <View className="mb-6">
            <Text className="text-gray-300 font-plight text-lg">{greeting},</Text>
            <Text className="text-white font-pbold text-3xl">{user?.name || user?.username || 'User'}</Text>
          </View>

          {/* IOT system status */}
          <LinearGradient
            colors={['#1A2E35', '#2C3E50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-4 mb-8 border-r-2 border-secondary-100 border-b-2 rounded-sm"
          >
            <View className="flex-row items-center">
              <View className="bg-secondary/30 p-3 rounded-full mr-3">
                <Ionicons name="hardware-chip" size={24} color="#86efac" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-100 font-plight">IoT System</Text>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-secondary mr-2" />
                  <Text className="text-white font-pmedium">Connected</Text>
                </View>
                <Text className="text-gray-400 text-xs mt-1"> Last sync : {lastSyncTime} </Text>
              </View>
              
              {/* Action Buttons */}
              <View className="flex-row">
                {/* Fetch Data Button */}
                <TouchableOpacity 
                  className="bg-secondary/20 p-2 rounded-full mr-2"
                  onPress={handleHardwareReq} >
                  <Ionicons name="refresh" size={22} color="#86efac" />
                </TouchableOpacity>
                
                {/* Notifications Button */}
                <TouchableOpacity 
                  className="bg-secondary/20 p-2 rounded-full"
                  onPress={() => checkExpiringItems(user.$id)}
                >
                  <Ionicons name="notifications-outline" size={22} color="#86efac" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Cards */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="bg-black-100 p-4 rounded-xl w-[48%] mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 font-plight">Total Items</Text>
                <Ionicons name="cube-outline" size={20} color="#86efac" />
              </View>
              <Text className="text-white font-psemibold text-2xl mt-2">{stats.totalItems}</Text>
            </View>

            <View className="bg-black-100 p-4 rounded-xl w-[48%] mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 font-plight">Categories</Text>
                <Ionicons name="grid-outline" size={20} color="#86efac" />
              </View>
              <Text className="text-white font-psemibold text-2xl mt-2">{stats.categories}</Text>
            </View>

            <View className="bg-black-100 p-4 rounded-xl w-[48%]">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 font-plight">Expiring Soon</Text>
                <MaterialCommunityIcons name="timer-sand" size={20} color="#fb7185" />
              </View>
              <Text className="text-white font-psemibold text-2xl mt-2">{stats.expiringSoon}</Text>
            </View>

            <View className="bg-black-100 p-4 rounded-xl w-[48%]">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 font-plight">Good Items</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#86efac" />
              </View>
              <Text className="text-white font-psemibold text-2xl mt-2">{stats.goodItems}</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <Text className="text-white font-pmedium text-lg mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between mb-6">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                className={`${action.bgColor} p-4 rounded-xl w-[48%] mb-4 items-center justify-center`}
                onPress={action.action}
              >
                {action.icon}
                <Text className="text-primary font-pmedium mt-2">{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Expiring Soon Section */}
          {expiringItems.length > 0 && (
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white font-pmedium text-lg">Expiring Soon</Text>
                <TouchableOpacity onPress={() => router.push('/Inventory')}>
                  <Text className="text-secondary font-pregular">View All</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-black-100 rounded-xl p-4">
                <FlatList
                  data={expiringItems.slice(0, 3)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.$id}
                  renderItem={({ item }) => {
                    const categoryInfo = getCategoryInfo(item.category);
                    
                    return (
                      <View className="mr-4 w-40">
                        <View className={`bg-red-500/20 p-3 rounded-lg items-center justify-center`}>
                          {categoryInfo.isMaterialCommunity ? (
                            <MaterialCommunityIcons name={categoryInfo.icon} size={24} color="#fb7185" />
                          ) : (
                            <Ionicons name={categoryInfo.icon} size={24} color="#fb7185" />
                          )}
                        </View>
                        <Text className="text-white font-pmedium mt-2" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-gray-300 font-plight text-sm">
                          Expires in {item.expiryDays} day{item.expiryDays !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          )}

          {/* Recent Items */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-pmedium text-lg">Recent Items</Text>
              <TouchableOpacity onPress={() => router.push('/Inventory')}>
                <Text className="text-secondary font-pregular">View All</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-black-100 rounded-xl p-4">
              {getRecentItems().map((item) => {
                const categoryInfo = getCategoryInfo(item.category);
                
                return (
                  <TouchableOpacity
                    key={item.$id}
                    className="flex-row items-center py-3 border-b border-gray-700 last:border-b-0"
                    onPress={() => router.push('/Inventory')}
                  >
                    <View className={`w-10 h-10 rounded-full bg-secondary/30 items-center justify-center mr-3`}>
                      {categoryInfo.isMaterialCommunity ? (
                        <MaterialCommunityIcons 
                          name={categoryInfo.icon} 
                          size={20} 
                          color="#86efac" 
                        />
                      ) : (
                        <Ionicons 
                          name={categoryInfo.icon} 
                          size={20} 
                          color="#86efac" 
                        />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-pmedium">{item.name}</Text>
                      <Text className="text-gray-300 font-plight text-sm">
                        {item.quantity} {item.unit} • {item.category}
                      </Text>
                    </View>
                    {item.expiryDays !== null && (
                      <View className={`rounded-lg px-2 py-1 mr-1 ${
                        item.expiryDays <= 3 ? 'bg-red-500/30' : 
                        item.expiryDays <= 5 ? 'bg-yellow-500/30' : 'bg-green-500/30'
                      }`}>
                        <Text className={`text-xs font-pmedium ${
                          item.expiryDays <= 3 ? 'text-red-400' : 
                          item.expiryDays <= 5 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {item.expiryDays}d
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {inventory.length === 0 && (
                <View className="items-center justify-center py-8">
                  <MaterialCommunityIcons name="food-off-outline" size={50} color="#3E5359" />
                  <Text className="text-gray-300 font-plight text-center mt-4">
                    No items in your inventory yet
                  </Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/Inventory')}
                    className="mt-4 bg-secondary rounded-xl px-6 py-3"
                  >
                    <Text className="text-primary font-pmedium">Add First Item</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          {/* Inventory Growth Chart */}
          <View className="mb-6">
            <Text className="text-white font-pmedium text-lg mb-3">Inventory Growth</Text>
            <View className="bg-black-100 rounded-xl p-4 items-center">
              <LineChart
                data={lineData}
                width={screenWidth - 60}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={{
                  borderRadius: 12
                }}
              />
            </View>
          </View>

          {/* Category Distribution Chart */}
          {categoryData.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-pmedium text-lg mb-3">Category Distribution</Text>
              <View className="bg-black-100 rounded-xl p-4 items-center">
                <PieChart
                  data={categoryData}
                  width={screenWidth - 60}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default index;