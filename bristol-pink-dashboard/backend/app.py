from flask import Flask, request, jsonify
from flask_cors import CORS
from models.predictor import SalesPredictor
from models.evaluator import ModelEvaluator
from models import ALL_ALGORITHMS

app = Flask(__name__)
CORS(app)


@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    sales_data = data['sales_data']
    training_weeks = data.get('training_weeks', 4)
    algorithm = data.get('algorithm', 'linear_regression')

    predictor = SalesPredictor(algorithm=algorithm)
    predictions = predictor.predict(sales_data, training_weeks, forecast_weeks=4)

    return jsonify({'predictions': predictions})


@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    data = request.get_json()
    sales_data = data['sales_data']
    training_weeks = data.get('training_weeks', 4)
    algorithm = data.get('algorithm', 'linear_regression')

    evaluator = ModelEvaluator(algorithm=algorithm)
    metrics = evaluator.evaluate(sales_data, training_weeks)

    return jsonify(metrics)


@app.route('/api/evaluate/compare', methods=['POST'])
def evaluate_compare():
    """Compare all algorithms at a single training window."""
    data = request.get_json()
    sales_data = data['sales_data']
    training_weeks = data.get('training_weeks', 4)

    results = ModelEvaluator.compare_all(sales_data, training_weeks)
    return jsonify({'results': results})


@app.route('/api/evaluate/windows', methods=['POST'])
def evaluate_windows():
    """Compare all algorithms across multiple training windows."""
    data = request.get_json()
    sales_data = data['sales_data']
    windows = data.get('windows', [3, 4, 5, 6, 7, 8])

    results = ModelEvaluator.compare_training_windows(sales_data, windows)
    return jsonify(results)


@app.route('/api/algorithms', methods=['GET'])
def list_algorithms():
    """Return list of available algorithm keys."""
    return jsonify({'algorithms': ALL_ALGORITHMS})


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
