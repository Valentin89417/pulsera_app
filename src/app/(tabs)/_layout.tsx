import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Простой layout для табов
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6c63ff',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#333',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Каталог',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="book" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Сообщество',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="comment-o" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}