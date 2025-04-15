import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { addInventoryItem } from '../lib/inventoryService';
import { processProductImages } from '../lib/imageProcessing';

const ProductScanner = ({ userId, onClose, onProductAdded }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState('back');
  const [capturedImages, setCapturedImages] = useState({ front: null, back: null });
  const [processingImage, setProcessingImage] = useState(false);
  const [currentImageType, setCurrentImageType] = useState('front');
  
  useEffect(() => {
    // Reset captured images when component mounts
    setCapturedImages({ front: null, back: null });
    setCurrentImageType('front');
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      
      // Update captured images
      setCapturedImages(prev => {
        const updatedImages = { ...prev };
        updatedImages[currentImageType] = photo.uri;
        return updatedImages;
      });
      
      // Automatically switch to back after front is captured
      if (currentImageType === 'front') {
        setCurrentImageType('back');
      }
      
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImages(prev => ({
          ...prev,
          [type]: result.assets[0].uri
        }));
        
        // Automatically switch to back if front was selected
        if (type === 'front') {
          setCurrentImageType('back');
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const resetCapture = (type = null) => {
    if (type) {
      setCapturedImages(prev => ({
        ...prev,
        [type]: null
      }));
      setCurrentImageType(type);
    } else {
      setCapturedImages({ front: null, back: null });
      setCurrentImageType('front');
    }
  };
  
  const readImageAsBase64 = async (uri) => {
    try {
      return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    } catch (error) {
      console.error('Error reading image as base64:', error);
      throw error;
    }
  };

  const analyzeProduct = async () => {
    // Validate that we have at least the front image
    if (!capturedImages.front) {
      Alert.alert("Error", "Please take at least the front image of the product");
      return;
    }
    
    setProcessingImage(true);
    
    try {
      // Read images as base64
      const frontImageBase64 = await readImageAsBase64(capturedImages.front);
      const backImageBase64 = capturedImages.back ? await readImageAsBase64(capturedImages.back) : null;
      
      // Process images with Groq API
        const productInfo = await processProductImages(frontImageBase64, backImageBase64);

        // Parse the response
        let productData;
        try {
        // If the response is already an object, use it directly
        if (typeof productInfo === 'object') {
            productData = productInfo;
        } else {
            // Otherwise parse it from text
            const lines = productInfo.trim().split('\n');
            productData = {};
            
            lines.forEach(line => {
            const [key, value] = line.split(': ');
            if (key && value) {
                productData[key.trim()] = value.trim();
            }
            });
        }
        
        // Convert expiry date to days if needed
        if (productData.expiry && productData.expiry !== 'Expiration date not found') {
            // Properly parse the date based on your format (DD-MM-YYYY)
            const expiryParts = productData.expiry.split('-');
            if (expiryParts.length === 3) {
            // Create date with explicit format handling
            const day = parseInt(expiryParts[0]);
            const month = parseInt(expiryParts[1]) - 1; // months are 0-indexed
            const year = parseInt(expiryParts[2]);
            
            // Use the full date constructor to avoid ambiguity
            const expiryDate = new Date(year, month, day);
            
            const today = new Date().setHours(0, 0, 0, 0); // Reset time component to midnight
            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            productData.expiryDays = Math.max(0, diffDays).toString();
            console.log("Days until expiry:", productData.expiryDays);
            }
        } else {
            productData.expiryDays = '30'; // Default 30 days if no expiry found
        }
        
        // Prepare data for inventory
        const inventoryItem = {
          name: productData.name || '',
          quantity: productData.quantity || '1',
          unit: productData.unit || 'pcs',
          category: productData.category?.toLowerCase() || 'dairy',
          expiryDays: productData.expiryDays,
          status: parseInt(productData.expiryDays) <= 5 ? 'warning' : 'good'
        };
        
        // Add to inventory
        await addInventoryItem(userId, inventoryItem);
        
        // Notify parent component
        onProductAdded();
        
        // Close scanner
        onClose();
        
        // Show success message
        Alert.alert("Success", "Product added to inventory!");
      } catch (parseError) {
        console.error("Error parsing product info:", parseError);
        throw new Error("Failed to parse product information");
      }
    } catch (error) {
      console.error("Error processing product images:", error);
      Alert.alert("Error", "Failed to process product images. Please try again or add manually.");
    } finally {
      setProcessingImage(false);
    }
  };

  const renderCameraView = () => (
    <CameraView
      ref={cameraRef}
      facing={facing}
      mode="picture"
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-transparent justify-end p-4">
        <View className="bg-black/50 rounded-xl p-3 mb-4">
          <Text className="text-white font-pmedium text-center">
            {currentImageType === 'front'
              ? "Take a clear photo of the front of the product" 
              : "Take a clear photo of the back of the product"}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity
            onPress={() => pickImage(currentImageType)}
            className="bg-black-100/70 h-12 w-12 rounded-full items-center justify-center"
          >
            <Ionicons name="images-outline" size={22} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={takePicture}
            className="bg-white rounded-full h-16 w-16 items-center justify-center"
          >
            <View className="bg-white rounded-full h-14 w-14 border-2 border-black" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              if (facing === 'back') setFacing('front');
              else setFacing('back');
            }}
            className="bg-black-100/70 h-12 w-12 rounded-full items-center justify-center"
          >
            <Ionicons name="camera-reverse-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </CameraView>
  );

  const renderImagePreview = () => (
    <View className="flex-1">
      <View className="flex-1 flex-row">
        <View className="flex-1 h-full relative">
          {capturedImages.front ? (
            <Image 
              source={{ uri: capturedImages.front }}
              className="flex-1 h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 bg-black-200 items-center justify-center">
              <TouchableOpacity
                onPress={() => {
                  setCurrentImageType('front');
                  setCapturedImages(prev => ({...prev, front: null}));
                }}
                className="p-3 items-center"
              >
                <Ionicons name="camera-outline" size={40} color="#86efac" />
                <Text className="text-white font-pmedium mt-2">Front Image</Text>
              </TouchableOpacity>
            </View>
          )}
          {!!capturedImages.front && (
            <TouchableOpacity
              onPress={() => resetCapture('front')}
              className="absolute top-2 right-2 bg-black/70 rounded-full p-2"
            >
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        <View className="flex-1 h-full relative">
          {capturedImages.back ? (
            <Image 
              source={{ uri: capturedImages.back }}
              className="flex-1 h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 bg-black-200 items-center justify-center">
              <TouchableOpacity
                onPress={() => {
                  setCurrentImageType('back');
                  setCapturedImages(prev => ({...prev, back: null}));
                }}
                className="p-3 items-center"
              >
                <Ionicons name="camera-outline" size={40} color="#86efac" />
                <Text className="text-white font-pmedium mt-2">Back Image</Text>
              </TouchableOpacity>
            </View>
          )}
          {!!capturedImages.back && (
            <TouchableOpacity
              onPress={() => resetCapture('back')}
              className="absolute top-2 right-2 bg-black/70 rounded-full p-2"
            >
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View className="bg-black/70 p-4">
        {processingImage ? (
          <View className="flex-row justify-center items-center py-4">
            <ActivityIndicator color="#86efac" size="large" />
            <Text className="text-white font-pmedium ml-3">Processing Product...</Text>
          </View>
        ) : (
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              onPress={() => resetCapture()}
              className="bg-red-600 rounded-xl p-3 flex-1"
            >
              <Text className="text-white font-psemibold text-center">Retake Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={analyzeProduct}
              className="bg-secondary rounded-xl p-3 flex-1"
              disabled={!capturedImages.front}
            >
              <Text className="text-primary font-psemibold text-center">Analyze Product</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row justify-between items-center p-4">
        <TouchableOpacity 
          onPress={onClose}
          className="bg-black-100 p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="#86efac" />
        </TouchableOpacity>
        <Text className="text-white font-psemibold text-lg">Scan Product</Text>
        <View style={{ width: 32 }} /> {/* Empty view for alignment */}
      </View>

      <View className="flex-1 bg-black">
        {!permission ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-white font-pmedium text-center mb-4">
              We need permission to use the camera
            </Text>
            <TouchableOpacity 
              onPress={requestPermission}
              className="bg-secondary py-2 px-4 rounded-xl"
            >
              <Text className="text-primary font-psemibold">Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-white font-pmedium text-center mb-4">
              Camera permission is required
            </Text>
            <TouchableOpacity 
              onPress={requestPermission}
              className="bg-secondary py-2 px-4 rounded-xl"
            >
              <Text className="text-primary font-psemibold">Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : !capturedImages.front || (currentImageType === 'back' && !capturedImages.back) ? (
          renderCameraView()
        ) : (
          renderImagePreview()
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProductScanner;