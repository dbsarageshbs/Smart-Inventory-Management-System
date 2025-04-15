import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_KEY;

const RecipeCard = ({ recipe, onPress, onDelete }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoadingImage(true);

        const query = `${recipe.title} ${recipe.cuisine || ''} ${recipe.mealType || ''} ${recipe.tags?.join(' ') || ''} food`;
        
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
          {
            headers: {
              Authorization: PEXELS_API_KEY,
            },
          }
        );
        
        const data = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          setImageUrl(data.photos[0].src.medium);
        } else {
          // Fallback to a generic food search
          const fallbackResponse = await fetch(
            'https://api.pexels.com/v1/search?query=food&per_page=1',
            {
              headers: {
                Authorization: PEXELS_API_KEY,
              },
            }
          );
          
          const fallbackData = await fallbackResponse.json();
          setImageUrl(fallbackData.photos[0].src.medium);
        }
      } catch (error) {
        setImageUrl(null);
      } finally {
        setLoadingImage(false);
      }
    };
  
    fetchImage();
  }, [recipe.title]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-black-100 rounded-xl overflow-hidden mb-4 shadow-md w-[100%] max-w-96 mx-auto h-[250px]"
    >
      {/* Image section */}
      <View className="h-48 w-full relative">
        {loadingImage ? (
          <View className="h-full w-full items-center justify-center bg-black-200">
            <ActivityIndicator size="large" color="#86efac" />
          </View>
        ) : imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-black-200">
            <Text className="text-gray-400 font-pmedium">Image not available</Text>
          </View>
        )}

        <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-2">
          <Text className="text-white font-psemibold text-sm" numberOfLines={1}>
            {recipe.title}
          </Text>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={() => onDelete(recipe.id)}
          className="absolute top-2 right-2 bg-black/40 rounded-full p-1"
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>

        {/* Difficulty badge */}
        <View className="absolute top-2 left-2 bg-secondary/80 rounded-full px-2 py-1 flex-row items-center">
          <Text className="text-primary text-xs font-pmedium capitalize">
            {recipe.difficulty}
          </Text>
        </View>
      </View>

      {/* Info section */}
      <View className="p-3">
        {/* Cuisine & Meal type */}
        <View className="flex-row flex-wrap mb-2">
          {recipe.tags &&
            recipe.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                className="bg-black-200 rounded-full px-2 py-1 mr-1 mb-1"
              >
                <Text className="text-secondary text-xs">{tag}</Text>
              </View>
            ))}
        </View>

        {/* Prep & cook time */}
        <View className="flex-row justify-between">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="clock-outline" size={14} color="#86efac" />
            <Text className="text-white text-xs ml-1">
              {recipe.prepTime + recipe.cookTime} min
            </Text>
          </View>

          <View className="flex-row items-center">
            <MaterialCommunityIcons name="account-outline" size={14} color="#86efac" />
            <Text className="text-white text-xs ml-1">
              {recipe.servings} {recipe.servings > 1 ? 'servings' : 'serving'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RecipeCard;