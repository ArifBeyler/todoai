import { useEffect, useRef, useState } from "react";
import { supabase } from "@/src/services/supabase";

type UseUserScoreResult = {
  totalPoints: number;
  isLoading: boolean;
};

export const useUserScore = (): UseUserScoreResult => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchScore = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          if (mounted) setIsLoading(false);
          return;
        }

        const userId = session.user.id;

        const { data, error } = await supabase
          .from("users")
          .select("total_points")
          .eq("id", userId)
          .maybeSingle();

        if (mounted) {
          setTotalPoints(error || !data ? 0 : (data.total_points ?? 0));
          setIsLoading(false);
        }

        // Realtime subscription so the score updates immediately when
        // the DB trigger fires (todo completion changes).
        channelRef.current = supabase
          .channel(`user-score-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "users",
              filter: `id=eq.${userId}`,
            },
            (payload) => {
              if (mounted && payload.new && "total_points" in payload.new) {
                setTotalPoints((payload.new as { total_points: number }).total_points ?? 0);
              }
            },
          )
          .subscribe();
      } catch {
        if (mounted) setIsLoading(false);
      }
    };

    fetchScore();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { totalPoints, isLoading };
};
