import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { isCloudinaryEnabled } from "./lib/uploadConfig.js";
import "./lib/prisma.js";

const env = loadEnv();
const app = createApp();

app.listen(env.API_PORT, () => {
  const uploadMode = isCloudinaryEnabled()
    ? "cloudinary"
    : "local disk";
  // eslint-disable-next-line no-console -- startup log
  console.log(
    `[studyhouse/api] listening on http://localhost:${env.API_PORT} (${env.NODE_ENV}) — course thumbnails: ${uploadMode}`,
  );
});
