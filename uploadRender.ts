import minimist from "minimist";
import { v2 } from "cloudinary";
import { CloudinaryUploadResponse } from "./helpers/useFileUpload";
import os from "os";
import fs from "fs";
import { spawn } from "child_process";

async function uploadRender() {
  if (
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    throw new Error("Missing Cloudinary Credentials");
  }
  // Get an array of CPU core information
  const totalThreads = os.cpus().length;
  console.log(`Number of CPU Threads: ${totalThreads}`);

  const args = minimist(process.argv.slice(2));

  const fileName = args["fileName"] ?? "./out/MyComp.mp4";
  const serializedInputProps = args["props"];
  const compId = args["compId"] ?? "MyComp";

  const data = serializedInputProps;

  const inputPropsJsonPath = "./inputProps.json";

  fs.writeFile(inputPropsJsonPath, data, (err) => {
    if (err) throw err;
    console.log(`Props written to ${inputPropsJsonPath}`);
  });

  const newProps = fs.readFileSync(inputPropsJsonPath, "utf8");

  console.log(`Trying Rendering to:`, fileName);

  await new Promise<void>((resolve, reject) => {
    const renderProcess = spawn(
      "npx",
      [
        "remotion",
        "render",
        compId,
        `--props=${newProps}`,
        "--output=out/MyComp1.mp4",
        "--enable-multiprocess-on-linux",
        "--concurrency=100%",
      ],
      {
        stdio: "inherit",
        shell: process.platform === "win32" ? "cmd.exe" : undefined,
      }
    );

    renderProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("Finished rendering");
        resolve();
      } else {
        reject(new Error("Rendering failed"));
      }
    });
  });

  throw new Error("See if file exists...");

  //   console.log(`Rendering with props:`, inputProps);

  const exportedRenderFile = Bun.file(fileName);

  console.log(`Uploading render...`, exportedRenderFile);

  return;

  const timestamp = Math.round(new Date().getTime() / 1000).toString();

  const signature = v2.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET
  );

  const formData = new FormData();

  formData.append("file", exportedRenderFile);
  formData.append("api_key", process.env.CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("resource_type", "video");
  //   formData.append("folder", "myvideo/");
  //   formData.append("public_id", "video1");

  console.log(formData);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      console.error(`[${res.status}] Upload failed: ${res.statusText}`);
      throw new Error("Upload failed");
    }

    const data: CloudinaryUploadResponse = await res.json();

    if (!data.secure_url) {
      throw new Error("Upload failed");
    }
    const secureAssetUrl = data.secure_url;

    console.log(`Render uploaded to ${secureAssetUrl}`);
  } catch (e) {
    // Set status to failed in db
    console.error(e);
  }

  // exportedRenderFile
}

uploadRender();
