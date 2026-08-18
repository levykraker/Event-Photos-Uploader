# Installation Instructions

## Prerequisites

Before starting the application, make sure you have **Node.js** and **npm** installed on your machine.
Also FFmpeg and libheif-dev need to be installed on your server/machine (If you not using Docker).

The project consists of two parts:

- **Frontend** — Vite + React
- **Backend** — Express.js

## 0. Docker setup 

If you want to use docker please setup necessary .env:
in ./frontend/.env 

``` bash
VITE_ZIP_NAME=wedding -> name of zip file when someone will download photos
VITE_EVENT_NAME=" My Birthday" -> Name of event - will be added as title on page. 
``` 
in ./backend/.env 
``` bash
NAME_OF_EVENT="birthday" -> example of event - should be without spaces
DATA_PATH="/mnt/" -> place where 
``` 

in main directory ./.env 
``` bash
BACKEND_DIR="./backend/" -> backend directory NO CHANGED!
FRONT_DIR="./frontend" -> frontend directory NO CHANGED!
WEB_PORT="80" -> Front port 
API_PORT="3000" -> PAI port 
DATA_DIR="./DATA" -> Where data will be stored
``` 
After setup .env please run docker-compose from main directory:
```bash
docker compose up
```

REMEMBER to add correct permission for DATA_DIR.
You should skip other steps of installation. 

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
VITE_API_URL= 
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
