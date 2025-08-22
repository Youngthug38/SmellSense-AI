from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Initialize Flask App
# The static_folder argument tells Flask where to find CSS, JS, etc.
app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# --- Model Training ---
# Load the dataset
df = pd.read_csv('mock_breath_data.csv')

# Define features (X) and target (y)
X = df.drop('condition', axis=1)
y = df['condition']

# Initialize and train the RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)
# --- End of Model Training ---


# --- Route to Serve the Frontend ---
@app.route('/')
def home():
    """Serves the main HTML page."""
    return render_template('index.html')


# --- API Endpoint for Predictions ---
@app.route('/predict', methods=['POST'])
def predict():
    """Receives breath data and returns an AI prediction."""
    try:
        data = request.json
        # Convert incoming JSON to a pandas DataFrame
        features = pd.DataFrame([data])
        
        # Ensure the column order matches the training data
        features = features[X.columns]
        
        # Make a prediction
        prediction = model.predict(features)[0]
        
        # Return the prediction and original data
        return jsonify({
            'prediction': prediction,
            'biomarkers': data
        })
    except Exception as e:
        # Handle potential errors, like malformed data
        return jsonify({'error': str(e)}), 400

# This allows the app to be run directly for local testing
if __name__ == '__main__':
    app.run(debug=True)