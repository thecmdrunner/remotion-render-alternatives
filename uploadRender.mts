import minimist from "minimist";
import cloudinary from "cloudinary";
import os from "os";
import fs from "fs";
import { spawn } from "child_process";
import { CompositionProps } from "./types/constants";
import { createHash } from "crypto";

const inputPropsJsonPath = "./out/inputProps.json"; // Directory ignored by .gitignore

async function renderVideoAndUpload() {
  if (
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    throw new Error("Missing Cloudinary Credentials");
  }

  cloudinary.v2.config({
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    secure: true,
  });

  const args = minimist(process.argv.slice(2));

  const fileName = args["fileName"] ?? "./out/MyComp.mp4";
  const compId = args["compId"] ?? "MyComp";

  const _serializedInputProps = process.env.INPUT_PROPS ?? args["props"];
  if (!_serializedInputProps) throw new Error("Missing input props!");

  const parsedInputProps = CompositionProps.parse(
    JSON.parse(_serializedInputProps)
  );

  fs.writeFileSync(inputPropsJsonPath, JSON.stringify(parsedInputProps));
  const newProps = fs.readFileSync(inputPropsJsonPath, "utf8");

  const totalCpuThreads = os.cpus().length;
  console.log(
    `> Rendering [${compId}] to ${fileName} using ${totalCpuThreads} CPU Threads...\n`
  );

  await new Promise<void>((resolve, reject) => {
    const renderProcess = spawn(
      "npx",
      [
        "remotion",
        "render",
        compId,
        `--props=${newProps}`,
        `--output=${fileName}`,
        "--enable-multiprocess-on-linux",
        "--concurrency=100%",
      ],
      {
        stdio: "inherit",
        shell: process.platform === "win32" ? "cmd.exe" : undefined,
      }
    );

    renderProcess.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error("Rendering failed"));
    });
  });

  const exportedRenderBuffer = fs.readFileSync(fileName);

  const exportedRenderFile = new File([exportedRenderBuffer], fileName, {});

  const fileSizeInMB = (exportedRenderFile.size / 1024 / 1024).toFixed(3);

  console.log(
    `\n🎊 Render successful: ${exportedRenderFile.name} [${fileSizeInMB} MB]\n`
  );

  const inputHash = createHash("sha256")
    .update(
      JSON.stringify({
        compId,
        inputProps: _serializedInputProps,
      })
    )
    .digest("hex");

  const fileNameInBucket = "remotion-renders/" + inputHash;

  console.log(`Uploading render to bucket...`);

  try {
    const uploadedVideo = await cloudinary.v2.uploader.upload(fileName, {
      resource_type: "video",
      public_id: fileNameInBucket,
      overwrite: true,
      // notification_url: "https://mysite.example.com/notify_endpoint",
    });

    if (!uploadedVideo.secure_url) {
      throw new Error("🔴 Failed uploading video to bucket!");
    }

    const secureAssetUrl = uploadedVideo.secure_url;

    console.log(`\n⭐ Render uploaded to bucket! ${secureAssetUrl}\n`);
  } catch (e) {
    // Set status to failed in db

    if (e instanceof Error) {
      throw e;
    }

    throw new Error(
      `🔴 Workflow failed: ${(e as Error)?.message ?? "unknown error!"}`
    );
  }
}

renderVideoAndUpload();
