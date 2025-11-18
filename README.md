# 📄 DocuTrackr

**DocuTrackr** is a web-based document tracking and request management system designed for the **Cebu Institute of Technology – University (CIT-U)**.  
It streamlines the process of requesting, processing, and tracking academic or administrative documents for students, alumni, and registrars — ensuring faster and more transparent transactions.

---

## ✨ Features

- 🎓 **Student Portal** – Submit requests, view request history, and track real-time document status.  
- 🧾 **Document Request Management** – Handles common requests like transcripts, certificates, and clearances.  
- 🧍‍♀️ **Registrar Dashboard** – Manage incoming student requests, update statuses, and mark documents as released.  
- 🔔 **Notifications System** – Sends automatic updates to students when their document status changes.  
- 💳 **Payment Tracking** – Logs and associates payment confirmations with document requests.  
- 🔐 **Secure Authentication** – Role-based login system for students and registrar staff.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Django (Python) |
| **Database** | Supabase (PostgreSQL) |
| **Version Control & Collaboration** | Git + GitHub |

---

## ⚙️ Setup & Run Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/oblivjules/CSIT327-G5-DocuTrackr.git
cd CSIT327-G5-DocuTrackr
```
### 2. Create a Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```
### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
### 4. Connect to the Database via Supabase
    1. Log in to your Supabase account.

    2. Open the DocuTrackr project → click 'Connect' at the top of the site → Scroll down to Session pooler 

    3. Copy the PostgreSQL connection string (it looks like this):
    postgresql://postgres:[YOUR_PASSWORD]@db.[your-supabase-id].supabase.co:6543/postgres

    4. Create a file named .env in the project root (same folder as manage.py).

    5. Paste the following inside your .env file:
    DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[your-supabase-id].supabase.co:6543/postgres

    6. Save the file.
    ⚠️ Important: Do not commit .env to GitHub.

### 5. Apply Database Migrations
Once your Supabase .env is set up, run the following commands to sync Django models with the remote database:
```bash
python manage.py makemigrations
python manage.py migrate
```
### 6. Activate your virtual environment
```bash
venv\Scripts\activate
```
### 7. Install additional dependencies if you haven't done yet
```bash
pip install django psycopg2-binary
```
### 8. Run the Development Server
Once migrations are done, start your local Django server:
```bash
python manage.py runserver
```
Then open this link in your browser:
```bash
http://127.0.0.1:8000/
```

## 👨‍💻👩‍💻 Team Members

| **Name** | **Role** | **Email**
|----------------------|--------------------|---------------------|
| Julianne Rose Aquino | Backend Developer / Lead Developer | juliannerose.aquino@cit.edu
| Karylle Amad | Frontend Developer / UI/UX Designer | karylle.amad@cit.edu
| Joshua Phillip Ang | Frontend Developer / UI/UX Designer | joshuaphillip.ang@cit.edu

## 🚀 Deployment Link

🔗 **Live Website**:
https://csit327-g5-docutrackr.onrender.com











