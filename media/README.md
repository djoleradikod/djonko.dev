# media/

Large files that should not live in git or in the site build: videos, long PDFs, big archives.

- Reference them by path relative to this folder, e.g. `<Video src="video/triage-walkthrough" />` looks for `video/triage-walkthrough.webm` and `.mp4`.
- `npm run dev` serves this folder at `/media`.
- On Hetzner, `deploy/hetzner/deploy.sh --media` copies it to `/srv/djonko.dev/media`, which Caddy serves at `/media`.
- On Cloudflare Pages (25 MiB per-file limit), upload it to an R2 bucket or the Hetzner host and set `PUBLIC_MEDIA_URL` to that origin.

Encode web video with: `ffmpeg -i in.mov -c:v libx264 -crf 23 -preset slow -movflags +faststart -c:a aac -b:a 128k out.mp4`
and `ffmpeg -i in.mov -c:v libvpx-vp9 -crf 33 -b:v 0 -c:a libopus out.webm`.
