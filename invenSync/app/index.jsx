import React, { useEffect } from 'react';
import { View, Text, Image, ScrollView, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { images } from '../constants';
import { CustomButton, FeatureCard } from '../components';
import { useGlobalContext } from '../context/GlobalProvider';

const App = () => {
  const { isLogged, loading } = useGlobalContext();

  useEffect(() => {
    // Only redirect after auth state is loaded
    if (!loading) {
      if (isLogged) {
        // If already logged in, go directly to main app
        router.replace('/(tabs)');
      }
      // If not logged in, stay on landing page (no redirect)
    }
  }, [isLogged, loading]);

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
      <ActivityIndicator size="large" color="#86efac" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary h-full">
      <StatusBar style="light" />
      <ScrollView className="mt-8">
        {/* Header Section */}
        <View className="p-6">
          <Text className="text-4xl font-pbold text-white">
            InvenSync
          </Text>
          <Text className="text-lg font-pmedium text-green-300 mt-2">
            Revolutionize Your Food Management
          </Text>
        </View>

        {/* Hero Section */}
        <View className="items-center p-6">
          <Image
            source={images.front}
            className="w-full h-[300px] rounded-lg mb-4"
            resizeMode="cover"
          />
          <Text className="text-xl font-psemibold text-secondary text-center">
            Smart Inventory. Zero Waste !
          </Text>
          <CustomButton 
            text="Get Started" 
            handlePress={() => router.replace("/sign-in")} 
            containerStyles="mt-5 px-6 w-full"
          />
        </View>

        {/* Features Section */}
        <View className="p-6 bg-primary">
          <Text className="text-2xl font-pbold text-white mb-4">
            Key Features
          </Text>
          
          <FeatureCard 
            icon="sensors"
            title="Real-Time Inventory Monitoring"
            description="IoT sensors track stock levels instantly."
          />
          
          <FeatureCard 
            icon="analytics"
            title="Food Analysis & Quality"
            description="ML assesses quality and spoilage."
          />
          
          <FeatureCard 
            icon="restaurant-menu"
            title="Smart Recipe Suggestions"
            description="Creative meals from your inventory."
          />
        </View>

        {/* Footer Section */}
        <View className="p-6 bg-black-200 items-center">
          <Text className="text-sm font-plight text-gray-100">
            © 2025 InvenSync ❤️ by Amrita.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;