# Quick Start Guide

This is a condensed setup guide for developers who want to get up and running quickly.

## Prerequisites
- Node.js 18+
- Python 3.9-3.11
- Git
- Google Gemini API Key

## Setup Steps

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/lexidesk-workbench.git
cd lexidesk-workbench

# Install frontend dependencies
npm install

# Create Python virtual environment
python -m venv backend/venv

# Activate virtual environment
# Windows:
.\backend\venv\Scripts\Activate
# macOS/Linux:
source backend/venv/bin/activate

# Install backend dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt

# Download NLTK data
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### 2. Configure Environment

```bash
# Create .env file in backend directory
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Run Application

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
# Windows:
.\backend\venv\Scripts\Activate && python -m uvicorn backend.main:app --reload --port 8000

# macOS/Linux:
source backend/venv/bin/activate && uvicorn backend.main:app --reload --port 8000
```

### 4. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Common Issues

**PyTorch installation slow?**
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

**FAISS fails on Windows?**
```bash
pip install faiss-cpu
```

**Port already in use?**
```bash
# Use different ports
npm run dev -- --port 3000
uvicorn backend.main:app --reload --port 8001
```

For detailed instructions, see [README.md](../README.md).
