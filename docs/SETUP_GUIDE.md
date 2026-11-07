# JanSahay 2.0 – Setup & Run Guide

## 1. System Requirements
- **Java:** JDK 17 or higher (`java -version`)
- **Build Tool:** Apache Maven 3.8+ (`mvn -version`)
- **Database:** MySQL Server 8.0+ running on port 3306
- **Frontend Environment:** Node.js 18+ and npm (`node -v`)

---

## 2. Database Configuration

1. Ensure the MySQL service is active.
2. The database `jansahay_db` is created automatically on application start.
3. Database credentials can be configured via environment variables or in `server/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/jansahay_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=Aryan#123RN
```
*(You may override credentials using environment variables `DB_USERNAME` and `DB_PASSWORD`).*

---

## 3. Running the Project Locally

### Step 1: Start the Java Spring Boot Backend
Open a terminal in the project directory:
```bash
cd server
mvn spring-boot:run
```
*Or execute the packaged executable JAR:*
```bash
java -jar target/jansahay-backend-1.0.0.jar
```
> The backend server will initialize tables, seed verified scheme records, and listen on **`http://localhost:8080`**.

### Step 2: Start the React Frontend
Open a second terminal:
```bash
cd client
npm run dev
```
> The frontend will launch on **`http://localhost:5173`**. Vite will automatically proxy `/api` requests to `http://localhost:8080`.

---

## 4. One-Click Startup (Windows)
From the root folder, run:
```bat
run.bat
```
This launches both the Java Spring Boot backend and the React Vite client simultaneously in dedicated command windows.

---

## 5. Verified Demo Accounts
| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@jansahay.gov.in` | `Password@123` | Full admin dashboard, scheme & guide management |
| **Citizen (Student Profile)** | `student@jansahay.ai` | `Password@123` | Post-matric scholarship matching & checklist |
| **Citizen (Farmer Profile)** | `farmer@jansahay.ai` | `Password@123` | PM-KISAN, Namo Shetkari, PMFBY roadmaps |
| **Citizen (Business Profile)** | `business@jansahay.ai` | `Password@123` | Mudra loan & CMEGP subsidy tracking |
| **Citizen (Aryan Pawar)** | `aryanpawar03022006@gmail.com` | `Password@123` | Full citizen profile |
