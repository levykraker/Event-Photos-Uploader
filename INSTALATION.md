# Installation Instructions

## Prerequisites

Before starting the application, make sure you have **Node.js** and **npm** installed on your machine.

The project consists of two parts:

- **Frontend** — Vite + React
- **Backend** — Express.js

## 1. Frontend Setup

After clone this repo navigate to the frontend directory:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm install
```

Before starting the frontend, create a `.env` file based on the provided `.env.example` file.

The following variables need to be configured:

```env
VITE_ZIP_NAME=
VITE_EVENT_NAME=" "
```

All variables are described in detail in the `.env.example` file. Make sure to provide the appropriate values before starting the application.

Once the environment variables are configured, start the development server:

```bash
npm run dev
```

The frontend will then be available at the URL displayed in the terminal.

## 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install the required dependencies:

```bash
npm install
```

Before starting the backend, create a `.env` file based on the provided `.env.example` file.

The following variables need to be configured:

```env
NAME_OF_EVENT=""
DATA_PATH=""
```

All variables are described in detail in the `.env.example` file. Make sure to provide the appropriate values before starting the backend.

Once the environment variables are configured, start the backend:

```bash
npm run start
```

## 3. Running the Application

Both the frontend and backend need to be running for the application to work correctly.

Open two separate terminal windows:

**Terminal 1 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

**Terminal 2 — Backend**

```bash
cd backend
npm install
npm run start
```

Make sure that the `.env` files in both the frontend and backend directories are correctly configured before starting the application. The `.env.example` files contain descriptions of all required environment variables.
