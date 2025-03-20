import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, FormField } from "../../components";

const Recipe = ({ navigation }) => {
  const [ingredients, setIngredients] = useState('');
  const [dishType, setDishType] = useState('');
  const [dietType, setDietType] = useState('vegetarian'); // Default to vegetarian
  const [cuisine, setCuisine] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRecipe = () => {
    // This will be handled by you separately with LLM API calls
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      // Navigate to results or show results
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView className="flex-1 px-5">
        <View className="flex-row items-center mt-4 mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#86efac" />
          </TouchableOpacity>
          <Text className="text-2xl font-pbold text-white">Recipe Generator</Text>
        </View>

        {/* Diet Preference Selection */}
        <View className="mb-6">
          <Text className="text-xl font-psemibold text-white mb-3">Diet Preference</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              onPress={() => setDietType('vegetarian')}
              className={`flex-1 py-4 mr-2 rounded-xl items-center justify-center ${dietType === 'vegetarian' ? 'bg-secondary' : 'bg-black-100'}`}
            >
              <Text className={`text-lg font-pmedium ${dietType === 'vegetarian' ? 'text-primary' : 'text-white'}`}>Vegetarian</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDietType('non-vegetarian')}
              className={`flex-1 py-4 ml-2 rounded-xl items-center justify-center ${dietType === 'non-vegetarian' ? 'bg-secondary' : 'bg-black-100'}`}
            >
              <Text className={`text-lg font-pmedium ${dietType === 'non-vegetarian' ? 'text-primary' : 'text-white'}`}>Non-Vegetarian</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Ingredients */}
        <FormField
          title="Available Ingredients"
          value={ingredients}
          placeholder="e.g. tomatoes, onions, pasta, chicken"
          handleChangeText={setIngredients}
          multiline={true}
          numberOfLines={3}
          otherStyles="mb-4"
        />

        {/* Dish Type */}
        <FormField
          title="Dish Type (Optional)"
          value={dishType}
          placeholder="e.g. main course, dessert, appetizer"
          handleChangeText={setDishType}
          otherStyles="mb-4"
        />

        {/* Cuisine */}
        <FormField
          title="Cuisine (Optional)"
          value={cuisine}
          placeholder="e.g. Italian, Indian, Mexican"
          handleChangeText={setCuisine}
          otherStyles="mb-6"
        />

        {/* Tips Card */}
        <View className="bg-black-100 p-4 rounded-xl mb-8">
          <Text className="text-lg font-psemibold text-secondary mb-2">Tips for better recipes:</Text>
          <Text className="text-gray-200 font-pregular">• List all available ingredients</Text>
          <Text className="text-gray-200 font-pregular">• Specify any dietary restrictions</Text>
          <Text className="text-gray-200 font-pregular">• Mention cooking equipment available</Text>
          <Text className="text-gray-200 font-pregular">• Include preferred cooking time if any</Text>
        </View>

        {/* Generate Button */}
        <CustomButton
          text={isGenerating ? "Generating Recipe..." : "Generate Recipe"}
          handlePress={handleGenerateRecipe}
          containerStyles="bg-secondary mb-6"
          textStyles="text-primary"
          isLoading={isGenerating}
        />

        {isGenerating && (
          <View className="items-center mb-6">
            <ActivityIndicator size="large" color="#86efac" />
            <Text className="text-gray-200 font-pmedium mt-2">Crafting your perfect recipe...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Recipe;