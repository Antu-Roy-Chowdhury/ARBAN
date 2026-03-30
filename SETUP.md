# Medical Image Report Verification App - Setup Guide

This is a full-stack medical image review application built with Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase, and Cloudinary.

## Prerequisites

- Node.js 18+ or pnpm
- Supabase account with a database set up
- Cloudinary account with image hosting

## Database Setup (Supabase)

The app requires the following database tables in Supabase:

### 1. `patients` table
```sql
CREATE TABLE patients (
  patient_id INT PRIMARY KEY,
  patient_name VARCHAR(255),
  age INT,
  sex VARCHAR(10)
);
```

### 2. `images` table
```sql
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(patient_id),
  file_name VARCHAR(255),
  body_part_clean VARCHAR(100),
  body_part_raw VARCHAR(100),
  view_position VARCHAR(100),
  study_date VARCHAR(20),
  modality VARCHAR(50),
  series_description TEXT,
  instance_number INT,
  rows INT,
  columns INT,
  age INT,
  patient_name VARCHAR(255),
  sex VARCHAR(10),
  has_missing_body_part BOOLEAN DEFAULT FALSE
);
```

### 3. `reports` table
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(patient_id),
  report_title VARCHAR(255),
  findings_text TEXT,
  impression_text TEXT,
  full_report_text TEXT,
  has_missing_impression BOOLEAN DEFAULT FALSE
);
```

### 4. `reviews` table
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(patient_id),
  image_id INT NOT NULL REFERENCES images(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('matched', 'mismatch', 'unsure')),
  label VARCHAR(20) NOT NULL CHECK (label IN ('normal', 'abnormal')),
  final_impression TEXT,
  notes TEXT,
  reviewer_name VARCHAR(255),
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Cloudinary Setup

1. Create a Cloudinary account: https://cloudinary.com
2. In your Cloudinary dashboard:
   - Note your **Cloud Name**
   - Create an API Key and Secret (Settings → API Keys)
   - Create a folder structure: `ARBAN/images/{patient_id}` where patient IDs match your Supabase data
3. Upload medical images to `ARBAN/images/{patient_id}` folders organized by patient

## Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in the environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary (Public)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Cloudinary (Server-only - keep secret!)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Getting Your Credentials

**Supabase:**
1. Go to: https://app.supabase.com/project/[your-project]/settings/api
2. Copy `Project URL` and `Anon Public Key`

**Cloudinary:**
1. Go to: https://cloudinary.com/console
2. Find `Cloud Name`, `API Key`, and `API Secret`

## Installation & Running

1. **Install dependencies:**
```bash
pnpm install
```

2. **Run the development server:**
```bash
pnpm dev
```

3. **Open the app:**
Navigate to http://localhost:3000

## Features

- **Patient Navigation**: Browse patients with prev/next buttons or arrow keys (← →)
- **Body Part Filtering**: Filter patient list by body part
- **Image Gallery**: View patient images from Cloudinary with click-to-enlarge modal
- **DICOM Metadata**: Display image technical details
- **Report Viewing**: Read findings and impression with highlighted body parts and abnormalities
- **Auto Flags**: Visual alerts for missing data (missing impression, missing body part classification)
- **Review Submission**: Submit reviews with status (matched/mismatch/unsure), finding label (normal/abnormal), impression, and notes
- **URL Persistence**: Patient and filter selection saved in URL query parameters

## Architecture

- **Frontend**: Next.js 16 with React Server & Client Components
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS) optional
- **Image Hosting**: Cloudinary with server-side Search API for image discovery
- **API**: Next.js Route Handlers for server-side Cloudinary integration

## Key Components

- **PatientInfoPanel**: Patient demographics (ID, name, age, sex)
- **DicomMetadataPanel**: Image technical metadata
- **ReportPanel**: Medical report with smart text highlighting
- **AutoFlagsPanel**: Visual alerts for data quality issues
- **ReviewPanel**: Form for submitting reviews
- **ImageGallery**: Grid view of patient images with selection
- **ImageModal**: Full-size image viewer

## Keyboard Shortcuts

- **Arrow Left (←)**: Navigate to previous patient
- **Arrow Right (→)**: Navigate to next patient
- **Escape**: Close image modal

## Troubleshooting

### Images Not Loading
- Check Cloudinary credentials in .env.local
- Verify folder structure: `ARBAN/images/{patient_id}`
- Ensure images are in supported formats (jpg, png, jpeg, webp)

### Patient Data Not Loading
- Check Supabase credentials in .env.local
- Verify database tables exist and have data
- Check browser console for error messages

### Review Submission Failing
- Ensure `reviews` table exists in Supabase
- Check that patient_id and image_id exist in database
- Verify Supabase Row-Level Security (RLS) policies (if enabled)

## Deployment

The app is ready to deploy to Vercel:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

For detailed instructions: https://vercel.com/docs/deployments/github

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Check Cloudinary documentation: https://cloudinary.com/documentation
- Check Next.js documentation: https://nextjs.org/docs
