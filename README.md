# Crime Analytics Visualization Using Machine Learning

A professional Flask web application for crime data analysis and ML-based crime prediction.

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the app:
   ```bash
   python app.py
   ```

3. Open browser: http://localhost:5000

## Project Structure
```
ML/
├── app.py                      # Flask backend
├── cleaned_crime_dataset.csv   # Cleaned crime dataset
├── crime_prediction_model.pkl  # Trained Random Forest model
├── feature_encoders.pkl        # Label encoders for features
├── target_encoder.pkl          # Label encoder for target
├── model_accuracy.txt          # Model accuracy value
├── requirements.txt            # Python dependencies
├── templates/                  # HTML templates
│   ├── base.html
│   ├── dashboard.html
│   ├── analysis.html
│   ├── prediction.html
│   ├── model.html
│   └── about.html
└── static/
    ├── css/main.css
    └── js/
        ├── main.js
        ├── dashboard.js
        ├── analysis.js
        └── prediction.js
```

## Features
- **Dashboard**: KPI cards, trend charts, domain/weapon/gender distribution
- **Crime Analysis**: Interactive filters, city & crime-type tables
- **Prediction**: ML form with confidence ring and top-3 results
- **Model**: Technical overview, pipeline, features list
- **About**: Project documentation

## Tech Stack
- Backend: Python, Flask, Pandas, scikit-learn, joblib
- Frontend: HTML5, CSS3, JavaScript, Chart.js 4
