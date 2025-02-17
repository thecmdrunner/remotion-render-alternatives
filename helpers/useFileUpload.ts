import { useState } from "react";
export type CloudinaryUploadResponse = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  pages: number;
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  access_mode: string;
  audio: {
    codec: string;
    frequency: number;
    channels: number;
    channel_layout: string;
  };
  video: {
    pix_format: string;
    codec: string;
    level: number;
    profile: string;
    dar: string;
    time_base: string;
  };
  is_audio: boolean;
  frame_rate: number;
  duration: number;
  rotation: number;
  original_filename: string;
  api_key: string;
};

const useFileUpload = ({
  onError,
  onSuccess,
}: {
  onError: (error: string) => void;
  onSuccess: (url: string) => void;
}) => {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "succeeded" | "failed" | "cancelled"
  >("idle");

  return { upload, status };
};

export default useFileUpload;
