# ProjectMS — Smart Project Management System

## Quick Start

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
