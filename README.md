# MediDiag Deployment Guide

## Why localhost MySQL fails on Vercel

If your backend is deployed to the cloud, `localhost` means that cloud machine, not your PC.
So MySQL credentials like `host=localhost` only work when MySQL is running on the same machine.

## Recommended production architecture

1. Frontend: deploy on Vercel (this repo root).
2. Backend (FastAPI): deploy on Render or Railway (from `backend/`).
3. Database: use managed MySQL (Railway MySQL, PlanetScale, Aiven, or AWS RDS).

This is the most reliable setup for this project because the backend uses Python ML packages (`pandas`, `scikit-learn`) that are usually easier to host on a dedicated Python service than Vercel serverless functions.

## Environment variables

Use these variables in your backend host:

- `MYSQL_URL` (or `DATABASE_URL`) in the form `mysql://user:password@host:3306/database`
- OR set the discrete variables:
	- `MYSQL_HOST`
	- `MYSQL_PORT`
	- `MYSQL_USER`
	- `MYSQL_PASSWORD`
	- `MYSQL_DATABASE`
- `MYSQL_AUTO_CREATE_DB=false` for managed databases
- `MYSQL_SSL_DISABLED=false` for managed databases (if provider requires TLS)
- `CORS_ORIGINS=https://your-frontend.vercel.app`

Use this variable in Vercel (frontend):

- `VITE_API_BASE_URL=https://your-backend-domain`

## Local development

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
npm install
npm run dev
```

## Deployment steps

1. Create managed MySQL and get connection credentials.
2. Deploy `backend/` as a Python web service.
3. Backend start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

4. Add backend environment variables listed above.
5. Deploy frontend repo to Vercel.
6. In Vercel project settings, add:

```bash
VITE_API_BASE_URL=https://your-backend-domain
```

7. Redeploy frontend and test API calls.

## Quick verification checklist

1. Backend health test: open `https://your-backend-domain/api/symptoms`
2. Frontend loads and shows symptoms list.
3. Creating a patient stores a row in cloud MySQL.
4. Diagnosis and referral flows complete without CORS errors.

