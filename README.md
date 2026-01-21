# LeXIDesk Workbench

LeXIDesk is a comprehensive legal text analysis platform that combines advanced NLP models with a modern web interface. It features:

- **CNN-CRF Models** for accurate sentence boundary detection in legal documents
- **Hybrid Extractive-Abstractive Summarization** using TextRank, TF-IDF, and position-based scoring
- **RAG-based Chatbot** for intelligent document question-answering using FAISS vector store
- **React + TypeScript Frontend** with modern UI components
- **FastAPI Backend** for high-performance ML inference

---

## � Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Frontend Setup](#frontend-setup)
4. [Backend Setup](#backend-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Project Structure](#project-structure)
8. [API Documentation](#api-documentation)
9. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.9, 3.10, or 3.11) - [Download here](https://www.python.org/downloads/)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Google Gemini API Key** - [Get one here](https://makersuite.google.com/app/apikey)

---

## 🚀 Getting Started

### Step 1: Fork and Clone the Repository

1. **Fork this repository** to your GitHub account by clicking the "Fork" button at the top right of this page.

2. **Clone your forked repository** to your local machine:

```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/lexidesk-workbench.git

# Navigate to the project directory
cd lexidesk-workbench
```

---

## 🎨 Frontend Setup

The frontend is built with **Vite + React + TypeScript** and uses **shadcn/ui** components.

### Step 1: Install Dependencies

```bash
# Install all Node.js dependencies
npm install
```

This will install all the required packages including:
- React 18.3+
- TypeScript
- Vite
- shadcn/ui components (Radix UI)
- TailwindCSS
- React Router
- TanStack Query
- And many more...

### Step 2: Verify Installation

```bash
# Check that the installation was successful
npm list --depth=0
```

---

## 🐍 Backend Setup

The backend is built with **FastAPI** and includes multiple ML models for legal text processing.

### Step 1: Create a Virtual Environment

Creating a virtual environment isolates your Python dependencies from your system Python installation.

#### **Windows (PowerShell)**

```powershell
# Navigate to the project root directory
cd lexidesk-workbench

# Create a virtual environment
python -m venv backend/venv

# Activate the virtual environment
.\backend\venv\Scripts\Activate

# You should see (venv) prefix in your terminal
```

#### **macOS / Linux**

```bash
# Navigate to the project root directory
cd lexidesk-workbench

# Create a virtual environment
python3 -m venv backend/venv

# Activate the virtual environment
source backend/venv/bin/activate

# You should see (venv) prefix in your terminal
```

### Step 2: Install Python Dependencies

With your virtual environment activated, install all required Python packages:

```bash
# Ensure pip is up to date
pip install --upgrade pip

# Install all dependencies from requirements.txt
pip install -r backend/requirements.txt
```

This will install:
- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **PyTorch** - Deep learning framework
- **scikit-learn** - ML utilities
- **sklearn-crfsuite** - CRF models
- **sentence-transformers** - Sentence embeddings
- **FAISS** - Vector similarity search
- **PyMuPDF** - PDF processing
- **Google Generative AI** - Gemini API client
- **NetworkX** - Graph algorithms for TextRank
- **NLTK** - Natural language processing
- **Transformers** - Hugging Face transformers
- And more...

### Step 3: Download NLTK Data

Some NLP features require NLTK data:

```python
# Run this in a Python shell or create a script
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

---

## 🔐 Environment Configuration

The backend requires a Google Gemini API key for the chatbot functionality.

### Step 1: Create .env File

Create a `.env` file in the `backend/` directory:

#### **Windows (PowerShell)**

```powershell
# Navigate to backend directory
cd backend

# Create .env file
New-Item -Path .env -ItemType File

# Open in notepad
notepad .env
```

#### **macOS / Linux**

```bash
# Navigate to backend directory
cd backend

# Create .env file
touch .env

# Open in your preferred editor
nano .env
# or
vim .env
```

### Step 2: Add Your API Key

Add the following content to your `.env` file:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** Replace `your_actual_api_key_here` with your actual Google Gemini API key.

### Step 3: Secure Your API Key

**⚠️ Security Warning:** Never commit your `.env` file to Git! The `.gitignore` file is already configured to exclude it.

---

## ▶️ Running the Application

You need to run both the frontend and backend servers simultaneously.

### Option 1: Run Separately (Recommended for Development)

#### **Terminal 1 - Frontend**

```bash
# From the project root directory
npm run dev
```

The frontend will start at: **http://localhost:5173**

#### **Terminal 2 - Backend**

**Windows (PowerShell):**

```powershell
# Activate virtual environment
.\backend\venv\Scripts\Activate

# Start backend server
python -m uvicorn backend.main:app --reload --port 8000
```

**macOS / Linux:**

```bash
# Activate virtual environment
source backend/venv/bin/activate

# Start backend server
uvicorn backend.main:app --reload --port 8000
```

The backend will start at: **http://localhost:8000**

### Option 2: Use Helper Script (Windows Only)

If you're on Windows, you can use the npm script to run the backend:

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run backend
```

---

## �️ Project Structure

```
lexidesk-workbench/
│
├── backend/                          # Python Backend
│   ├── .env                          # Environment variables (create this!)
│   ├── main.py                       # FastAPI application entry point
│   ├── predict.py                    # CNN-CRF prediction logic
│   ├── requirements.txt              # Python dependencies
│   │
│   ├── src/                          # Core ML models
│   │   ├── cnn_model.py              # CNN architecture
│   │   ├── crf_model.py              # CRF model
│   │   ├── feature_extractor.py     # Feature extraction
│   │   ├── summarizer.py             # Extractive summarization
│   │   └── process_data.py           # Data preprocessing
│   │
│   ├── models/                       # Trained model checkpoints
│   │   ├── cnn_model.pth             # CNN weights
│   │   └── crf_model.pkl             # CRF weights
│   │
│   ├── lexidesk_chatbot/             # RAG Chatbot module
│   │   ├── api/                      # FastAPI routes
│   │   │   └── router.py             # Chatbot endpoints
│   │   ├── embeddings/               # Vector embeddings
│   │   │   └── indexer.py            # FAISS index builder
│   │   ├── ingest/                   # Document ingestion
│   │   │   └── ingest.py             # PDF processing
│   │   ├── retrieval/                # RAG retrieval
│   │   │   └── retriever.py          # Context retrieval
│   │   └── data/                     # Processed documents
│   │
│   ├── data/                         # Training data
│   ├── uploads/                      # Uploaded PDFs
│   └── venv/                         # Virtual environment (create this!)
│
├── src/                              # React Frontend
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # shadcn/ui components
│   │   └── ...                       # Custom components
│   │
│   ├── pages/                        # Application pages
│   │   ├── Landing.tsx               # Landing page
│   │   ├── SentenceDetection.tsx    # Sentence boundary detection
│   │   ├── Summarization.tsx        # Document summarization
│   │   └── Chatbot.tsx               # RAG chatbot interface
│   │
│   ├── lib/                          # Utilities
│   │   ├── api.ts                    # Backend API client
│   │   └── utils.ts                  # Helper functions
│   │
│   └── App.tsx                       # Main app component
│
├── public/                           # Static assets
├── package.json                      # Node.js dependencies
├── vite.config.ts                    # Vite configuration
├── tailwind.config.ts                # TailwindCSS configuration
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file!
```

---

## 📚 API Documentation

Once the backend is running, you can access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | System status |
| `/predict` | POST | Sentence boundary detection |
| `/summarize` | POST | Document summarization |
| `/upload` | POST | PDF upload & ingestion |
| `/chat/qa` | POST | RAG-based question answering |

---

## 🔧 Troubleshooting

### Frontend Issues

**Issue: Port 5173 already in use**
```bash
# Kill the process using port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3000
```

**Issue: Module not found errors**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues

**Issue: Port 8000 already in use**
```bash
# Use a different port
uvicorn backend.main:app --reload --port 8001
```

**Issue: ModuleNotFoundError**
```bash
# Ensure virtual environment is activated
# Reinstall dependencies
pip install -r backend/requirements.txt
```

**Issue: GEMINI_API_KEY not found**
```bash
# Verify .env file exists in backend/ directory
# Verify it contains: GEMINI_API_KEY=your_key_here
```

**Issue: PyTorch installation fails**
```bash
# For CPU-only PyTorch (smaller download)
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

**Issue: FAISS installation fails on Windows**
```bash
# Use faiss-cpu instead of faiss-gpu
pip install faiss-cpu
```

### Model Issues

**Issue: Models not found**
- Ensure the `backend/models/` directory contains `cnn_model.pth` and `crf_model.pkl`
- If missing, you may need to train the models or download pre-trained weights

**Issue: NLTK data not found**
```python
# Download required NLTK data
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Vector search by [FAISS](https://github.com/facebookresearch/faiss)

---

## 📧 Support

If you encounter any issues or have questions, please:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [API Documentation](#api-documentation)
3. Open an issue on GitHub

**Happy analyzing! 📊⚖️**
