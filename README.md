# Full Stack Vite/React Architecture

This project is structured into a classic decoupled architecture with a frontend and backend separating concerns completely. This makes it easier to scale, deploy, and maintain.

## Folder Structure

```
/
├── frontend/       # Vite + React Application
└── backend/        # Node.js + Express Application
```

### 1. Frontend (`/frontend`)
The frontend is built using **React** and bundled with **Vite** for blazing fast compilation and hot-module replacement.

**Key Technologies:**
- **React**: UI library.
- **Vite**: Build tool and dev server.
- **React Router**: For client-side routing (`react-router-dom`).
- **Zustand**: For lightweight global state management.
- **Axios**: For making HTTP requests to the backend API.
- **Lucide React**: For SVG icons.

**How to run locally:**
```bash
cd frontend
npm install
npm run dev
```

### 2. Backend (`/backend`)
The backend is a lightweight REST API built with **Node.js** and **Express**.

**Key Technologies:**
- **Express**: Web framework for Node.js.
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB. (Not strictly enforced if you prefer to swap out the DB).
- **Cors**: Middleware to allow cross-origin requests from the React frontend.
- **Dotenv**: For managing environment variables (like Database URIs).

**How to run locally:**
```bash
cd backend
npm install
node server.js
```

## How they connect

1. The frontend runs typically on `http://localhost:5173` during development.
2. The backend runs on `http://localhost:5000` (or whatever port you define in `backend/server.js`).
3. The frontend makes HTTP requests to the backend via `axios`. For example, fetching data from `http://localhost:5000/api/data`.

## How to recreate this setup manually

If you ever need to set this up from scratch again:

1. **Create the project folder**: `mkdir my-app && cd my-app`
2. **Setup Frontend**: 
   - `npx create-vite@latest frontend --template react`
   - `cd frontend && npm install`
   - Install extras: `npm install react-router-dom axios zustand lucide-react`
3. **Setup Backend**:
   - `mkdir backend && cd backend`
   - `npm init -y`
   - Install dependencies: `npm install express cors dotenv mongoose`
   - Create a `server.js` file for your entry point.
