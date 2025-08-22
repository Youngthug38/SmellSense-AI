from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Initialize Flask App
app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# --- Model Training ---
df = pd.read_csv('mock_breath_data.csv')
X = df.drop('condition', axis=1)
y = df['condition']
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)
# --- End of Model Training ---


# --- Route to Serve the Frontend ---
@app.route('/')
def home():
    return render_template('index.html')


# --- API Endpoint for Predictions (UPDATED) ---
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        features = pd.DataFrame([data])
        features = features[X.columns]
        
        # Get both the final prediction and the probabilities
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        
        # Create a dictionary of probabilities with class names
        prob_dict = {model.classes_[i]: probabilities[i] for i in range(len(model.classes_))}
        
        return jsonify({
            'prediction': prediction,
            'probabilities': prob_dict, # <-- SEND PROBABILITIES
            'biomarkers': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# For local testing
if __name__ == '__main__':
    app.run(debug=True)