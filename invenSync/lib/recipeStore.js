import { create } from 'zustand';
import { getSavedRecipes, saveRecipe, deleteRecipe } from './chef';

const useRecipeStore = create((set, get) => ({
  // State
  savedRecipes: [],
  loading: false,
  currentRecipe: null,
  
  // Actions
  fetchSavedRecipes: async () => {
    set({ loading: true });
    try {
      const recipes = await getSavedRecipes();
      set({ savedRecipes: recipes, loading: false });
    } catch (error) {
      console.error("Error fetching recipes:", error);
      set({ loading: false });
    }
  },
  
  saveCurrentRecipe: async () => {
    const { currentRecipe } = get();
    if (!currentRecipe) return false;
    
    try {
      const success = await saveRecipe(currentRecipe);
      if (success) {
        // Refresh saved recipes list
        get().fetchSavedRecipes();
      }
      return success;
    } catch (error) {
      console.error("Error saving current recipe:", error);
      return false;
    }
  },
  
  setCurrentRecipe: (recipe) => {
    set({ currentRecipe: recipe });
  },
  
  deleteRecipeById: async (recipeId) => {
    try {
      const success = await deleteRecipe(recipeId);
      if (success) {
        // Update the local state to reflect deletion
        const { savedRecipes } = get();
        set({ savedRecipes: savedRecipes.filter(r => r.id !== recipeId) });
      }
      return success;
    } catch (error) {
      console.error("Error deleting recipe:", error);
      return false;
    }
  },
  
  clearCurrentRecipe: () => {
    set({ currentRecipe: null });
  },
  
  isRecipeSaved: (recipeId) => {
    const { savedRecipes } = get();
    return savedRecipes.some(recipe => recipe.id === recipeId);
  },
}));

export default useRecipeStore;