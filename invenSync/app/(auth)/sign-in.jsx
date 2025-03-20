import { useState,useEffect } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Alert, Image, Animated } from "react-native";
import { images } from "../../constants";
import { CustomButton, FormField } from "../../components";
import { getCurrentUser, signIn } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const SignIn = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setSubmitting] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0]; // Animation for fade-in

  // Fade-in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const submit = async () => {
    const { email, password } = form;
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      const result = await getCurrentUser();
      setUser(result);
      setIsLogged(true);
      
      Alert.alert("Success", "User signed in successfully");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <Animated.View
          className="w-full flex justify-center px-4 my-6"
          style={{
            minHeight: Dimensions.get("window").height - 100,
            opacity: fadeAnim,
          }}
        >
          <Image
            source={images.logo} // Replace with your logo from the prompt
            resizeMode="contain"
            className="w-56 h-24 self-center"
          />

          <Text className="text-2xl font-psemibold text-white mt-10">
            Log in to InvenSync
          </Text>

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
            placeholder="Enter your email"
            textStyles="text-black-100 font-plight"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
            placeholder="Enter your password"
            textStyles="text-black-100 font-plight"
          />

          <CustomButton
            text="Sign In"
            handlePress={submit}
            containerStyles="mt-7 bg-secondary"
            textStyles="text-black-200 font-pmedium"
            isLoading={isSubmitting}
          />

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Don't have an account?
            </Text>
            <Link
              href="/sign-up"
              className="text-lg font-psemibold text-secondary"
            >
              Signup
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;