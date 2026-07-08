<div align="center">

# ⚖️ JusticeWatch
**Gujarat Judiciary Predictive Analytics & Case Management Platform**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Machine_Learning-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

*A robust, decoupled full-stack platform providing judges and lawyers with strategic insights into caseloads, pendency trends, and machine-learning-driven case complexity metrics.*

</div>

---

## 📖 Table of Contents
- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Modules](#-architecture--modules)
- [Machine Learning Integration](#-machine-learning-integration)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)

---

## 🏛️ About The Project
JusticeWatch was developed to alleviate judicial administrative overhead in the Gujarat District Courts. By unifying state-wide caseload data into a singular, highly secure interface, the platform offers predictive insight into case difficulty, district congestion, and hearing timelines. 

It is designed with strict **Role-Based Access Control (RBAC)**, separating the macro-analytical capabilities required by Judges from the micro-case management tools needed by Bar Registered Advocates.

---

## ✨ Key Features

### 👨‍⚖️ For Judicial Authorities (Judges)
- **State-Wide Command Center**: Real-time aggregation of pending cases, disposed records, and disposal rates across all 33 districts.
- **District Severity Heatmaps**: Visual identification of critically congested judicial districts using custom interactive SVG map analytics.
- **Predictive Trial Burden Analytics**: Machine Learning integration that estimates case complexity (Low to Critical) based on procedural history, FIR age, and category parameters.
- **Critical Backlog Escalation Watch**: Automated surfacing of the highest-difficulty cases requiring immediate attention.
- **24-Month Pendency Timelines**: Real-time graphing of cases filed versus cases disposed using zero-dependency raw SVGs.

### 💼 For Legal Counsel (Lawyers)
- **Personal Case Workbench**: A focused dashboard tracking assigned cases, upcoming hearing dates, and required procedural actions.
- **Case Dossier Management**: Direct access to update chargesheet statuses and compile private trial notes directly onto the official case ledger.
- **Secure Registry Enrollment**: Automated verification pipeline ensuring only Bar-registered advocates gain system access.

---

## 🛠️ Tech Stack

**Frontend Interface**
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Hand-crafted CSS Variables (Custom Dark Judicial Theme, Zero external CSS frameworks)
- **Routing:** React Router v6
- **Visualization:** Custom Zero-Dependency SVG Rendering

**Backend & ML API**
- **Framework:** Django & Django REST Framework (DRF)
- **Authentication:** JWT (JSON Web Tokens)
- **Database:** SQLite (Demo dataset: 131,000+ case records)
- **Data Processing:** Pandas
- **Machine Learning:** Scikit-Learn (Random Forest Classification)

---

## 🧩 Architecture & Modules

```mermaid
graph TD;
    Client[React Frontend] -->|JWT Auth & REST API| API[Django DRF Backend];
    
    subgraph Django Apps
        Auth[Accounts / Auth]
        Cases[Case Registry]
        Timeline[Hearing Timeline]
        Analytics[Court Analytics]
        Districts[District Tracking]
    end

    API --> Auth
    API --> Cases
    API --> Timeline
    API --> Analytics
    API --> Districts

    Cases --> DB[(SQLite Database)]
    Timeline --> DB
    Analytics --> DB
    
    Cases --> ML[Scikit-Learn Random Forest Predictor]
```

---

## 🤖 Machine Learning Integration
JusticeWatch leverages a pre-trained **Random Forest Classifier** built with Scikit-Learn to estimate the "Difficulty Tier" (Low, Medium, High, Critical) of an incoming case. 

The predictive model assesses multi-dimensional parameters including:
- Criminal vs. Civil Case Categories
- Historical severity index of specific charges (e.g., Financial Fraud vs. Property Dispute)
- Initial filing delays and chargesheet lag times

This prevents severe cases from stagnating in the backlog by preemptively flagging them for fast-tracked judicial assignment.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- Python 3.10+
- Node.js 18+

### Installation & Execution
Detailed setup instructions, including database population and mock data generation, are maintained in our **[Guidelines.md](./Guidelines.md)**.

1. **Clone the repo**
   ```sh
   git clone https://github.com/your-username/JusticeWatch.git
   cd JusticeWatch
   ```

2. **Setup the Backend**
   ```sh
   cd backend
   python -m venv venv
   source venv/Scripts/activate  # (Windows)
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Setup the Frontend**
   ```sh
   cd frontend
   npm install
   npm run dev
   ```

---

## 📚 Documentation
For complete project documentation, role verification rules, and deployment instructions, please read **[Guidelines.md](./Guidelines.md)**. 

<div align="center">
  <br>
  <i>Designed and built for optimal data-driven judiciary administration.</i>
</div>
