import { send } from "@vercel/queue";

export const AI_IMAGE_QUEUE_TOPIC = "sohojhub-ai-generation";
export const AI_IMAGE_QUEUE_REGION = process.env.QUEUE_REGION || "iad1";

export interface AIImageQueueMessage {
  jobId: string;
}

export async function enqueueAIImageJob(jobId: string): Promise<string> {
  if (!/^[a-f\d]{24}$/i.test(jobId)) {
    throw new Error("Invalid AI image job ID.");
  }

  const { messageId } = await send(
    AI_IMAGE_QUEUE_TOPIC,
    { jobId } satisfies AIImageQueueMessage,
    {
      region: AI_IMAGE_QUEUE_REGION,
      idempotencyKey: `sohojhub-ai-image-job-${jobId}`,
      retentionSeconds: 86400,
    },
  );

  // A deferred message may be accepted before a concrete ID is available.
  return messageId ?? "";
}
