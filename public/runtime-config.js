// Runtime-editable frontend config (overrides build-time Vite vars)
// You can safely edit this file in S3 after deploy without rebuilding.
// Example: change API URL to point to a new backend.

window.__ENV = {
  // Mirrors Vite env var names for seamless override
  VITE_API_URL: "https://9rurb01f5a.execute-api.us-east-2.amazonaws.com/prod"
}
