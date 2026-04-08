export function isVercelRuntime() {
  return process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

export function isRenderRuntime() {
  return process.env.RENDER === "true";
}

export function isServerlessRuntime() {
  return isVercelRuntime();
}
