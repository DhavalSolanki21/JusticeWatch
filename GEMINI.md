# Project JusticeWatch - Syllabus Constraints & Guidelines

## User Request Context
The user wants to build a predictive legal analytics system ("JusticeWatch") where lawyers or judges can input case details, and the system processes data from past cases to predict outcomes, possibilities, and generate insights.

**CRITICAL RULE:** All implementations must strictly align with the user's academic syllabus or stay very close to it.

## Syllabus Essentials (Allowed Technologies & Concepts)

### 1. Data Analysis & Preprocessing
*   **Library:** Pandas
*   **Concepts:** EDA, handling missing data (`dropna`, `fillna`), duplicates, aggregations (`groupby`, `merge`, `concat`), statistical analysis (`corr`, `value_counts`, cross-tabulation), and outlier detection/removal.

### 2. Data Visualization
*   **Libraries:** Seaborn, Plotly, Dash, NetworkX
*   **Concepts:** Box plots, scatter plots, heatmaps, interactive dashboards, graph visualizations.

### 3. Machine Learning (Scikit-Learn)
*   **Regression:** Simple/Multiple Linear Regression, Polynomial Regression. (Metrics: R-squared, MAE, MSE)
*   **Classification:** kNN, Decision Tree (Entropy), Random Forest, SVM. (Metrics: Confusion Matrix, accuracy, sensitivity, specificity, error rate)
*   **Concepts:** Train-validation split, cross-validation, feature engineering.

### 4. Deep Learning
*   **Library:** TensorFlow/Keras
*   **Concepts:** Basic Neural Networks (ReLU, Sigmoid, Softmax), CNN basics (pooling, dropout), Transfer Learning (pre-trained models).

### 5. Web Scraping & APIs
*   **Libraries:** BeautifulSoup, `requests`
*   **Concepts:** Extracting data, handling JSON, pagination, rate limiting.

### 6. Backend Framework
*   **Framework:** Django (Backend-First)
*   **Concepts:** MVT architecture, Django Models, ORM, Migrations, Django Forms, User Authentication, CSRF protection.

### 7. REST APIs
*   **Framework:** Django REST Framework (DRF)
*   **Concepts:** Serializers, Viewsets, Routers, JWT Authentication, Role-based APIs, API versioning.

## Development Directives
1.  **Strict Syllabus Adherence:** Do not use advanced or external ML libraries/frameworks (like PyTorch, advanced NLP transformers like BERT, etc.) unless they can be justified under "Transfer Learning" via Keras/TensorFlow. Stick to Pandas, Scikit-Learn, and basic TensorFlow.
2.  **Architecture:** The project must use a Django backend, DRF for APIs, and JWT for authentication.
3.  **Predictive Feature Implementation:** The legal prediction feature must be implemented using the classification/regression algorithms explicitly mentioned above (e.g., Random Forest or a basic Neural Network to predict case outcomes based on structured features).
4.  **Flawless Execution:** Build a flawless, fully working, deployable project per user global rules.
5.  **Scalability (Geography):** The system is initially being built for Gujarat, but the database architecture and logic must be scalable to accommodate all of India in the future (e.g., proper state/district hierarchies).
6.  **Modularity:** Maintain a highly structured and managed architecture. Create a new Django app for any distinct new module or functionality unless combination is strictly necessary.
