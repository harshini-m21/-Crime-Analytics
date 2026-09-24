"""
Crime Analytics Visualization Using Machine Learning
Flask Backend Application
"""

import os, json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify, send_from_directory

# ── App setup ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Load ML artefacts ──────────────────────────────────────────────────────────
model          = joblib.load(os.path.join(BASE_DIR, 'crime_prediction_model.pkl'))
feature_enc    = joblib.load(os.path.join(BASE_DIR, 'feature_encoders.pkl'))
target_enc     = joblib.load(os.path.join(BASE_DIR, 'target_encoder.pkl'))

with open(os.path.join(BASE_DIR, 'model_accuracy.txt')) as f:
    MODEL_ACCURACY = float(f.read().strip())

# ── Load dataset ───────────────────────────────────────────────────────────────
df = pd.read_csv(os.path.join(BASE_DIR, 'cleaned_crime_dataset.csv'))

# Parse year from 'Date of Occurrence'
df['Year'] = pd.to_datetime(df['Date of Occurrence'], dayfirst=True, errors='coerce').dt.year
df['Year'] = df['Year'].fillna(2020).astype(int)

# ── Encoder meta helpers ───────────────────────────────────────────────────────
CITIES   = sorted(feature_enc['City'].classes_.tolist())
GENDERS  = sorted(feature_enc['Victim Gender'].classes_.tolist())
WEAPONS  = sorted(feature_enc['Weapon Used'].classes_.tolist())
DOMAINS  = sorted(feature_enc['Crime Domain'].classes_.tolist())
CRIME_TYPES = sorted(target_enc.classes_.tolist())

# ── Helper: serialise numpy types for JSON ─────────────────────────────────────
def jsonify_np(obj):
    if isinstance(obj, (np.integer,)):  return int(obj)
    if isinstance(obj, (np.floating,)): return float(obj)
    if isinstance(obj, np.ndarray):     return obj.tolist()
    raise TypeError

# ══════════════════════════════════════════════════════════════════════════════
# PAGE ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/analysis')
def analysis():
    return render_template('analysis.html')

@app.route('/prediction')
def prediction():
    return render_template('prediction.html',
                           cities=CITIES, genders=GENDERS,
                           weapons=WEAPONS, domains=DOMAINS)

@app.route('/model')
def model_page():
    return render_template('model.html', accuracy=MODEL_ACCURACY)

@app.route('/about')
def about():
    return render_template('about.html')

# Serve accuracy image
@app.route('/accuracy.png')
def accuracy_img():
    return send_from_directory(BASE_DIR, 'accuracy.png')

# ══════════════════════════════════════════════════════════════════════════════
# API ROUTES
# ══════════════════════════════════════════════════════════════════════════════

# ── Dashboard Stats ────────────────────────────────────────────────────────────
@app.route('/api/dashboard_stats')
def api_dashboard_stats():
    total_crimes   = int(len(df))
    total_cities   = int(df['City'].nunique())
    crime_types    = int(df['Crime Description'].nunique())
    crime_domains  = int(df['Crime Domain'].nunique())
    closed_cases   = int((df['Case Closed'] == 'Yes').sum())
    open_cases     = int((df['Case Closed'] == 'No').sum())
    closure_rate   = round(closed_cases / total_crimes * 100, 1)

    return jsonify({
        'total_crimes':  total_crimes,
        'total_cities':  total_cities,
        'crime_types':   crime_types,
        'crime_domains': crime_domains,
        'closed_cases':  closed_cases,
        'open_cases':    open_cases,
        'closure_rate':  closure_rate,
        'model_accuracy': MODEL_ACCURACY
    })

# ── Top crime types ────────────────────────────────────────────────────────────
@app.route('/api/top_crime_types')
def api_top_crime_types():
    top = df['Crime Description'].value_counts().head(10)
    return jsonify({'labels': top.index.tolist(), 'values': top.values.tolist()})

# ── Top cities ─────────────────────────────────────────────────────────────────
@app.route('/api/top_cities')
def api_top_cities():
    top = df['City'].value_counts().head(10)
    return jsonify({'labels': top.index.tolist(), 'values': top.values.tolist()})

# ── Year-wise trend ────────────────────────────────────────────────────────────
@app.route('/api/year_trend')
def api_year_trend():
    trend = df.groupby('Year').size().reset_index(name='count').sort_values('Year')
    return jsonify({'years': trend['Year'].tolist(), 'counts': trend['count'].tolist()})

# ── Case status ────────────────────────────────────────────────────────────────
@app.route('/api/case_status')
def api_case_status():
    status = df['Case Closed'].value_counts()
    return jsonify({'labels': status.index.tolist(), 'values': status.values.tolist()})

# ── Crime domain distribution ─────────────────────────────────────────────────
@app.route('/api/crime_domains')
def api_crime_domains():
    domains = df['Crime Domain'].value_counts()
    return jsonify({'labels': domains.index.tolist(), 'values': domains.values.tolist()})

# ── Weapon distribution ────────────────────────────────────────────────────────
@app.route('/api/weapon_dist')
def api_weapon_dist():
    weapons = df['Weapon Used'].value_counts()
    return jsonify({'labels': weapons.index.tolist(), 'values': weapons.values.tolist()})

# ── Gender distribution ────────────────────────────────────────────────────────
@app.route('/api/gender_dist')
def api_gender_dist():
    gender = df['Victim Gender'].value_counts()
    labels = {'M': 'Male', 'F': 'Female', 'X': 'Other'}
    return jsonify({
        'labels': [labels.get(g, g) for g in gender.index.tolist()],
        'values': gender.values.tolist()
    })

# ── City-wise crime table ──────────────────────────────────────────────────────
@app.route('/api/city_stats')
def api_city_stats():
    city_stats = df.groupby('City').agg(
        total=('Crime Description', 'count'),
        closed=('Case Closed', lambda x: (x == 'Yes').sum()),
        top_crime=('Crime Description', lambda x: x.value_counts().index[0])
    ).reset_index()
    city_stats['open']         = city_stats['total'] - city_stats['closed']
    city_stats['closure_rate'] = (city_stats['closed'] / city_stats['total'] * 100).round(1)
    city_stats = city_stats.sort_values('total', ascending=False)
    return jsonify(city_stats.to_dict(orient='records'))

# ── Crime type stats table ─────────────────────────────────────────────────────
@app.route('/api/crime_type_stats')
def api_crime_type_stats():
    stats = df.groupby('Crime Description').agg(
        total=('City', 'count'),
        top_city=('City', lambda x: x.value_counts().index[0]),
        avg_age=('Victim Age', 'mean'),
        closed=('Case Closed', lambda x: (x == 'Yes').sum())
    ).reset_index()
    stats['closure_rate'] = (stats['closed'] / stats['total'] * 100).round(1)
    stats['avg_age']      = stats['avg_age'].round(1)
    stats = stats.sort_values('total', ascending=False)
    return jsonify(stats.to_dict(orient='records'))

# ── Year + domain heatmap ──────────────────────────────────────────────────────
@app.route('/api/year_domain')
def api_year_domain():
    pivot = df.groupby(['Year', 'Crime Domain']).size().unstack(fill_value=0).reset_index()
    return jsonify(pivot.to_dict(orient='records'))

# ── Analysis filter endpoint ───────────────────────────────────────────────────
@app.route('/api/filter_analysis')
def api_filter_analysis():
    city   = request.args.get('city', 'All')
    year   = request.args.get('year', 'All')
    domain = request.args.get('domain', 'All')

    filtered = df.copy()
    if city   != 'All': filtered = filtered[filtered['City']        == city]
    if domain != 'All': filtered = filtered[filtered['Crime Domain'] == domain]
    if year   != 'All': filtered = filtered[filtered['Year']         == int(year)]

    crime_types = filtered['Crime Description'].value_counts().head(10)
    city_counts = filtered['City'].value_counts().head(10)
    year_trend  = filtered.groupby('Year').size().reset_index(name='count').sort_values('Year')
    status      = filtered['Case Closed'].value_counts()

    return jsonify({
        'total': int(len(filtered)),
        'crime_types': {'labels': crime_types.index.tolist(), 'values': crime_types.values.tolist()},
        'city_counts': {'labels': city_counts.index.tolist(), 'values': city_counts.values.tolist()},
        'year_trend':  {'years': year_trend['Year'].tolist(), 'counts': year_trend['count'].tolist()},
        'case_status': {'labels': status.index.tolist(), 'values': status.values.tolist()}
    })

# ── Filter options ─────────────────────────────────────────────────────────────
@app.route('/api/filter_options')
def api_filter_options():
    return jsonify({
        'cities':  ['All'] + sorted(df['City'].unique().tolist()),
        'years':   ['All'] + sorted(df['Year'].unique().astype(str).tolist()),
        'domains': ['All'] + sorted(df['Crime Domain'].unique().tolist())
    })

# ── ML Prediction ──────────────────────────────────────────────────────────────
@app.route('/api/predict', methods=['POST'])
def api_predict():
    try:
        data = request.get_json()
        victim_age  = int(data['victim_age'])
        city        = data['city']
        gender      = data['victim_gender']
        weapon      = data['weapon_used']
        domain      = data['crime_domain']

        # Validate age
        if not (0 <= victim_age <= 120):
            return jsonify({'error': 'Victim age must be between 0 and 120.'}), 400

        # Encode features
        city_enc   = feature_enc['City'].transform([city])[0]
        gender_enc = feature_enc['Victim Gender'].transform([gender])[0]
        weapon_enc = feature_enc['Weapon Used'].transform([weapon])[0]
        domain_enc = feature_enc['Crime Domain'].transform([domain])[0]

        X = pd.DataFrame([[victim_age, city_enc, gender_enc, weapon_enc, domain_enc]],
                         columns=['Victim Age', 'City', 'Victim Gender', 'Weapon Used', 'Crime Domain'])
        pred_class = model.predict(X)[0]
        pred_proba = model.predict_proba(X)[0]

        crime_label   = target_enc.inverse_transform([pred_class])[0]
        confidence    = float(round(max(pred_proba) * 100, 2))

        # Top 3 predictions
        top3_idx    = np.argsort(pred_proba)[::-1][:3]
        top3        = [{'crime': target_enc.inverse_transform([i])[0],
                        'probability': round(float(pred_proba[i]) * 100, 2)}
                       for i in top3_idx]

        return jsonify({
            'predicted_crime': crime_label,
            'confidence':      confidence,
            'top3':            top3,
            'inputs': {
                'victim_age': victim_age, 'city': city,
                'victim_gender': gender,  'weapon_used': weapon,
                'crime_domain': domain
            }
        })

    except ValueError as e:
        return jsonify({'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

# ── Age distribution for charts ────────────────────────────────────────────────
@app.route('/api/age_distribution')
def api_age_distribution():
    bins   = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    labels = ['0-10','11-20','21-30','31-40','41-50','51-60','61-70','71-80','81-90','91+']
    df['age_group'] = pd.cut(df['Victim Age'], bins=bins, labels=labels, right=True)
    age_dist = df['age_group'].value_counts().sort_index()
    return jsonify({'labels': age_dist.index.tolist(), 'values': age_dist.values.tolist()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
