from flask import Flask, request, jsonify
from flask_cors import CORS
from models.predictor import SalesPredictor
from models.evaluator import ModelEvaluator

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


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
