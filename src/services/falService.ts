import { supabase } from "./supabase";

type GenerateVisualInput = {
  prompt: string;
  style: string;
  profilePhoto: string | null;
  todoIds?: string[];
  jobType?: "avatar" | "daily_scene" | "regenerate";
};

type PollResponse = {
  job?: {
    status?: string;
  };
  visual?: {
    image_url?: string;
  };
  recommendedPollAfterMs?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateMockImage = async (prompt: string, style: string) => {
  const seed = encodeURIComponent(`${style}-${prompt}-${Date.now()}`);
  await sleep(600);
  return `https://picsum.photos/seed/${seed}/1024/1024`;
};

export const generateVisual = async ({
  prompt,
  style,
  profilePhoto,
  todoIds = [],
  jobType = "daily_scene",
}: GenerateVisualInput): Promise<string> => {
  const { data: queueData, error: queueError } = await supabase.functions.invoke("generate-visual", {
    body: {
      jobType,
      todoIds,
      promptVersion: "v1",
      metadata: { style, hasProfilePhoto: Boolean(profilePhoto), promptLength: prompt.length },
    },
  });

  if (queueError || !queueData?.job?.id) {
    return generateMockImage(prompt, style);
  }

  const jobId = String(queueData.job.id);
  const maxPolls = 24;
  let pollCount = 0;

  while (pollCount < maxPolls) {
    pollCount += 1;
    const { data: pollData, error: pollError } = await supabase.functions.invoke("poll-generation", {
      body: { jobId },
    });

    if (pollError) break;
    const parsed = pollData as PollResponse;
    const status = parsed?.job?.status;
    const imageUrl = parsed?.visual?.image_url;

    if (status === "succeeded" && imageUrl) return imageUrl;
    if (status === "failed") break;

    await sleep(parsed?.recommendedPollAfterMs ?? 3000);
  }

  return generateMockImage(prompt, style);
};
