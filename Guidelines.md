# Guidelines for JusticeWatch

Welcome to the **JusticeWatch** project repository. Follow these guidelines to set up, run, and interact with the application.

## 1. Project Architecture
JusticeWatch is built with a strictly segregated full-stack architecture:
*   **Backend:** Django & Django REST Framework (DRF)
*   **Database:** SQLite (`db.sqlite3` is intentionally tracked in Git for demonstration/portfolio purposes)
*   **Frontend:** React (Vite) + Vanilla CSS (No external CSS libraries)

## 2. Local Environment Setup

### Backend (Django)
1. Open a terminal and navigate to the `backend/` directory.
2. Activate your virtual environment (e.g., `venv\Scripts\activate` on Windows).
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Django server:
   ```bash
   python manage.py runserver
   ```
5. The backend API will be available at `http://127.0.0.1:8000/`.

### Frontend (React/Vite)
1. Open a new terminal and navigate to the `frontend/` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the frontend app (typically `http://localhost:5173/`).

## 3. Administration & Roles
*   **Django Admin Portal:** Access the admin portal at `http://127.0.0.1:8000/admin/`. 
*   **Superuser Credentials:** You can log in using `admin` / `admin`.
*   **Judges:** Must be manually created or assigned by an Administrator from the Django Admin Panel.
*   **Lawyers:** Can register through the public-facing frontend Registration page, but require admin verification before accessing the system.

## 4. Synthetic Data Generation
If the database needs to be populated with realistic mock data for testing ML features, you can execute the data generator script:
```bash
cd backend
python ml_pipeline/generate_synthetic_data.py
```
This will automatically generate districts, cases, hearings, and apply machine learning difficulty scores.

## 5. Deployment Rules
*   Never use `DEBUG = True` in a production environment.
*   Ensure that CORS settings in `settings.py` are strictly defined for the domain.
*   If changing databases, remember to add the new credentials to the environment variables and update `.gitignore` as needed.
