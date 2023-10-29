export default function useCloudinary() {
  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error("Missing CLOUDINARY_API_KEY");
  }

  const upload = async ({ blobUrl }: { blobUrl: string }) => {
    setStatus("uploading");
    if (
      blobUrl.startsWith("blob:") &&
      generateSignatureMutation.status !== "loading"
    ) {
      // Get signature
      const { signature, timestamp, cloudName } =
        await generateSignatureMutation.mutateAsync();

      // Get file
      const file = await fetch(blobUrl)
        .then((r) => r.blob())
        .then(
          (blobFile) =>
            new File([blobFile], "fileNameGoesHere", {
              type:
                type === "video" || type === "screen"
                  ? "video/mp4"
                  : type === "audio"
                  ? "audio/mp3"
                  : "image/png",
            })
        )
        .catch((error) => {
          onError(error);
        });

      if (!file) {
        setStatus("failed");
        return onError(
          "File not found while uploading to bucket. Please try again."
        );
      }

      // Start uploading the video
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", process.env.CLOUDINARY_API_KEY);
      formData.append("timestamp", `${timestamp}`);
      formData.append("signature", signature);

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data: CloudinaryUploadResponse = await res.json();

        if (data.secure_url) {
          const secureAssetUrl = data.secure_url;

          onSuccess(secureAssetUrl);
          setStatus("succeeded");
        }
      } catch (e) {
        onError(`Error uploading video ${e}`);
      }
    } else {
      setStatus("failed");
    }
  };
}
