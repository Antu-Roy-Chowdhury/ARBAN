# Medical Image Report Verification App

Next.js App Router review interface for verifying medical reports against Cloudinary-hosted patient images and Supabase metadata.

## Stack

- Next.js with App Router
- React + TypeScript
- Tailwind CSS
- Supabase JS client
- Cloudinary Admin API for server-side folder lookup

## Core matching rule

- Supabase stores metadata, reports, patient info, and reviews.
- Cloudinary stores the actual image assets.
- The app never uses `images.file_name` or any database path to build image URLs.
- Images are fetched only from `CLOUDINARY_FOLDER/{patient_id}`.

Example:

- `ARBAN/images/57/57_knee.png`
- `ARBAN/images/23/23_leg_b.png`

## Environment variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=ARBAN/images
```

Do not commit real credentials.

## Setup

1. Open a terminal in [F:\x-rayImage\medical-review-app](F:\x-rayImage\medical-review-app)
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Features

- One-patient-at-a-time review workflow
- Patient list sourced from the Supabase `images` table
- `body_part_clean` filter with URL persistence
- Next/Previous navigation plus left/right arrow shortcuts
- On-demand patient detail loading only for the active patient
- Secure server route at `/api/patient-images/[patientId]`
- Cloudinary image grid with modal enlargement
- Patient info, DICOM metadata, report text, auto flags, and review form
- Review submission into the `reviews` table
- Empty, loading, and error states

## Important implementation notes

- Cloudinary credentials are read only on the server.
- The API route returns a clean image list to the browser.
- Supported formats are `png`, `jpg`, `jpeg`, and `webp`.
- Cloudinary results are sorted by `public_id` for stable display.
- If no folder exists for a patient, the UI shows an empty image state.

## Files to know

- [app/page.tsx](F:\x-rayImage\medical-review-app\app\page.tsx)
- [components/review-app.tsx](F:\x-rayImage\medical-review-app\components\review-app.tsx)
- [app/api/patient-images/[patientId]/route.ts](F:\x-rayImage\medical-review-app\app\api\patient-images\[patientId]\route.ts)
- [lib/cloudinary.ts](F:\x-rayImage\medical-review-app\lib\cloudinary.ts)
- [lib/supabase-browser.ts](F:\x-rayImage\medical-review-app\lib\supabase-browser.ts)

## Production notes

- Make sure your Supabase policies allow the browser client to read `patients`, `images`, `reports`, and `reviews`, and insert into `reviews`.
- Set all environment variables in your deployment platform.
- If Cloudinary folders are large, keep the Admin API credentials server-side only.
