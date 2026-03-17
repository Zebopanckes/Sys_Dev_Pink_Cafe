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

### Quick Start (Recommended)

**Windows:**

- Double-click `start.bat` OR `start.ps1`, or run from command line:
  ```bash
  cd bristol-pink-dashboard
  .\start.bat
  ```

**Mac/Linux (with Make):**

```bash
cd bristol-pink-dashboard
make dev
```

Both servers will start in separate windows:

- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### Manual Start

#### Start the Backend Server

From the project root:

```bash
cd bristol-pink-dashboard/backend
python app.py
```

The backend API will run on `http://localhost:5000`

#### Start the Frontend Development Server

In a separate terminal, from the project root:

```bash
cd bristol-pink-dashboard
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## Available Make Commands

```bash
make dev       # Run both backend and frontend servers
make backend   # Run only the backend server
make frontend  # Run only the frontend server
make install   # Install all dependencies
make clean     # Clean build artifacts and caches
make help      # Show help message
```

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

### Authentication and Roles

The dashboard now requires login and supports role-based access:

- `manager / manager123` - full access
- `analyst / analyst123` - full model access
- `viewer / viewer123` - read-only dashboard and tables

Model prediction and evaluation endpoints require `manager` or `analyst` roles.

### Audit Logging

Backend API activity is logged to:

- `bristol-pink-dashboard/backend/logs/audit.log`

Each entry is written as a JSON line with timestamp, endpoint, request method, status, and contextual details.

## Project Structure

- `/src` - React TypeScript frontend components
- `/backend` - Python Flask API with ML models
- `/src/assets` - Sample CSV data files
