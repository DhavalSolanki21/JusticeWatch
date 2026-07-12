# 📋 JusticeWatch: Development, Coding & Compaction Guidelines

This document outlines the codebase standards, architectural implementation details, and compaction protocols for the **JusticeWatch** project. All developers must follow these guidelines before opening pull requests or committing code.

---

## 🏛️ 1. Architectural Layout & Modules

The project maintains a strict boundary between the backend REST API layer and the frontend Single-Page Application (SPA).

### 🖥️ Backend Architecture (Django REST Framework)
The backend is structured into modular, domain-specific Django apps:
- **`accounts`**: Custom User model replacing Django’s default auth, managing verified Bar credentials, roles (`judge` vs `lawyer`), and JWT token generation.
- **`cases`**: Model schemas for court cases and lawyer assignments, mapping to SQLite indices. Also houses the machine learning prediction endpoints.
- **`analytics`**: The primary data aggregation controller. Exposes high-performance endpoints for dashboard metrics without custom HTML rendering.
- **`districts`**: Geolocation service managing district court loads across Gujarat's 33 districts.
- **`timeline`**: Serves historical case progression logs and events.

### 🎨 Frontend Architecture (React & Vite)
The React application avoids layout libraries, opting for state-driven components:
- **State Management**: Authentication and user roles are propagated globally using React Context Providers (`AuthContext.jsx`).
- **Composition-over-Inheritance**: Views are constructed using a layout wrapper pattern, passing children elements into a structured dashboard shell containing the custom navigation sidebar.
- **Zero-Dependency SVG Graphing**: Charts and maps are built natively using React JSX to generate SVG path and polygon vectors directly from database coordinates.

---

## 🚀 2. Local Environment Setup & Run Configuration

### Backend Configuration
Create a local Python virtual environment to isolate project packages.

1. **Virtual Environment Setup**:
   ```bash
   cd backend
   python -m venv venv
   # Activate:
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
2. **Installation & Database Init**:
   ```bash
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   ```
3. **ML Model Training**:
   Before running the application, retrain or generate the local Random Forest models:
   ```bash
   python ml_pipeline/train_model.py
   ```
4. **Run Server**:
   ```bash
   python manage.py runserver
   ```

### Frontend Configuration
The frontend project runs on Node.js using Vite.

1. **Vite Initialization**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. **Routing & Endpoints**:
   The frontend communicates with the backend via `frontend/src/services/api.js`. Ensure the backend development port matches (default: `http://127.0.0.1:8000`).

---

## ✂️ 3. Code Compaction & Ponytail AI Guidelines

To maintain a clean, high-performance, and minimal codebase, all modifications are audited under the **Ponytail AI Compaction Ladder**:

```
[Level 1: YAGNI]      --> Do not build speculative features or extra abstraction layers.
[Level 2: STDLIB]     --> Use Python/JavaScript standard libraries instead of external packages.
[Level 3: NATIVE]     --> Prioritize browser-native structures (CSS Grid/Flexbox, raw SVGs).
[Level 4: COMPACTION] --> Condense syntax using expressions, lists/dict comprehensions, and inline expressions.
```

### 🏷️ Audit & Review Protocol
When performing codebase reviews or audits, classify structural changes using the following tags:
- **`delete`**: Safely remove dead imports, commented-out logic, unused assets, or abandoned templates.
- **`stdlib`**: Replace third-party library calls with built-in modules (e.g., standard math, datetime, or json utilities).
- **`native`**: Replace complex external components with native browser/CSS implementations (e.g., raw SVG plotting in React).
- **`yagni`**: Merge files, interfaces, or classes that exist solely to support a single concrete implementation.
- **`shrink`**: Refactor lengthy loops or assignments into compact expressions without affecting logic.

---

## 🎓 4. Academic & Technical Syllabus Boundaries

We adhere to a set of hard academic constraints. Any attempt to introduce unapproved frameworks will fail auditing.

1. **CSS Modules & Layouts**:
   - **Constraint**: **Tailwind CSS is strictly forbidden**. 
   - **Expectation**: Write clean, isolated stylesheets (`.css` files) utilizing CSS variables and custom flex/grid parameters. Keep styling modular and semantic.
2. **Machine Learning Restrictions**:
   - **Constraint**: No Deep Learning frameworks (PyTorch, Hugging Face) or advanced LLMs are allowed in production.
   - **Expectation**: The predictive pipeline must rely entirely on Scikit-Learn **Random Forest** algorithms for tabular court record analysis.
3. **Zero-Dependency Graphics**:
   - **Constraint**: External charting libraries (Chart.js, Recharts) are excluded.
   - **Expectation**: Render charts, heatmaps, and geographic plots using custom-built React SVG vector renderers, demonstrating clean math and DOM control.
4. **Decoupled Security**:
   - **Constraint**: Access tokens must be stateless.
   - **Expectation**: Enforce strict JSON Web Token validation on every request, verifying roles dynamically on both backend (DRF) and frontend (React).
