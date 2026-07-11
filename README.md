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
- **Framework:** React 19 + ES6 JavaScript
- **Bundler:** Vite
- **Styling:** Hand-crafted CSS Variables (Custom Dark Judicial Theme, Zero external CSS frameworks)
- **Routing:** React Router v6
- **Visualization:** Custom Zero-Dependency SVG Rendering

**Backend & ML API**
- **Framework:** Django & Django REST Framework (DRF)
- **Authentication:** JWT (JSON Web Tokens)
- **Database:** SQLite (Demo dataset: 131,000+ case records)
- **Data Processing:** Pandas
- **Visualization (ML):** Seaborn & Plotly
- **Machine Learning:** Scikit-Learn & TensorFlow/Keras

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
    
    Cases --> ML[Predictive Models (Scikit-Learn & Keras)]
```

---

## 🤖 Machine Learning Integration
JusticeWatch leverages multiple predictive models to estimate case outcomes and durations based on historical data.

- **Duration Regression Model**: Predicts the number of days a case will take to resolve. Evaluated using Linear and Polynomial Regression, with Polynomial Regression deployed as the most accurate model.
- **Multi-class Disposal Classifier Comparison**: Evaluates Random Forest, Decision Tree, and K-Nearest Neighbors to predict the case disposal type.
- **Deep Learning Baseline**: A Feedforward Neural Network was also developed for comparison, demonstrating that Random Forest significantly outperforms standard neural networks on this specific tabular dataset.
- **Fairness and Bias Audit**: The model predictions undergo a gender bias audit (Male vs Female Defendants) to ensure the Average Prediction Error variance remains within acceptable operational limits.

This prevents severe cases from stagnating in the backlog by preemptively flagging them for fast-tracked judicial assignment.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- Python 3.10+
- Node.js 18+

### Installation & Execution
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
   ```
   *Note: By design, this repository does not ship with any default or hardcoded credentials. To access the admin panel, you must create a superuser interactively:*
   ```sh
   python manage.py createsuperuser
   ```

   **Generate the Machine Learning Models:**
   The Random Forest model artifact is too large for GitHub and must be generated locally. Run the training script once before starting the server. (If you skip this, the app will gracefully return a clear error in the predictions view rather than crashing).
   ```sh
   python ml_pipeline/train_model.py
   ```
   python manage.py runserver
   ```

If you are contributing to the machine learning pipelines and wish to retrain the models, you must download the raw historical datasets directly from the **Development Data Lab (DDL)**. To keep this repository lightweight, the raw data is not hosted here.

### Dataset Setup Instructions

1. Visit the [Development Data Lab Judicial Data Portal](https://www.devdatalab.org/judicial-data).
2. Under **Target contents**, you will find four distinct links:
   - **Data download**: A public Dropbox link containing the raw CSVs.
   - **Act sections metadata**: A Google Sheet link.
   - **All cases metadata**: A Google Sheet link.
   - **Judges metadata**: A Google Sheet link.
3. From the **Data download** (Dropbox) link, download the following required components:
   - `keys/` (folder containing relationship mapping CSVs)
   - `cases/cases_2011.csv`
   - `cases/cases_2014.csv`
   - `cases/cases_2017.csv`
4. Place the downloaded files into the repository matching this exact structure:
   ```text
   backend/ml_pipeline/data/
   ├── keys/
   │   └── *.csv
   └── cases/
       ├── cases_2011.csv
       ├── cases_2014.csv
       └── cases_2017.csv
   ```
5. Run the training script: `python backend/ml_pipeline/train_model.py`

**Attribution:**
This data uses the Open Database License. If you use it for external research, please cite:
```bibtex
@article{aabbcdgns2025bias,
	author = {Ash, Elliott and Asher, Sam and Bhowmick, Aditi and Bhupatiraju, Sandeep and Chen, Daniel and Devi, Tanaya and Goessmann, Christoph and Novosad, Paul and Siddiqi, Bilal},
	title = {In-Group Bias in the Indian Judiciary: Evidence from 5 Million Criminal Cases},
	journal = {The Review of Economics and Statistics},
	doi = {10.1162/rest_a_01569},
	url = {https://doi.org/10.1162/rest\_a\_01569},
	year = {2025},
}
```

- Please review the [CONTRIBUTING.md](CONTRIBUTING.md) for styling and data-privacy constraints before opening PRs.

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
