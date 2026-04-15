# SellSmart

SellSmart is a smart product valuation and listing assistant designed to help users prepare product data, upload images, and generate more structured, marketplace-ready valuations. This project focuses on a smoother dashboard experience, safer request handling, clearer user feedback, and stronger overall stability.

## Features

- AI-assisted product valuation flow
- Image upload and preview handling
- Valuation history with reload support
- Dashboard with state-aware feedback
- Authentication-protected routes
- Demo data loading for testing and presentation

## Tech Stack

- Next.js
- TypeScript
- Supabase
- Vercel

## Running Locally

1. Clone the repository:

git clone https://github.com/dhurkaa/SellSmart.git
cd SellSmart
Install dependencies:
npm install
Create a .env.local file in the root of the project.
Add the required environment variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
Start the development server:
npm run dev
Environment Variables

Create a .env.local file and add:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

If additional variables are used in your local setup, add them here as well.

Live Project
GitHub Repository: https://github.com/dhurkaa/SellSmart
Live URL: https://sell-smart-six.vercel.app

Debugging, Review & Hardening Update

Bug Fixed
The dashboard previously did not handle missing data reliably.
The retry flow was fixed so it now resends the last real request instead of using unstable state.
History loading was improved to correctly preserve and restore category and businessGoal.
Image handling was improved so the primary image no longer remains empty after deletion.
UX / Feedback Improvements
Added success messages for:
valuation generation
image uploads
demo data loading
opening a valuation from history
Improved error messages for:
timeout
network errors
invalid image
maximum image count
invalid form fields
Strengthened double-submit protection using isSubmitting
Improved button safety during loading states
Added clearer retry and session-expiry feedback

Refactoring / Cleanup
Added pendingRequestRef to preserve the latest stable request payload
Extracted payload construction into buildPendingRequest
Improved callAssistant logic for better request consistency
Cleaned up history and image-handling logic
Added cleanup for image preview URLs
Hardening / Stability
Added stronger validation for:
productName
location
category
condition
composer
image type
image size
image count
Limited retry flow to a maximum of 3 attempts
Improved session and network state handling
Preserved AuthGuard for route protection
Added clearer handling for session expiry
Goal of This Update

This week’s work focused on making the project:

more stable
easier to demo
clearer for the user
harder to break in real edge cases
