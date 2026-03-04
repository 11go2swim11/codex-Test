<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f0bb1dd9-9b0d-4595-b175-3d2ff3f9bf24

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker

**Prerequisites:** Docker Desktop

1. Build and start:
   `docker compose up --build`
2. Open:
   `http://localhost:3000`
3. Stop:
   `docker compose down`

## Deploy to Render

1. Push latest code to GitHub:
   `git push`
2. Open Render Dashboard and choose:
   `New +` -> `Blueprint`
3. Connect repo:
   `https://github.com/11go2swim11/codex-Test`
4. Render will detect `render.yaml` and create the web service.
5. After deploy is done, open the generated Render URL.
