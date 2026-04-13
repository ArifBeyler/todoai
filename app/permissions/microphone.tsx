import { router } from "expo-router";
import { MicPermissionScreen } from "@/src/components/MicPermissionScreen";
import { supabase } from "@/src/services/supabase";

export default function MicrophonePermissionRoute() {
  const handleGranted = async () => {
    try {
      await supabase.functions.invoke("update-preferences", {
        body: { mic_permission_status: "granted", voice_enabled: true },
      });
    } catch {}
    router.back();
  };

  const handleSkipped = async () => {
    try {
      await supabase.functions.invoke("update-preferences", {
        body: { mic_permission_status: "skipped" },
      });
    } catch {}
    router.back();
  };

  return (
    <MicPermissionScreen onGranted={handleGranted} onSkipped={handleSkipped} />
  );
}
