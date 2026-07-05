# Backend run guide

## Start the backend
From the backend folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start_backend.ps1
```

## Configure Supabase
Edit the .env file and set DATABASE_URL to your Supabase connection string, for example:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

## Verify
Open:

- http://localhost:8000/api/health
