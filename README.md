# CogniNest
(Cognition + Neuro Engagement and Support Tools)
Support Minds, Ease Journeys: CogniNest for Parkinson’s Care
cogninest-96113.web.app

## Inspiration
My friend volunteers with individuals who have Parkinson’s, and one of the most difficult things he’s observed is how deeply the condition affects not just people's physical health, but also their mental well-being. CogniNest is built to address that overlooked dimension: supporting cognitive and emotional care for people navigating Parkinson’s.
## What it does
CogniNest is a web-based app that offers tailored cognitive and mental health support tools for individuals with Parkinson’s. It includes features for users, caregivers, and clinicians. Cognitive tracking, alerts and flags for declining activity, journal entries, and medicine management: all in a clean, accessible interface.
## Tech Stack

- HTML, Tailwind CSS for the sleek UI

- Vanilla JavaScript

- Chart.js for Data Visualization

- Firebase Authentication for secure logins

- Cloud Firestore to store user data (journals, reports, stats, etc.)

- Firebase Hosting for fast deployment

## Challenges I ran into
The login flow gave me some trouble initially: especially making Firebase Auth work smoothly across roles (users, caregivers, clinicians). Firestore was also totally new to me, so figuring out how to structure and retrieve the data properly took some experimenting, but eventually I figured it out.

## Accomplishments that we're proud of
I’m proud of building a fully functional tool that actually feels useful. Getting real-time user data flowing through Firestore, creating role-based dashboards, and deploying the app live felt like a big leap in terms of what I can build solo.
## What I learned
I learned how to use Firebase to build amazing projects end-to-end: from authentication to real-time databases to hosting. I also learned how to design for accessibility and responsiveness, especially for older users who might be interacting with the app.
## What's next for CogniNest:

- Add real-time clinician-patient messaging

- Set up reminders and alerts via SMS or email

- Build out analytics dashboards for caregivers and clinicians

- Add a puzzles + brain games page for patients to support cognitive stimulation

- Work with actual Parkinson’s caregivers or neurologists for feedback
