# 🎓 JusticeWatch: Academic Scope & Constraints Checklist

This document formally outlines the academic constraints, allowed technologies, and syllabus rules that were strictly adhered to during the development of the **JusticeWatch** platform.

---

## 1. Syllabus Essentials (Allowed Technologies & Concepts)

### 📊 Data Analysis & Preprocessing
*   **Library:** Pandas
*   **Implemented Concepts:** 
    - Exploratory Data Analysis (EDA) on raw court records.
    - Handled missing data via targeted `.dropna()` and `.fillna()` functions.
    - Addressed duplicate entries.
    - Utilized `.groupby()`, `.merge()`, and `.concat()` for aggregating 131,000+ district-level records.
    - Deployed `.corr()` and `.value_counts()` for statistical trend analysis.
    - Executed outlier detection to prevent skewed age predictions.

### 📈 Data Visualization
*   **Core Concepts:** Dashboards, dynamic charts, heatmaps.
*   **Implementation:** Developed a custom zero-dependency SVG rendering engine in React to plot 24-month case timelines and heatmaps, avoiding bloated external graphing libraries while demonstrating mastery of vector math.

### 🤖 Machine Learning (Scikit-Learn)
*   **Libraries:** Scikit-Learn
*   **Models Deployed:** Random Forest Classification
*   **Implemented Concepts:**
    - **Feature Engineering:** Extracted relevant metrics (FIR age, category, district load) into numerical vectors.
    - **Train-Validation Split:** Cross-validated subsets for precision.
    - **Metrics:** Evaluated model precision, recall, and Confusion Matrix boundaries to assign cases into Low/Medium/High/Critical difficulty tiers.

### 🌐 Backend Framework & Architecture
*   **Framework:** Django (Backend-First)
*   **Implemented Concepts:**
    - Strict Model-View-Template (MVT) foundational architecture.
    - Extensive usage of Django Models, raw ORM aggregations, and Migrations.
    - Built-in User Authentication merged with Role-Based Access Control (RBAC).

### 🔌 REST APIs
*   **Framework:** Django REST Framework (DRF)
*   **Implemented Concepts:**
    - Extensive `ModelSerializer` usage for JSON responses.
    - Paginated API responses (`PageNumberPagination`).
    - Standardized `ViewSet` and `APIView` endpoint routing.
    - Secure **JWT Authentication** (`rest_framework_simplejwt`).

---

## 2. Development Directives & Execution Proof

1. **Strict Syllabus Adherence:** 
   No advanced natural language processors (like BERT) or unapproved neural frameworks (like PyTorch) were used. The predictive models rely entirely on structured, tabular machine learning via Scikit-Learn and Pandas to respect the syllabus boundaries.
2. **Architecture Conformity:** 
   The platform strictly maintains the Django (Backend) + DRF (API) + React (Frontend) stack. All authentication is verified dynamically via JWTs on both the client and server sides.
3. **Flawless Execution:** 
   The deployed system handles a massive SQLite demonstration database comprising over 131,000 case records spanning 33 districts, maintaining near-instant load times through optimized ORM queries (`.annotate`, `TruncMonth`, `Count`).
4. **Modularity & Scalability:** 
   The backend logic is rigorously decoupled into independent Django apps: `accounts`, `analytics`, `cases`, `districts`, and `timeline`. The frontend follows a strict separation of concerns, isolating highly reusable UI components (`DistrictDetailModal.tsx`, `StatCard.tsx`) from the main page structures.
5. **No Shortcut UI Frameworks:** 
   In alignment with building strong foundational web skills, **Tailwind CSS was strictly forbidden and removed**. The entire interface, including complex flexbox layouts and interactive hover sidecars, was hand-crafted using raw CSS modules and standard classes.
