# Bristol Pink Cafe Dashboard

A sales analytics dashboard for Bristol Pink Cafe with predictive modeling capabilities.

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or yarn

## Installation

### Frontend Setup

```bash
cd bristol-pink-dashboard
npm install
```

### Backend Setup

```bash
cd bristol-pink-dashboard/backend
pip install -r requirements.txt
```

## Running the Application

### Start the Backend Server

From the project root:

```bash
cd bristol-pink-dashboard/backend
python app.py
```

The backend API will run on `http://localhost:5000`

### Start the Frontend Development Server

In a separate terminal, from the project root:

```bash
cd bristol-pink-dashboard
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## Troubleshooting

### Windows PowerShell: "running scripts is disabled"

If you encounter this error when running npm commands on Windows:

**Option 1: Use Command Prompt (CMD) instead of PowerShell**
- Open Command Prompt and run your npm commands there

**Option 2: Change PowerShell Execution Policy (Recommended)**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Option 3: Bypass for single command**
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

## Usage

Open your browser and navigate to the frontend URL. You can:
- Upload sales data CSV files
- View sales charts and analytics
- Train prediction models
- Generate sales forecasts

## Project Structure

- `/src` - React TypeScript frontend components
- `/backend` - Python Flask API with ML models
- `/src/assets` - Sample CSV data files
