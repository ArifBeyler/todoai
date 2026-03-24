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
        options={{ title: "Ana Sayfa" }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: "Takvim" }}
      />
      <Tabs.Screen
        name="focus"
        options={{ title: "Focus" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profil" }}
      />
    </Tabs>
  );
}
