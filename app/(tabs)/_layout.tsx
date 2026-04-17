import { Tabs } from "expo-router";
import { CustomTabBar } from "@/src/components/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Ana Sayfa",
          tabBarAccessibilityLabel: "Ana Sayfa",
          tabBarButtonTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Takvim",
          tabBarAccessibilityLabel: "Takvim",
          tabBarButtonTestID: "tab-calendar",
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: "Focus",
          tabBarAccessibilityLabel: "Focus",
          tabBarButtonTestID: "tab-focus",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarAccessibilityLabel: "Profil",
          tabBarButtonTestID: "tab-profile",
        }}
      />
    </Tabs>
  );
}
