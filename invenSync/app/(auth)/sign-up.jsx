import { useState, useEffect } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  View, 
  Text, 
  ScrollView, 
  Dimensions, 
  Alert, 
  Image,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { createUser } from "../../lib/appwrite";
import { CustomButton, FormField } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";

const SignUp = () => {
  const { setUser, setIsLogged } = useGlobalContext();

  const [isSubmitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    height: "",
    weight: "",
    healthConditions: ""
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate first step
      if (form.username === "" || form.email === "" || form.password === "") {
        Alert.alert("Missing Information", "Please fill in all required fields");
        return;
      }
      
      // Password validation - at least 8 characters with one special character
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
      if (!passwordRegex.test(form.password)) {
        Alert.alert(
          "Weak Password", 
          "Password must be at least 6 characters long and contain at least one uppercase letter and one number"
        );
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        Alert.alert("Invalid Email", "Please enter a valid email address");
        return;
      }
    }

    setCurrentStep(2);
    fadeAnim.setValue(0); // Reset animation for next step
  };

  const prevStep = () => {
    setCurrentStep(1);
    fadeAnim.setValue(0); // Reset animation for previous step
  };

  const submit = async () => {
    // Age validation
    if (form.age !== "" && (isNaN(form.age) || parseInt(form.age) < 1 || parseInt(form.age) > 120)) {
      Alert.alert("Invalid Age", "Please enter a valid age between 1 and 120");
      return;
    }
    
    // Height and weight validation (if entered)
    if (form.height !== "" && isNaN(form.height)) {
      Alert.alert("Invalid Height", "Please enter a valid height in cm");
      return;
    }
    
    if (form.weight !== "" && isNaN(form.weight)) {
      Alert.alert("Invalid Weight", "Please enter a valid weight in kg");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createUser(
        form.email, 
        form.password, 
        form.username, 
        {
          age: form.age,
          height: form.height,
          weight: form.weight,
          healthConditions: form.healthConditions
        }
      );
      setUser(result);
      setIsLogged(true);

      Alert.alert("Success", "Account created successfully!");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            className="w-full flex justify-center px-4 my-4"
            style={{
              minHeight: Dimensions.get("window").height - 100,
            }}
          >

            {/* Progress Bar */}
            <View className="flex-row items-center justify-between mb-6 mt-2">
              <View className="flex-1 h-2 bg-black-100 rounded-full">
                <View 
                  className={`h-2 bg-secondary rounded-full`}
                  style={{ width: currentStep === 1 ? '50%' : '100%' }}
                />
              </View>
              <Text className="text-white font-pmedium ml-3">{currentStep}/2</Text>
            </View>

            <Animated.View style={{ opacity: fadeAnim }}>
              {currentStep === 1 ? (
                <>
                  <Text className="text-2xl font-psemibold text-white">
                    Create Your Account
                  </Text>
                  <Text className="text-gray-200 font-pregular mt-1 mb-6">
                    Enter your details to get started
                  </Text>

                  <FormField
                    title="Username"
                    value={form.username}
                    handleChangeText={(e) => setForm({ ...form, username: e })}
                    otherStyles="mb-4"
                    placeholder="Choose a username"
                  />

                  <FormField
                    title="Email"
                    value={form.email}
                    handleChangeText={(e) => setForm({ ...form, email: e })}
                    otherStyles="mb-4"
                    keyboardType="email-address"
                    placeholder="Enter your email"
                  />

                  <FormField
                    title="Password"
                    value={form.password}
                    handleChangeText={(e) => setForm({ ...form, password: e })}
                    otherStyles="mb-6"
                    placeholder="Create a strong password"
                  />

                  <CustomButton
                    text="Continue"
                    handlePress={nextStep}
                    containerStyles="bg-secondary mb-4"
                    textStyles="text-primary"
                  />
                </>
              ) : (
                <>
                  <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={prevStep} className="mr-3">
                      <Ionicons name="arrow-back" size={24} color="#86efac" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-psemibold text-white">
                      Personal Information
                    </Text>
                  </View>
                  
                  <Text className="text-gray-200 font-pregular mb-6">
                    Help us personalize your recipe recommendations
                  </Text>

                  <View className="flex-row mb-4">
                    
                    <FormField
                      title="Height"
                      value={form.height}
                      handleChangeText={(e) => setForm({ ...form, height: e })}
                      otherStyles="flex-1 mr-2"
                      keyboardType="numeric"
                      placeholder="cm"
                    />
                    
                    <FormField
                      title="Weight"
                      value={form.weight}
                      handleChangeText={(e) => setForm({ ...form, weight: e })}
                      otherStyles="flex-1 ml-2"
                      keyboardType="numeric"
                      placeholder="kg"
                    />
                  </View>

                  

                  <FormField
                      title="Age"
                      value={form.age}
                      handleChangeText={(e) => setForm({ ...form, age: e })}
                      otherStyles="mb-4"
                      keyboardType="numeric"
                      placeholder="Years"
                  />

                  <FormField
                    title="Health Conditions (if any)"
                    value={form.healthConditions}
                    handleChangeText={(e) => setForm({ ...form, healthConditions: e })}
                    otherStyles="mb-6"
                    multiline={true}
                    numberOfLines={3}
                    placeholder="e.g. diabetes, allergies, dietary restrictions"
                  />

                  <View className="mb-6 bg-black-100 rounded-xl p-4">
                    <Text className="text-secondary font-pmedium mb-2">Why we ask this information:</Text>
                    <Text className="text-gray-100 font-pregular">This helps InvenSync generate personalized recipes that match your health profile and dietary needs.</Text>
                  </View>

                  <CustomButton
                    text={isSubmitting ? "Creating Account..." : "Create Account"}
                    handlePress={submit}
                    containerStyles="bg-secondary mb-4"
                    textStyles="text-primary"
                    isLoading={isSubmitting}
                  />
                </>
              )}

              <View className="flex justify-center pt-3 flex-row gap-2">
                <Text className="text-lg text-gray-100 font-pregular">
                  Have an account already?
                </Text>
                <Link
                  href="/sign-in"
                  className="text-lg font-psemibold text-secondary"
                >
                  Login
                </Link>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;