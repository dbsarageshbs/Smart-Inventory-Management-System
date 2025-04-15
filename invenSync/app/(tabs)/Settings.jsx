import { View, Text, Alert, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { signOut, getUserProfile, updateUserProfile} from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { router } from "expo-router";
import { CustomButton } from '../../components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const Settings = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.name || '',
    age: '',
    height: '',
    weight: '',
    healthConditions: '',
    phoneNumber: ''
  });
  const [profileDetails, setProfileDetails] = useState(null);

  useEffect(() => {
    if (user?.$id) {
      fetchUserProfile();
    }
  }, [user?.$id]);

  const fetchUserProfile = async () => {
    if (!user?.$id) return;
    
    setLoading(true);
    try {
      // Get the user profile
      const profile = await getUserProfile(user.$id);
      
      // Store the full profile details
      setProfileDetails(profile);
      
      // Set form data for editing
      setProfileData({
        username: profile.username || user?.name || '',
        age: profile.age?.toString() || '',
        height: profile.height?.toString() || '',
        weight: profile.weight?.toString() || '',
        healthConditions: profile.healthConditions || '',
        phoneNumber: profile.phoneNumber || ''
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Could not load profile data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsLogged(false);
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.$id) return;
    
    setLoading(true);
    try {
      // Format phone number with country code
      if (profileData.phoneNumber && !profileData.phoneNumber.startsWith('+')) {
        // Remove any non-digit characters
        const digitsOnly = profileData.phoneNumber.replace(/\D/g, '');
        profileData.phoneNumber = '+91' + digitsOnly.replace(/^0+/, '');
      }

      // Then proceed with your existing code
      await updateUserProfile(user.$id, {
        ...profileData,
        email: profileDetails?.email || user?.email
      });
      
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
      
      // Refresh the profile data
      await fetchUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderProfileField = (label, value, placeholder, fieldName) => {
    return (
      <View className="mb-4">
        <Text className="text-sm font-psemibold text-secondary mb-1">
          {label}
        </Text>
        {isEditing ? (
          <TextInput
            className="bg-black-300 rounded-lg p-3 text-white font-pregular border-b border-secondary"
            placeholder={placeholder}
            placeholderTextColor="#B0B7C1"
            value={profileData[fieldName]}
            onChangeText={(text) => {
              // Special handling for phone number to add country code
              if (fieldName === 'phoneNumber') {
                // Strip any existing country code and non-digit characters
                const digitsOnly = text.replace(/\D/g, '');
                setProfileData(prev => ({ ...prev, [fieldName]: digitsOnly }))
              } else {
                setProfileData(prev => ({ ...prev, [fieldName]: text }))
              }
            }}
            keyboardType={
              fieldName === 'age' || fieldName === 'height' || fieldName === 'weight' 
                ? 'numeric' 
                : fieldName === 'phoneNumber' 
                  ? 'phone-pad' 
                  : 'default'
            }
          />
        ) : (
          <View className="bg-black-100 rounded-lg p-3">
            <Text className="text-white font-pregular">
              {fieldName === 'phoneNumber' && value && !value.startsWith('+') 
                ? '+91 ' + value 
                : value || "Not set"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView className="flex-1 p-6">
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-3xl font-pbold text-white">Settings</Text>
          {loading && <ActivityIndicator color="#86efac" size="small" />}
          <TouchableOpacity className="flex-row" onPress={handleLogout}>
            <Feather name="log-out" size={24} color="#dc2626"/>
            <Text className="text-xl ml-1 font-psemibold text-red-600 mb-1">Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        <View className="bg-black-100 rounded-2xl p-6 mb-6">
          <View className="items-center mb-4 flex-row">
            <View className="w-24 h-24 rounded-full bg-secondary/40 items-center justify-center mb-3">
              <Ionicons name="person" size={50} color="white" />
            </View>
            <View className="ml-4">
              <Text className="text-xl font-pbold text-white">{profileDetails?.username || user?.name || "User"}</Text>
              <Text className="text-sm font-pextralight text-gray-300">{user?.email || "email@example.com"}</Text>
            </View>
          </View>
          
          <View className="border-t border-white/10 pt-4 mt-2">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-psemibold text-white">Account Details</Text>
              <TouchableOpacity 
                onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                disabled={loading}
                className="flex-row items-center"
              >
                <Text className="text-secondary font-pmedium mr-2">
                  {isEditing ? "Save" : "Edit"}
                </Text>
                <MaterialIcons
                  name={isEditing ? "save" : "edit"} 
                  size={18} 
                  color="#86efac" 
                />
              </TouchableOpacity>
            </View>
            
            {renderProfileField("Age", profileDetails?.age, "Enter age", "age")}
            {renderProfileField("Height (cm)", profileDetails?.height, "Enter height", "height")}
            {renderProfileField("Weight (kg)", profileDetails?.weight, "Enter weight", "weight")}
            {renderProfileField("Phone Number", profileDetails?.phoneNumber,"Enter Phone Number","phoneNumber")}
            
            <View className="mb-4">
              <Text className="text-sm font-psemibold text-secondary mb-1">Health Conditions</Text>
              {isEditing ? (
                <TextInput
                  className="bg-black-100 rounded-lg p-3 text-white font-pregular border-b border-secondary"
                  placeholder="Enter health conditions (allergies, etc.)"
                  placeholderTextColor="#B0B7C1"
                  value={profileData.healthConditions}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, healthConditions: text }))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              ) : (
                <View className="bg-black-100 rounded-lg p-3">
                  <Text className="text-white font-pregular">
                    {profileDetails?.healthConditions || "Not specified"}
                  </Text>
                </View>
              )}
            </View>
            
            <View className="border-t border-white/10 pt-4 mt-2">
              <Text className="text-base font-pmedium text-white mb-1">System Information</Text>
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
        </View>
        
        <View className="space-y-4">
          <TouchableOpacity 
            className="bg-black-100 rounded-xl p-4 flex-row items-center justify-between"
            onPress={() => Alert.alert("Coming Soon", "This feature will be available soon!")}>
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={24} color="#86efac" />
              <Text className="text-white font-pmedium ml-3">Privacy & Security</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#B0B7C1" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-black-100 rounded-xl p-4 flex-row items-center justify-between"
            onPress={() => Alert.alert("Coming Soon", "This feature will be available soon!")}>
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={24} color="#86efac" />
              <Text className="text-white font-pmedium ml-3">Help & Support</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#B0B7C1" />
          </TouchableOpacity>
        </View>
        
        <CustomButton
          text="Sign Out"
          handlePress={handleLogout}
          containerStyles="bg-red-500 mt-6 mb-6"
          textStyles="text-white font-pbold"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default Settings;