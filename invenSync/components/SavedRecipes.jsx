import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecipeCard from './RecipeCard';
import useRecipeStore from '../lib/recipeStore';

const SavedRecipes = ({ onClose, onViewRecipe }) => {
  const { savedRecipes, loading, fetchSavedRecipes, deleteRecipeById } = useRecipeStore();

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const handleDelete = (recipeId) => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const success = await deleteRecipeById(recipeId);
            if (success) {
              Alert.alert("Success", "Recipe deleted successfully!");
            } else {
              Alert.alert("Error", "Failed to delete recipe. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-primary pt-4 px-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white font-pbold text-2xl">Saved Recipes</Text>
        <TouchableOpacity onPress={onClose} className="p-2">
          <Ionicons name="close-circle-outline" size={24} color="#86efac" />
        </TouchableOpacity>
      </View>
      
      {/* Recipes grid */}
      {loading ? (
        <ActivityIndicator color="#86efac" size="large" />
      ) : savedRecipes.length > 0 ? (
        <FlatList
          data={savedRecipes}
          renderItem={({ item }) => (
            <RecipeCard 
              recipe={item} 
              onPress={() => onViewRecipe(item)}
              onDelete={handleDelete} 
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="bookmark-outline" size={64} color="#3E5359" />
          <Text className="text-white font-pmedium text-lg mt-4 mb-2">No saved recipes yet</Text>
          <Text className="text-gray-200 font-plight text-center px-6">
            Generate and save recipes to access them anytime, even offline!
          </Text>
        </View>
      )}
    </View>
  );
};

export default SavedRecipes;