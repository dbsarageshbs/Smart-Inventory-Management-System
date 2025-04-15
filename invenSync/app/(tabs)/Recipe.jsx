import React, { useState, useEffect, useRef } from 'react';
import {
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Switch,
  Keyboard,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Fontisto, AntDesign } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useGlobalContext } from '../../context/GlobalProvider';
import { getUserInventory } from '../../lib/inventoryService';
import { getUserProfile } from '../../lib/appwrite';
import { generateRecipe } from '../../lib/chef';
import useRecipeStore from '../../lib/recipeStore';
import SavedRecipes from '../../components/SavedRecipes';
import * as Haptics from 'expo-haptics';

const Recipe = () => {
  const { user } = useGlobalContext();
  const { savedRecipes, setCurrentRecipe, currentRecipe, saveCurrentRecipe, isRecipeSaved, fetchSavedRecipes } = useRecipeStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState({
    vegetarian: false,
    lowCarb: false,
    highProtein: false,
    dairyFree: false
  });
  
  const [recipeSettings, setRecipeSettings] = useState({
    servings: 2, 
    difficulty: 'medium',
    mealType: 'any', 
    cuisine: 'any'
  });
  
  const [recipe, setRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Load user inventory and profile
  useEffect(() => {
    if (user?.$id) {
      setLoading(true);
      
      // Load inventory
      getUserInventory(user.$id)
        .then(items => {
          setInventoryItems(items || []);
        })
        .catch(error => {
          console.error('Error fetching inventory:', error);
          Alert.alert('Error', 'Failed to load your inventory items');
        })
        .finally(() => setLoading(false));
        
      // Load user profile for recipe personalization  
      getUserProfile(user.$id)
        .then(profile => {
          setUserProfile(profile);
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
        });
        
      // Load saved recipes  
      fetchSavedRecipes();
    }
  }, [user?.$id]);
  
  // Update current recipe in store when recipe changes
  useEffect(() => {
    if (recipe) {
      setCurrentRecipe(recipe);
    }
  }, [recipe]);
  
  const filteredInventory = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const toggleIngredientSelection = (ingredient) => {
    // Check if ingredient is already selected using $id
    const isSelected = selectedIngredients.some(item => item.$id === ingredient.$id);
    if (isSelected) {
      // Remove ingredient
      setSelectedIngredients(prev => prev.filter(item => item.$id !== ingredient.$id));
    } else {
      // Add ingredient with $id and initial quantity
      setSelectedIngredients(prev => [
        ...prev,
        {
          ...ingredient,
          quantity: 1,
          // Ensure we preserve the $id from original inventory item
          $id: ingredient.$id
        }
      ]);
    }
    
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const updateIngredientQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) return; // Prevent zero or negative quantities
    
    setSelectedIngredients(selectedIngredients.map(item =>
      item.$id === id ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  const removeIngredient = (id) => {
    setSelectedIngredients(selectedIngredients.filter(item => item.$id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const toggleDietaryPreference = (preference) => {
    setDietaryPreferences(prev => ({
      ...prev,
      [preference]: !prev[preference]
    }));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleAddCustomItem = () => {
    if (!customInput.trim()) return;
    
    const customId = `custom-${Date.now()}`;
    const newItem = {
      $id: customId, // Use $id for consistency with API items
      name: customInput.trim(),
      quantity: 1,
      unit: 'item',
      category: 'Custom',
      isCustom: true
    };
    
    setSelectedIngredients([...selectedIngredients, newItem]);
    setCustomInput('');
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const getMealTypeIcon = (type) => {
    switch (type) {
      case 'breakfast': return 'day-haze';
      case 'lunch': return 'restaurant-outline';
      case 'dinner': return 'moon-outline';
      case 'snack': return 'cafe-outline';
      case 'dessert': return 'ice-cream-outline';
      default: return 'fast-food-outline';
    }
  };
  
  const handleGenerateRecipe = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('Select Ingredients', 'Please select at least one ingredient for your recipe');
      return;
    }
    
    setGenerating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const generatedRecipe = await generateRecipe(
        selectedIngredients, 
        dietaryPreferences, 
        recipeSettings,
        userProfile
      );
      
      setRecipe(generatedRecipe);
      if (scrollViewRef.current)
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate recipe. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  const resetRecipe = () => {
    setRecipe(null);
    setSelectedIngredients([]);
    setDietaryPreferences({
      vegetarian: false,
      lowCarb: false,
      highProtein: false,
      dairyFree: false
    });
    
    if (scrollViewRef.current)
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleSaveRecipe = async () => {
    if (!recipe) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (scrollViewRef.current)
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    try {
      const success = await saveCurrentRecipe();
      
      if (success) {
        Alert.alert("Success", "Recipe saved successfully!");
      } else {
        Alert.alert("Error", "Failed to save recipe. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while saving the recipe.");
    }
  };
  
  const tryDifferentRecipe = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('No ingredients selected', 'Please select ingredients first');
      return;
    }
    
    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const generatedRecipe = await generateRecipe(
        selectedIngredients, 
        dietaryPreferences, 
        recipeSettings,
        userProfile
      );
      
      setRecipe(generatedRecipe);
      // Scroll to the top of the page
      if (scrollViewRef.current)
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate a different recipe. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  const viewSavedRecipe = (savedRecipe) => {
    setShowSaved(false);
    setRecipe(savedRecipe);
  };
  
  return (
    <SafeAreaView className="flex-1 bg-primary">
      {/* Saved Recipes Modal */}
      <Modal
        visible={showSaved}
        animationType="slide"
        onRequestClose={() => setShowSaved(false)}
      >
        <SavedRecipes 
          onClose={() => setShowSaved(false)} 
          onViewRecipe={viewSavedRecipe}
        />
      </Modal>
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} ref={scrollViewRef}>
        <View className="p-6 pb-4">
          {/* Header with saved recipes button */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-pbold text-3xl">Recipe Generator</Text>
            <TouchableOpacity 
              onPress={() => setShowSaved(true)}
              className="bg-black-100 rounded-full p-2"
            >
              <Ionicons name="bookmark" size={22} color="#86efac" />
              {savedRecipes.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-secondary rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-primary text-xs font-pbold">
                    {savedRecipes.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text className="text-gray-100 font-plight mb-6">Create custom recipes from your inventory</Text>
          
          {!recipe ? (
            <>
              {/* Ingredient Selection Section */}
              <View className="mb-6">
                <Text className="text-white font-psemibold text-xl mb-4">Select Ingredients</Text>
                
                <View className="bg-black-100 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center bg-black-200 rounded-lg px-3 py-2 mb-4">
                    <Ionicons name="search" size={20} color="#86efac" />
                    <TextInput
                      className="flex-1 text-white ml-2 font-pregular"
                      placeholder="Search your inventory..."
                      placeholderTextColor="#B0B7C1"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                  
                  {loading ? (
                    <ActivityIndicator color="#86efac" size="large" className="py-4" />
                  ) : (
                    <>
                      {filteredInventory.length > 0 ? (
                        <View className="mb-3">
                          <Text className="text-gray-100 font-pmedium text-sm mb-2">From Your Inventory:</Text>
                          <View className="flex-row flex-wrap">
                            {filteredInventory.map((item) => (
                              <TouchableOpacity
                                key={item.$id}  // Use $id as key
                                onPress={() => toggleIngredientSelection(item)}
                                className={`mr-2 mb-2 rounded-lg px-3 py-2 ${
                                  selectedIngredients.some(i => i.$id === item.$id) 
                                    ? 'bg-secondary' 
                                    : 'bg-black-200'
                                }`}
                              >
                                <Text className={`${selectedIngredients.some(i => i.$id === item.$id) 
                                    ? 'text-black-200' 
                                    : 'text-white'
                                  }`}
                                >
                                  {item.name}
                                  {selectedIngredients.some(i => i.$id === item.$id) && (
                                    <Ionicons name="checkmark-circle" size={16} color="#1A2E35" />
                                  )}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      ) : (
                        <Text className="text-secondary py-2 text-center text-lg">
                          {searchQuery ? "No matching items found !" : "Your inventory is empty"}
                        </Text>
                      )}
                    </>
                  )}
                  
                  <View className="mt-2">
                    <Text className="text-gray-100 font-pmedium text-sm mb-2">Add Custom Ingredient:</Text>
                    <View className="flex-row">
                      <TextInput
                        className="flex-1 bg-black-200 rounded-lg px-3 py-2 text-white font-pregular mr-2"
                        placeholder="Add ingredient not in inventory..."
                        placeholderTextColor="#B0B7C1"
                        value={customInput}
                        onChangeText={setCustomInput}
                      />
                      <TouchableOpacity 
                        onPress={handleAddCustomItem}
                        className="bg-secondary rounded-lg px-3 py-2"
                      >
                        <Text className="text-primary font-pmedium">Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {/* Selected Ingredients with Quantity Controls */}
                {selectedIngredients.length > 0 && (
                  <View className="bg-black-100 rounded-xl p-4 mb-4">
                    <Text className="text-white font-pmedium mb-2">Selected Ingredients:</Text>
                    
                    {selectedIngredients.map(item => (
                      <View 
                        key={item.$id}
                        className="flex-row items-center justify-between bg-black-200 rounded-lg px-3 py-3 mb-2"
                      >
                        <Text className="text-white font-pmedium text-sm flex-1">{item.name}</Text>
                        
                        <View className="flex-row items-center">
                          <TouchableOpacity 
                            onPress={() => updateIngredientQuantity(item.$id, item.quantity - 1)}
                            className="bg-black-100 rounded-full h-7 w-7 items-center justify-center"
                          >
                            <Ionicons name="remove" size={18} color="#86efac" />
                          </TouchableOpacity>
                          
                          <Text className="text-white font-pmedium mx-3 min-w-[20px] text-center">
                            {item.quantity}
                          </Text>
                          
                          <TouchableOpacity 
                            onPress={() => updateIngredientQuantity(item.$id, item.quantity + 1)}
                            className="bg-black-100 rounded-full h-7 w-7 items-center justify-center"
                          >
                            <Ionicons name="add" size={18} color="#86efac" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            onPress={() => removeIngredient(item.$id)}
                            className="ml-4"
                          >
                            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Dietary Preferences Section */}
              <View className="mb-6">
                <Text className="text-white font-psemibold text-xl mb-4">Dietary Preferences</Text>
                <View className="bg-black-100 rounded-xl p-4">
                  <View className="flex-row flex-wrap justify-between">
                    {Object.entries(dietaryPreferences).map(([key, value]) => (
                      <TouchableOpacity 
                        key={key}
                        onPress={() => toggleDietaryPreference(key)}
                        className={`mb-3 w-[48%] flex-row items-center justify-between ${
                          value ? 'bg-secondary/30 p-3 rounded-lg' : 'p-3'
                        }`}
                      >
                        <Text className="text-white font-pmedium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Text>
                        <Switch
                          value={value}
                          onValueChange={() => toggleDietaryPreference(key)}
                          trackColor={{ false: "#3E5359", true: "#86efac" }}
                          thumbColor={value ? "#1A2E35" : "#f4f3f4"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Recipe Settings Section */}
              <View className="mb-6">
                <Text className="text-white font-psemibold text-xl mb-4">Recipe Settings</Text>
                <View className="bg-black-100 rounded-xl p-4">
                  {/* Number of Servings */}
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-white font-pmedium">Number of Servings</Text>
                      <Text className="text-secondary font-pregular">{recipeSettings.servings}</Text>
                    </View>
                    <Slider
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      value={recipeSettings.servings}
                      onValueChange={value => setRecipeSettings({...recipeSettings, servings: value})}
                      minimumTrackTintColor="#86efac"
                      maximumTrackTintColor="#3E5359"
                      thumbTintColor="#86efac"
                    />
                    <View className="flex-row justify-between">
                      <Text className="text-gray-100 text-xs font-plight">1 Person</Text>
                      <Text className="text-gray-100 text-xs font-plight">10 People</Text>
                    </View>
                  </View>
                  
                  {/* Difficulty Selection */}
                  <View className="mb-4">
                    <Text className="text-white font-pmedium mb-2">Difficulty Level</Text>
                    <View className="flex-row justify-between">
                      {['easy', 'medium', 'hard'].map(level => (
                        <TouchableOpacity 
                          key={level}
                          onPress={() => setRecipeSettings({...recipeSettings, difficulty: level})}
                          className={`flex-1 mx-1 p-3 rounded-lg ${
                            recipeSettings.difficulty === level 
                              ? 'bg-secondary' 
                              : 'bg-black-200'
                          }`}
                        >
                          <Text className={`text-center font-pmedium ${
                            recipeSettings.difficulty === level 
                              ? 'text-primary' 
                              : 'text-white'
                          }`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {/* Meal Type Selection */}
                  <View className="mb-4">
                    <Text className="text-white font-pmedium mb-2">Meal Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {['any', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'].map(type => (
                        <TouchableOpacity 
                          key={type}
                          onPress={() => setRecipeSettings({...recipeSettings, mealType: type})}
                          className={`mr-2 p-3 rounded-lg flex-row items-center ${
                            recipeSettings.mealType === type 
                              ? 'bg-secondary' 
                              : 'bg-black-200'
                          }`}
                        >
                          {type === 'breakfast' ? (
                            <Fontisto 
                              name="day-haze" 
                              size={16} 
                              color={recipeSettings.mealType === type ? '#1A2E35' : '#86efac'} 
                            />
                          ) : (
                            <Ionicons 
                              name={getMealTypeIcon(type)} 
                              size={16} 
                              color={recipeSettings.mealType === type ? '#1A2E35' : '#86efac'} 
                            />
                          )}
                          <Text className={`ml-1 font-pmedium ${
                            recipeSettings.mealType === type 
                              ? 'text-primary' 
                              : 'text-white'
                          }`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                            
                  {/* Cuisine Type Selection */}
                  <View>
                    <Text className="text-white font-pmedium mb-2">Cuisine</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {['any', 'south Indian', 'North Indian', 'chinese', 'italian', 'mexican', 'french'].map(cuisine => (
                        <TouchableOpacity 
                          key={cuisine}
                          onPress={() => setRecipeSettings({...recipeSettings, cuisine: cuisine})}
                          className={`mr-2 p-3 rounded-lg ${
                            recipeSettings.cuisine === cuisine 
                              ? 'bg-secondary' 
                              : 'bg-black-200'
                          }`}
                        >
                          <Text className={`font-pmedium ${
                            recipeSettings.cuisine === cuisine 
                              ? 'text-primary' 
                              : 'text-white'
                          }`}>
                            {cuisine === 'any' ? 'Any Cuisine' : cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
              
              {/* Generate Button */}
              <TouchableOpacity 
                onPress={handleGenerateRecipe}
                disabled={generating}
                className={`bg-secondary rounded-xl py-4 mb-6 ${generating ? 'opacity-70' : ''}`}
              >
                {generating ? (
                  <ActivityIndicator color="#1A2E35" />
                ) : (
                  <Text className="text-primary font-pbold text-center text-lg">Generate Recipe</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* Recipe Result View */
            <View className="mb-6">
              <View className="bg-black-100 rounded-xl p-4 mb-4">
                <Text className="text-secondary font-pbold text-2xl mb-2">{recipe.title}</Text>
                <Text className="text-white font-plight mb-4">{recipe.description}</Text>
                
                <View className="flex-row justify-between mb-4">
                  <View className="items-center">
                    <Text className="text-gray-100 text-xs font-plight">Prep Time</Text>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#86efac" className="mr-1" />
                      <Text className="text-white font-pmedium">{recipe.prepTime} min</Text>
                    </View>
                  </View>
                  
                  <View className="items-center">
                    <Text className="text-gray-100 text-xs font-plight">Cook Time</Text>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="pot-steam" size={16} color="#86efac" className="mr-1" />
                      <Text className="text-white font-pmedium">{recipe.cookTime} min</Text>
                    </View>
                  </View>
                  
                  <View className="items-center">
                    <Text className="text-gray-100 text-xs font-plight">Difficulty</Text>
                    <Text className="text-white font-pmedium capitalize">{recipe.difficulty}</Text>
                  </View>
                  
                  <View className="items-center">
                    <Text className="text-gray-100 text-xs font-plight">Servings</Text>
                    <Text className="text-white font-pmedium">{recipe.servings}</Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-secondary font-psemibold text-lg mb-2">Ingredients</Text>
                  {recipe.ingredients.map((ingredient, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <View className="w-2 h-2 rounded-full bg-secondary mr-2" />
                      <Text className="text-white font-pregular">
                        {ingredient.quantity} {ingredient.unit} {ingredient.name}
                      </Text>
                    </View>
                  ))}
                </View>
                
                <View className="mb-4">
                  <Text className="text-secondary font-psemibold text-lg mb-2">Instructions</Text>
                  {recipe.instructions.map((step, index) => (
                    <View key={index} className="flex-row mb-3">
                      <View className="bg-secondary/30 h-6 w-6 rounded-full items-center justify-center mr-2 mt-1">
                        <Text className="text-secondary font-pmedium text-sm">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-pregular">{step}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                
                <View className="mb-4">
                  <Text className="text-secondary font-psemibold text-lg mb-2">Nutrition</Text>
                  <View className="flex-row justify-between bg-black-200 rounded-lg p-3">
                    <View>
                      <Text className="text-gray-100 text-xs font-plight">Calories</Text>
                      <Text className="text-white font-pmedium">{recipe.nutrition.calories} kcal</Text>
                    </View>
                    <View>
                      <Text className="text-gray-100 text-xs font-plight">Protein</Text>
                      <Text className="text-white font-pmedium">{recipe.nutrition.protein}g</Text>
                    </View>
                    <View>
                      <Text className="text-gray-100 text-xs font-plight">Carbs</Text>
                      <Text className="text-white font-pmedium">{recipe.nutrition.carbs}g</Text>
                    </View>
                    <View>
                      <Text className="text-gray-100 text-xs font-plight">Fat</Text>
                      <Text className="text-white font-pmedium">{recipe.nutrition.fat}g</Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row flex-wrap mb-4">
                  {recipe.tags.map((tag, index) => (
                    <View key={index} className="bg-black-200 rounded-full px-3 py-1 mr-2 mb-2">
                      <Text className="text-secondary text-xs font-pmedium">#{tag}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Action buttons */}
                <View className="flex-row justify-between mt-4">
                  <TouchableOpacity 
                    onPress={resetRecipe}
                    className="bg-black-200 rounded-lg py-3 px-4 flex-1 mr-2"
                  >
                    <Text className="text-white font-pmedium text-center">New Recipe</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={tryDifferentRecipe}
                    className="bg-black-200 rounded-lg py-3 px-4 flex-1 mr-2"
                    disabled={generating}
                  >
                    {generating ? (
                      <ActivityIndicator color="#86efac" size="small" />
                    ) : (
                      <Text className="text-white font-pmedium text-center">Try Different</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleSaveRecipe}
                    className={`rounded-lg py-3 px-4 flex-1 ${isRecipeSaved(recipe.id) ? 'bg-secondary/30' : 'bg-secondary'}`}
                  >
                    <Text className="text-primary font-pbold text-center flex-row items-center justify-center">
                      {isRecipeSaved(recipe.id) ? 'Saved' : 'Save Recipe'}
                      {isRecipeSaved(recipe.id) && (
                        <AntDesign name="checkcircleo" size={16} color="#1A2E35" />
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Recipe;