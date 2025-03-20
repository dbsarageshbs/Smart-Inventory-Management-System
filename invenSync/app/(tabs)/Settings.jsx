import { View, Text, Alert } from 'react-native'
import React from 'react'
import { signOut } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { router } from "expo-router";
import { CustomButton } from '../../components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const Settings = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsLogged(false);
      
      // Redirect specifically to the sign-in page instead of just the auth layout
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary p-6">

      <Text className="text-3xl font-pbold text-white mb-8">Settings</Text>
      
      <View className="bg-secondary/20 rounded-2xl p-6 mb-6">
        <View className="items-center mb-4">
          <View className="w-24 h-24 rounded-full bg-secondary/40 items-center justify-center mb-3">
            <Ionicons name="person" size={50} color="white" />
          </View>
          <Text className="text-xl font-pbold text-white">{user?.name || "User"}</Text>
          <Text className="text-sm font-pregular text-gray-300">{user?.email || "email@example.com"}</Text>
        </View>
        
        <View className="border-t border-white/10 pt-4 mt-2">
          <Text className="text-base font-pmedium text-white mb-1">Account Details</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm font-pregular text-gray-300">User ID</Text>
            <Text className="text-sm font-pmedium text-white">{user?.$id || "Not available"}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm font-pregular text-gray-300">Created</Text>
            <Text className="text-sm font-pmedium text-white">
              {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : "Not available"}
            </Text>
          </View>
        </View>
      </View>
      
      <CustomButton
        text="Sign Out"
        handlePress={handleLogout}
        containerStyles="bg-red-500 mt-4"
        textStyles="text-white font-pbold"
      />
    </SafeAreaView>
  );
}

export default Settings;