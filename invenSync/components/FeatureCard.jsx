import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const FeatureCard = ({ title, description, icon }) => {
  // Animation setup
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Handle press-in animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95, // Slightly scale down on press
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  // Handle press-out animation
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, // Return to original size
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        className = "p-4 rounded-xl mb-4 bg-secondary border-2 border-secondary-100 shadow-md"
        style={{ transform: [{ scale: scaleAnim }] }}
      >
        <View className="flex-row items-center mb-2">
          {icon && (
            <MaterialIcons
              name={icon}
              size={24}
              color="#000"
              className="mr-3"
            />
          )}
          <Text className="text-lg font-psemibold text-black">
            {title}
          </Text>
        </View>
        <Text className="text-base font-pregular text-blue-800">
          {description}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default FeatureCard;