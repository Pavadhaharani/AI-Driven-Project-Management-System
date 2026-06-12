# ProjectMS — Smart Project Management System

## Quick Start
# AI-Driven Smart Project Management System

An intelligent full-stack project management platform built using React, Spring Boot, MongoDB, and Python-based AI modules. The system streamlines project planning, task management, milestone tracking, team collaboration, and project monitoring while providing AI-powered project insights, risk analysis, recommendations, and roadmap generation.

## Key Features

* Role-Based Access Control (Admin, HR, Project Manager, Employee)
* Project Creation & Management
* Task Assignment & Progress Tracking
* Milestone Planning
* Team Management
* Real-Time Dashboard Analytics
* AI-Powered Document Analysis
* Project Risk Assessment
* Automated Recommendations
* AI-Generated Project Roadmaps

## Technology Stack

### Frontend

* React.js
* JavaScript
* Tailwind CSS

### Backend

* Spring Boot
* Java
* REST APIs

### Database

* MongoDB

### AI & Analytics

* Python
* Machine Learning Libraries
* Document Processing Modules


### Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
Runs on http://localhost:8080

### Frontend (React)
```bash
cd frontend
npm install
npm start
```
Runs on http://localhost:3000

## Default Login Credentials (auto-seeded on first run)

| Department         | Username    | Password   | Role  |
|--------------------|-------------|------------|-------|
| HR                 | admin_hr    | Admin@123  | Admin |
| Project Dev        | admin_pd    | Admin@123  | Admin |
| Administration     | admin_adm   | Admin@123  | Admin |
| Cybersecurity      | admin_cs    | Admin@123  | Admin |

Each Admin can create Project Managers and Employees within their department.

## Fixes Applied
1. **AiInsightPage.js** — Fixed import path (`../../api/api` → `../api/api`)
2. **Dtos.java** — Removed `public` from `AuthRequest` class (Java file-name rule)
3. **pom.xml** — Added `maven-compiler-plugin` with Lombok annotation processor (fixes all `cannot find symbol` errors)
4. **AiInsightEngine.java** — Updated PDFBox 3.x API (`PDDocument.load()` → `Loader.loadPDF()`)

## Tech Stack
- **Backend**: Spring Boot 3.2, Spring Security (JWT), Hibernate, SQLite
- **Frontend**: React 18, React Router, Recharts, Axios, React Hot Toast
- **AI Engine**: Pure Java TF-IDF (no external API needed)
