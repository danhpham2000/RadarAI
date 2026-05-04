# RadarAI

RadarAI is an AI-powered scam detection platform that helps users analyze suspicious messages, links, screenshots, and voice transcripts before they click, reply, send money, or share personal information.

## Problem

Scams are spreading across social media platforms, messaging apps, marketplaces, fake shopping sites, phishing links, and voice calls. Many users do not know what warning signs to look for until after they have already been targeted.

RadarAI helps users detect scam risk earlier and respond safely.

## What RadarAI Does

RadarAI allows users to submit suspicious content and receive a structured scam-risk report.

The platform can analyze:

- Text messages
- Social media DMs
- Marketplace listings
- Suspicious URLs
- Screenshots
- Voice transcripts or audio files

RadarAI returns:

- Risk score
- Risk level
- Scam category
- Red flags
- Explanation
- Recommended action
- Safe reply
- Report-ready summary

## Key Features

- Text scam analysis
- URL scam analysis with Firecrawl
- Screenshot OCR scanning
- Voice transcript scanning
- AI-powered scam classification
- Scam pattern matching
- Risk scoring
- Safe response generation
- Report summary generation
- Scan history
- Scam trend dashboard

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

### Backend and Database

- FastAPI
- Python
- PostgreSQL

### AI and Processing

- OpenAI
- Speech-to-text with Deepgram
- OCR for screenshot text extraction with OpenAI Vision Model
- Upstash Redis for caching and rate limiting

### Deployment

- Vercel
- Railway

Expanding infrastructure and configuration in the future:

- More powerful OpenAI model for more reasoning and scam detection capability
- Terraform
- DigitalOcean
- Temporal

## How It Works

```txt
User Input
  ↓
Preprocessing
  ↓
Text / URL / OCR / Voice Extraction
  ↓
Scam Pattern Matching
  ↓
AI Risk Analysis
  ↓
Risk Score + Red Flags
  ↓
Safe Action + Report Summary
