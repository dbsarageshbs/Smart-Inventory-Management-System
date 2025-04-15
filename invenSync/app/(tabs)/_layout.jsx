import { Tabs } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { View} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    
    return (
        <>
            <Tabs screenOptions={({ route }) => ({
                tabBarActiveTintColor: '#86efac', 
                tabBarInactiveTintColor: '#B0B7C1',
                headerShown: false,
                headerBackButtonMenuEnabled: false,
                tabBarStyle: {
                    height: 70 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 8,
                    backgroundColor: '#1A2E35',
                    borderTopWidth: 0,
                    elevation: 8,
                    shadowColor: '#B0B7C1',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarItemStyle: {
                    paddingVertical: 5,
                },
                tabBarLabelStyle: {
                    fontFamily: 'Poppins-Medium',
                    fontSize: 12,
                    marginTop: -5,
                },
                tabBarIcon: ({ color, focused }) => {
                    let iconName;
                    let IconComponent = FontAwesome;
                    let iconSize = focused ? 24 : 22;
                    
                    if (route.name === 'index')
                        iconName = 'home';
                    else if (route.name === 'Inventory')
                        iconName = 'list';
                    else if (route.name === 'stats')
                        iconName = 'bar-chart';
                    else if (route.name === 'Recipe') {
                        iconName = 'chef-hat';
                        IconComponent = MaterialCommunityIcons;
                    } else if (route.name === 'Settings')
                        iconName = 'gear';
                
                    
                    return (
                        <View className="items-center justify-center">
                            {focused ? (
                                <View className="absolute -bottom-5 w-12 h-1 rounded-full bg-secondary" />
                            ) : null}
                            <IconComponent name={iconName} size={iconSize} color={color} />
                        </View>
                    );
                }
            })}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                    }}
                />
                <Tabs.Screen
                    name="Inventory"
                    options={{
                        title: 'Inventory',
                    }}
                />
                <Tabs.Screen
                    name="Recipe"
                    options={{
                        title: 'Recipe',
                    }}
                />
                <Tabs.Screen
                    name="Settings"
                    options={{
                        title: 'Settings',
                    }}
                />
            </Tabs>
            <StatusBar backgroundColor="#1A2E35" style="light" />
        </>
    );
}