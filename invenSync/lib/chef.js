import AsyncStorage from "@react-native-async-storage/async-storage";

// In a real production app, this would be stored securely
// For a demo/prototype, we're using the value from .env file
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Generate a recipe using Google's Gemini API
 * 
 * @param {Array} ingredients - List of ingredient objects
 * @param {Object} preferences - Dietary preferences
 * @param {Object} settings - Recipe settings like difficulty, servings, etc.
 * @param {Object} userProfile - User profile data for personalization
 * @returns {Promise<Object>} - Recipe data
 */
export const generateRecipe = async (ingredients, preferences, settings, userProfile = {}) => {
  try {
    // Extract ingredient names and quantities for the prompt
    const ingredientsList = ingredients.map(ing => 
      `${ing.quantity || 1} ${ing.unit || 'piece/unit'} of ${ing.name}`
    ).join(', ');
    
    // Build dietary restrictions string
    const dietaryRestrictions = Object.entries(preferences)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name)
      .join(', ');
    
    // Create personalization string based on user profile
    let personalization = '';
    if (userProfile) {
      const { age, weight, height, healthConditions } = userProfile;
      
      if (age) personalization += `age: ${age}, `;
      if (weight) personalization += `weight: ${weight}kg, `;
      if (height) personalization += `height: ${height}cm, `;
      if (healthConditions) personalization += `health conditions: ${healthConditions}, `;
    }

    // Construct the prompt for Gemini - simplified prompt for more reliable parsing
    const prompt = `
      Generate a recipe using these ingredients: ${ingredientsList}.
      
      Recipe specifications:
      - Cuisine type: ${settings.cuisine !== 'any' ? settings.cuisine : 'flexible'}
      - Meal type: ${settings.mealType !== 'any' ? settings.mealType : 'any meal'}
      - Difficulty level: ${settings.difficulty}
      - Number of servings: ${settings.servings}
      ${dietaryRestrictions ? `- Dietary restrictions: ${dietaryRestrictions}` : ''}
      ${personalization ? `- Personalize for someone with: ${personalization}` : ''}
      
      Return ONLY a valid JSON object with this exact structure - no additional text, markdown, or explanations:
      {
        "title": "Recipe Title",
        "description": "Brief description",
        "prepTime": 15,
        "cookTime": 20,
        "difficulty": "medium",
        "servings": 2,
        "ingredients": [
          {"name": "ingredient1", "quantity": 1, "unit": "cup"},
          {"name": "ingredient2", "quantity": 2, "unit": "tbsp"}
        ],
        "instructions": [
          "Step 1 instruction",
          "Step 2 instruction"
        ],
        "tags": ["tag1", "tag2"],
        "nutrition": {
          "calories": 300,
          "protein": 15,
          "carbs": 30,
          "fat": 10
        }
      }
    `;
    
    // Call Gemini API
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,  // Lower temperature for more consistent output
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40,
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("API Error:", data);
      throw new Error(data.error?.message || 'Failed to generate recipe');
    }
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      console.error("Empty response:", data);
      throw new Error("No content returned from API");
    }
    
    // Extract the recipe JSON from the response
    const textResponse = data.candidates[0].content.parts[0].text || '';
    console.log("Raw API response:", textResponse.substring(0, 200) + "...");
    
    // Improved JSON extraction
    let jsonData;
    try {
      // Try to find JSON block in markdown first
      const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                        textResponse.match(/\{[\s\S]*\}/);
                        
      let jsonString = jsonMatch ? jsonMatch[0].replace(/```(?:json)?\s*|\s*```/g, '') : textResponse;
      
      // Clean up any leftover text before or after JSON
      jsonString = jsonString.trim();
      if (!jsonString.startsWith('{')) {
        jsonString = '{' + jsonString.substring(jsonString.indexOf('{') + 1);
      }
      if (!jsonString.endsWith('}')) {
        jsonString = jsonString.substring(0, jsonString.lastIndexOf('}') + 1);
      }
      
      console.log("Attempting to parse JSON:", jsonString.substring(0, 100) + "...");
      
      // Parse the JSON response
      jsonData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Problematic text:", textResponse);
      
      // Fallback response for development - create a basic recipe structure
      jsonData = {
        title: "Simple Recipe with " + ingredients[0].name,
        description: "A simple recipe created when we couldn't parse the AI response.",
        prepTime: 10,
        cookTime: 15,
        difficulty: settings.difficulty,
        servings: settings.servings,
        ingredients: ingredients.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || "piece"
        })),
        instructions: [
          "Combine all ingredients in a bowl",
          "Cook until done",
          "Serve hot"
        ],
        tags: ["simple", "quick"],
        nutrition: {
          calories: 200,
          protein: 10,
          carbs: 20,
          fat: 5
        }
      };
    }
    
    // Add timestamp and unique ID
    jsonData.createdAt = new Date().toISOString();
    jsonData.id = `recipe-${Date.now()}`;
    
    return jsonData;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
};

/**
 * Save a recipe to AsyncStorage
 * 
 * @param {Object} recipe - The recipe to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveRecipe = async (recipe) => {
  try {
    // First get existing saved recipes
    const savedRecipesJson = await AsyncStorage.getItem('savedRecipes');
    let savedRecipes = savedRecipesJson ? JSON.parse(savedRecipesJson) : [];
    
    // Add the new recipe (make sure it has an id)
    if (!recipe.id) {
      recipe.id = `recipe-${Date.now()}`;
    }
    
    // Check if recipe already exists by ID
    const existingIndex = savedRecipes.findIndex(r => r.id === recipe.id);
    if (existingIndex >= 0) {
      // Update existing
      savedRecipes[existingIndex] = recipe;
    } else {
      // Add new
      savedRecipes.push(recipe);
    }
    
    // Save back to storage
    await AsyncStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    return true;
  } catch (error) {
    console.error("Error saving recipe:", error);
    return false;
  }
};

/**
 * Get all saved recipes
 * 
 * @returns {Promise<Array>} - Array of saved recipes
 */
export const getSavedRecipes = async () => {
  try {
    const savedRecipesJson = await AsyncStorage.getItem('savedRecipes');
    return savedRecipesJson ? JSON.parse(savedRecipesJson) : [];
  } catch (error) {
    console.error("Error getting saved recipes:", error);
    return [];
  }
};

/**
 * Delete a saved recipe
 * 
 * @param {string} recipeId - ID of the recipe to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteRecipe = async (recipeId) => {
  try {
    const savedRecipesJson = await AsyncStorage.getItem('savedRecipes');
    if (!savedRecipesJson) return true;
    
    let savedRecipes = JSON.parse(savedRecipesJson);
    savedRecipes = savedRecipes.filter(recipe => recipe.id !== recipeId);
    
    await AsyncStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    return true;
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return false;
  }
};