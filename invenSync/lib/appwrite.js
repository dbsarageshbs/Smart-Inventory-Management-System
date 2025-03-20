import { Client, Account, ID, Databases } from "react-native-appwrite";

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("invensync1")
  .setPlatform('com.ml.invensync');

const account = new Account(client);
const databases = new Databases(client);

// Appwrite Constants
const DATABASE_ID = "invensync_db";
const USERS_COLLECTION_ID = "users_profile";

// Create new user with email and password
export const createUser = async (email, password, username, profileData = {}) => {
  try {
    // Type conversions for numeric fields
    const processedProfileData = {
      ...profileData,
      age: profileData.age && profileData.age.trim() !== '' 
        ? parseInt(profileData.age, 10) 
        : null,
      height: profileData.height && profileData.height.trim() !== '' 
        ? parseFloat(profileData.height) 
        : null,
      weight: profileData.weight && profileData.weight.trim() !== '' 
        ? parseFloat(profileData.weight) 
        : null
    };

    // Step 1: Create the account in Appwrite Auth first
    const newUser = await account.create(
      ID.unique(),
      email,
      password,
      username
    );
    
    // Step 2: Create email session (log user in)
    await account.createEmailPasswordSession(email, password);
    
    // Step 3: Now create the user profile document with the userId
    const userData = {
      userId: newUser.$id, // Now we have the userId from Auth
      email: email,
      username,
      age: processedProfileData.age,
      height: processedProfileData.height,
      weight: processedProfileData.weight,
      healthConditions: processedProfileData.healthConditions || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create the document in the users collection
    await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      ID.unique(),
      userData
    );
    
    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    throw new Error(error.message || "Failed to sign in");
  }
};


// Get user profile data
export const getUserProfile = async (userId) => {
  try {
    // Query the database to find the document with the matching userId
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [
        // Query to find the document where userId equals the provided userId
        Databases.Query.equal('userId', userId)
      ]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0];
    }
    
    throw new Error("User profile not found");
  } catch (error) {
    throw new Error(error.message || "Failed to fetch user profile");
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    // Process numeric values
    const processedData = { ...profileData };
    
    if (profileData.age !== undefined) {
      processedData.age = profileData.age && profileData.age.toString().trim() !== '' 
        ? parseInt(profileData.age, 10) 
        : null;
    }
    
    if (profileData.height !== undefined) {
      processedData.height = profileData.height && profileData.height.toString().trim() !== '' 
        ? parseFloat(profileData.height) 
        : null;
    }
    
    if (profileData.weight !== undefined) {
      processedData.weight = profileData.weight && profileData.weight.toString().trim() !== '' 
        ? parseFloat(profileData.weight) 
        : null;
    }
    
    // First get the profile document
    const profile = await getUserProfile(userId);
    
    // Update the profile
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      profile.$id,
      {
        ...processedData,
        updatedAt: new Date().toISOString()
      }
    );
    
    return true;
  } catch (error) {
    throw new Error(error.message || "Failed to update user profile");
  }
};

// Check if user has an active session
export const checkSession = async () => {
  try {
    const session = await account.getSession('current');
    return !!session; // Return true if session exists
  } catch (error) {
    return false; // Return false if no session
  }
};

// Better version of getCurrentUser that doesn't throw when logged out
export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    console.log("No active user session");
    return null;
  }
};

// Improved signOut that won't error if no session exists
export const signOut = async () => {
  try {
    const hasSession = await checkSession();
    if (hasSession) {
      await account.deleteSession("current");
    }
    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
    throw new Error(error.message || "Failed to sign out");
  }
};