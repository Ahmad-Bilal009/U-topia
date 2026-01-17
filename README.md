# Referral System

A complete referral system built with React (frontend) and Node.js + Express (backend).

## Project Structure

```
U-topia/
├── backend/          # Node.js + Express backend
├── frontend/         # React + Tailwind + TanStack Query frontend
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Features

- Generate unique referral links
- Track referred users
- View referral statistics
- Copy referral links to clipboard
- Clean architecture with validation

