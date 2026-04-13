const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";
const FAL_BASE = "https://queue.fal.run";

type FalSubmitResponse = {
  request_id: string;
  status?: string;
};

type FalStatusResponse = {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  response_url?: string;
  error?: string;
};

type FalResultResponse = {
  images?: Array<{ url: string; content_type?: string }>;
  image?: { url: string };
  error?: string;
};

const headers = () => ({
  Authorization: `Key ${FAL_KEY}`,
  "Content-Type": "application/json",
});

export const submitFalJob = async (
  model: string,
  input: Record<string, unknown>,
): Promise<{ requestId: string } | { error: string }> => {
  if (!FAL_KEY) return { error: "FAL_KEY not configured" };

  const res = await fetch(`${FAL_BASE}/${model}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `fal submit failed (${res.status}): ${text}` };
  }

  const data = (await res.json()) as FalSubmitResponse;
  return { requestId: data.request_id };
};

export const pollFalStatus = async (
  model: string,
  requestId: string,
): Promise<FalStatusResponse> => {
  const res = await fetch(
    `${FAL_BASE}/${model}/requests/${requestId}/status`,
    { headers: headers() },
  );
  return (await res.json()) as FalStatusResponse;
};

export const getFalResult = async (
  model: string,
  requestId: string,
): Promise<FalResultResponse> => {
  const res = await fetch(
    `${FAL_BASE}/${model}/requests/${requestId}`,
    { headers: headers() },
  );
  return (await res.json()) as FalResultResponse;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const runFalAndWait = async (
  model: string,
  input: Record<string, unknown>,
  maxWaitMs = 120_000,
): Promise<{ imageUrl: string } | { error: string }> => {
  const submitResult = await submitFalJob(model, input);
  if ("error" in submitResult) return submitResult;

  const { requestId } = submitResult;
  const deadline = Date.now() + maxWaitMs;
  let pollInterval = 2_000;

  while (Date.now() < deadline) {
    await sleep(pollInterval);
    const status = await pollFalStatus(model, requestId);

    if (status.status === "COMPLETED") {
      const result = await getFalResult(model, requestId);
      const url = result.images?.[0]?.url ?? result.image?.url;
      if (url) return { imageUrl: url };
      return { error: "no image in fal response" };
    }

    if (status.status === "FAILED") {
      return { error: status.error ?? "fal job failed" };
    }

    pollInterval = Math.min(pollInterval * 1.3, 8_000);
  }

  return { error: "fal job timed out" };
};

export const FAL_MODELS = {
  nano_banana: "fal-ai/nano-banana-2",
  nano_banana_edit: "fal-ai/nano-banana-2/edit",
} as const;
