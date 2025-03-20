import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#0077b6',
            tabBarInactiveTintColor: '#979797',
            headerShown: false,
            headerBackButtonMenuEnabled: false,
            tabBarStyle: {
                height: 60,
                paddingBottom: 10,
                paddingTop: 5,
            },
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="inventory"
                options={{
                    title: 'Inventory',
                    tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Stats',
                    tabBarIcon: ({ color }) => <FontAwesome name="bar-chart" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="Settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <FontAwesome name="gear" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}