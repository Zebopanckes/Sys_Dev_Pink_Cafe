from flask import Flask, request, jsonify
from flask_cors import CORS
from models.predictor import SalesPredictor
from models.evaluator import ModelEvaluator
from models import ALL_ALGORITHMS
from security import (
    USERS,
    create_session,
    delete_session,
    get_session_from_request,
    require_auth,
    validate_sales_data,
    write_audit_event,
)

app = Flask(__name__)
CORS(app)


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()

    user = USERS.get(username)
    if user is None or user['password'] != password:
        write_audit_event('login', 'failed', {'username': username})
        return jsonify({'error': 'Invalid username or password'}), 401

    token, profile = create_session(username)
    write_audit_event('login', 'success', {'username': username, 'role': profile['role']})
    return jsonify({'token': token, 'user': profile})


@app.route('/api/auth/logout', methods=['POST'])
@require_auth()
def logout():
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '', 1).strip()
    delete_session(token)
    write_audit_event('logout', 'success', {'username': request.user['username']})
    return jsonify({'status': 'ok'})


@app.route('/api/auth/me', methods=['GET'])
@require_auth()
def me():
    write_audit_event('auth_me', 'success', {'username': request.user['username'], 'role': request.user['role']})
    return jsonify({'user': request.user})


@app.route('/api/predict', methods=['POST'])
@require_auth(['manager', 'analyst'])
def predict():
    try:
        data = request.get_json(silent=True) or {}
        sales_data = data.get('sales_data')
        training_weeks = int(data.get('training_weeks', 4))
        algorithm = data.get('algorithm', 'linear_regression')

        ok, msg = validate_sales_data(sales_data)
        if not ok:
            write_audit_event('predict', 'failed', {'reason': msg, 'user': request.user['username']})
            return jsonify({'error': msg}), 400
        if algorithm not in ALL_ALGORITHMS:
            return jsonify({'error': f'Unsupported algorithm: {algorithm}'}), 400
        if training_weeks < 4 or training_weeks > 8:
            return jsonify({'error': 'training_weeks must be between 4 and 8'}), 400

        predictor = SalesPredictor(algorithm=algorithm)
        predictions = predictor.predict(sales_data, training_weeks, forecast_weeks=4)
        write_audit_event(
            'predict',
            'success',
            {
                'user': request.user['username'],
                'role': request.user['role'],
                'algorithm': algorithm,
                'training_weeks': training_weeks,
                'rows': len(sales_data),
            },
        )
        return jsonify({'predictions': predictions})
    except Exception as ex:
        write_audit_event('predict', 'failed', {'error': str(ex)})
        return jsonify({'error': 'Prediction request failed'}), 500


@app.route('/api/evaluate', methods=['POST'])
@require_auth(['manager', 'analyst'])
def evaluate():
    try:
        data = request.get_json(silent=True) or {}
        sales_data = data.get('sales_data')
        training_weeks = int(data.get('training_weeks', 4))
        algorithm = data.get('algorithm', 'linear_regression')

        ok, msg = validate_sales_data(sales_data)
        if not ok:
            write_audit_event('evaluate', 'failed', {'reason': msg, 'user': request.user['username']})
            return jsonify({'error': msg}), 400
        if algorithm not in ALL_ALGORITHMS:
            return jsonify({'error': f'Unsupported algorithm: {algorithm}'}), 400

        evaluator = ModelEvaluator(algorithm=algorithm)
        metrics = evaluator.evaluate(sales_data, training_weeks)
        write_audit_event(
            'evaluate',
            'success',
            {
                'user': request.user['username'],
                'role': request.user['role'],
                'algorithm': algorithm,
                'training_weeks': training_weeks,
            },
        )
        return jsonify(metrics)
    except Exception as ex:
        write_audit_event('evaluate', 'failed', {'error': str(ex)})
        return jsonify({'error': 'Evaluation request failed'}), 500


@app.route('/api/evaluate/compare', methods=['POST'])
@require_auth(['manager', 'analyst'])
def evaluate_compare():
    """Compare all algorithms at a single training window."""
    try:
        data = request.get_json(silent=True) or {}
        sales_data = data.get('sales_data')
        training_weeks = int(data.get('training_weeks', 4))
        ok, msg = validate_sales_data(sales_data)
        if not ok:
            return jsonify({'error': msg}), 400
        results = ModelEvaluator.compare_all(sales_data, training_weeks)
        write_audit_event('evaluate_compare', 'success', {'user': request.user['username'], 'training_weeks': training_weeks})
        return jsonify({'results': results})
    except Exception as ex:
        write_audit_event('evaluate_compare', 'failed', {'error': str(ex)})
        return jsonify({'error': 'Comparison request failed'}), 500


@app.route('/api/evaluate/windows', methods=['POST'])
@require_auth(['manager', 'analyst'])
def evaluate_windows():
    """Compare all algorithms across multiple training windows."""
    try:
        data = request.get_json(silent=True) or {}
        sales_data = data.get('sales_data')
        windows = data.get('windows', [3, 4, 5, 6, 7, 8])
        ok, msg = validate_sales_data(sales_data)
        if not ok:
            return jsonify({'error': msg}), 400

        results = ModelEvaluator.compare_training_windows(sales_data, windows)
        write_audit_event('evaluate_windows', 'success', {'user': request.user['username'], 'windows': windows})
        return jsonify(results)
    except Exception as ex:
        write_audit_event('evaluate_windows', 'failed', {'error': str(ex)})
        return jsonify({'error': 'Window comparison request failed'}), 500


@app.route('/api/algorithms', methods=['GET'])
@require_auth()
def list_algorithms():
    """Return list of available algorithm keys."""
    write_audit_event('list_algorithms', 'success', {'user': request.user['username']})
    return jsonify({'algorithms': ALL_ALGORITHMS})


@app.route('/api/health', methods=['GET'])
def health():
    session = get_session_from_request()
    return jsonify({'status': 'ok', 'authenticated': session is not None})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
