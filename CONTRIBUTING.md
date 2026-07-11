# Contributing to JusticeWatch

Thank you for your interest in contributing to JusticeWatch! Please adhere to the following guidelines:

## Code Formatting
- The backend utilizes standard **Python Black** formatting. Please format all backend files with Black before opening a Pull Request.

## Data Privacy
- **Critical:** Ensure no actual citizen data, PII, or sensitive legal documents are ever committed to this repository.
- Use only the anonymized SQLite dump and the aggregated `backend/ml_pipeline/data/` files provided.

## UI & Styling Constraints
- **No external UI frameworks** (like Tailwind CSS, Bootstrap, Material UI, etc.) are allowed.
- Please stick strictly to raw CSS modules (`.css` files) and hand-crafted CSS variables for maintaining the custom judicial dark theme.

## Large Files
- Large datasets and ML models should be tracked via Git LFS. Do not commit heavy binary files directly to the standard git tree.
