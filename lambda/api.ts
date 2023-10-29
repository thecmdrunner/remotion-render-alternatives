import { z } from "zod";
import { RenderRequest } from "../types/schema";
import { CompositionProps } from "../types/constants";

export const renderApiResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    pollingId: z.string(),
  }),

  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type RenderApiResponse = z.infer<typeof renderApiResponseSchema>;

export const progressApiResponseSchema = z.union([
  z.object({
    pollingId: z.string(),
    success: z.literal(true),
  }),

  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type progressApiResponse = z.infer<typeof renderApiResponseSchema>;

export const renderVideo = async ({
  id,
  inputProps,
}: {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
}) => {
  const body: z.infer<typeof RenderRequest> = {
    id,
    inputProps,
  };

  const res = await fetch("/api/pipeline/render", {
    body: JSON.stringify(body),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
  });

  if (res.ok) {
    return {
      success: false,
      error: res.statusText,
    } satisfies RenderApiResponse;
  }

  const result = renderApiResponseSchema.parse(await res.json());

  return result;
};

export const getProgress = async ({
  id,
  bucketName,
}: {
  id: string;
  bucketName: string;
}) => {
  const body: z.infer<typeof ProgressRequest> = {
    id,
    bucketName,
  };

  return makeRequest<ProgressResponse>("/api/lambda/progress", body);
};
