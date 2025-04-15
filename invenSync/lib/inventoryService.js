import { Databases, ID, Query } from "react-native-appwrite";
import { client } from "./appwrite";

// Initialize Appwrite objects
const databases = new Databases(client);

// Appwrite Constants
const DATABASE_ID = "invensync_db";
const INVENTORY_COLLECTION_ID = "user_inventory";

/**
 * Get the inventory for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of inventory items
 */
export const getUserInventory = async (userId) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      INVENTORY_COLLECTION_ID,
      [
        Query.equal("userId", userId)
      ]
    );
    
    return response.documents;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    throw new Error("Failed to fetch inventory items");
  }
};

/**
 * Add a new item to the user's inventory
 * @param {string} userId - The user ID
 * @param {Object} itemData - The item data to add
 * @returns {Promise<Object>} - The created inventory item
 */
export const addInventoryItem = async (userId, itemData) => {
  try {
    // Process numeric values
    const processedData = {
      ...itemData,
      quantity: itemData.quantity ? parseFloat(itemData.quantity) : 0,
      expiryDays: itemData.expiryDays ? parseInt(itemData.expiryDays) : null
    };
    
    const documentData = {
      userId,
      ...processedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await databases.createDocument(
      DATABASE_ID,
      INVENTORY_COLLECTION_ID,
      ID.unique(),
      documentData
    );
    
    return result;
  } catch (error) {
    console.error("Error adding inventory item:", error);
    throw new Error("Failed to add item to inventory");
  }
};

/**
 * Update an existing inventory item
 * @param {string} documentId - The document ID to update
 * @param {Object} itemData - The updated item data
 * @returns {Promise<Object>} - The updated inventory item
 */
export const updateInventoryItem = async (documentId, itemData) => {
  try {
    // Process numeric values
    const processedData = { ...itemData };
    
    if (itemData.quantity !== undefined) {
      processedData.quantity = parseFloat(itemData.quantity);
    }
    
    if (itemData.expiryDays !== undefined) {
      processedData.expiryDays = parseInt(itemData.expiryDays);
    }
    
    const documentData = {
      ...processedData,
      updatedAt: new Date().toISOString()
    };
    
    const result = await databases.updateDocument(
      DATABASE_ID,
      INVENTORY_COLLECTION_ID,
      documentId,
      documentData
    );
    
    return result;
  } catch (error) {
    console.error("Error updating inventory item:", error);
    throw new Error("Failed to update inventory item");
  }
};

/**
 * Delete an inventory item
 * @param {string} documentId - The document ID to delete
 * @returns {Promise<boolean>} - True if successful
 */
export const deleteInventoryItem = async (documentId) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      INVENTORY_COLLECTION_ID,
      documentId
    );
    return true;
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    throw new Error("Failed to delete inventory item");
  }
};

/**
 * Get inventory items nearing expiration
 * @param {string} userId - The user ID
 * @param {number} daysThreshold - Number of days to consider for expiration (default: 5)
 * @returns {Promise<Array>} - Array of inventory items nearing expiration
 */
export const getExpiringItems = async (userId, daysThreshold = 5) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      INVENTORY_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.lessThanEqual("expiryDays", daysThreshold)
      ]
    );
    
    return response.documents;
  } catch (error) {
    console.error("Error fetching expiring items:", error);
    throw new Error("Failed to fetch expiring items");
  }
};

/**
 * Get inventory items by category
 * @param {string} userId - The user ID
 * @param {string} category - The category to filter by
 * @returns {Promise<Array>} - Array of inventory items in the specified category
 */
export const getItemsByCategory = async (userId, category) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      INVENTORY_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("category", category)
      ]
    );
    
    return response.documents;
  } catch (error) {
    console.error("Error fetching items by category:", error);
    throw new Error("Failed to fetch items by category");
  }
};

/**
 * Search inventory items by name
 * @param {string} userId - The user ID
 * @param {string} searchQuery - The search query
 * @returns {Promise<Array>} - Array of matching inventory items
 */
export const searchInventoryItems = async (userId, searchQuery) => {
  try {
    // First get all user's inventory items
    const allItems = await getUserInventory(userId);
    
    // Then filter them by name (since Appwrite doesn't have direct text search)
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } catch (error) {
    console.error("Error searching inventory items:", error);
    throw new Error("Failed to search inventory items");
  }
};

/**
 * Update expiry days for all inventory items
 * @param {string} userId - The user ID
 * @returns {Promise<number>} - Number of items updated
 */
export const updateExpiryDays = async (userId) => {
  try {
    // Get all user's inventory items
    const items = await getUserInventory(userId);
    let updatedCount = 0;
    
    // Update each item's expiry days
    for (const item of items) {
      // Skip items with no expiry days
      if (item.expiryDays === null || item.expiryDays === undefined) {
        continue;
      }
      
      // Get the last update date
      const lastUpdate = new Date(item.updatedAt);
      const today = new Date();
      
      // Calculate days since last update
      const daysDiff = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));
      
      // Only update if at least one day has passed
      if (daysDiff >= 1) {
        // Calculate new expiry days (don't go below 0)
        const newExpiryDays = Math.max(0, item.expiryDays - daysDiff);
        
        // Update item with new expiry days
        await databases.updateDocument(
          DATABASE_ID,
          INVENTORY_COLLECTION_ID,
          item.$id,
          {
            expiryDays: newExpiryDays,
            // Update status if needed
            status: newExpiryDays <= 2 ? 'bad' : (newExpiryDays <= 5 ? 'warning' : 'good'),
            updatedAt: new Date().toISOString()
          }
        );
        
        updatedCount++;
      }
    }
    
    return updatedCount;
  } catch (error) {
    console.error("Error updating expiry days:", error);
    throw new Error("Failed to update expiry days");
  }
};