# MindEase Frontend

MindEase is a Progressive Web Application (PWA) designed to promote better mental health through therapy appointment booking, mood tracking, and personalized wellness recommendations.

This repository contains the **frontend** codebase built with **React (Vite + TypeScript + Tailwind CSS)** that integrates with a **Django REST API backend**.

---

## Features

### Core Modules

- **Authentication**  
  Email/password login and registration using JWT tokens.

- **Role-based Access**  
  Separate dashboards for Users, Therapists, and Admins.

- **Mood Tracker**  
  Log daily moods and analyze emotional progress.

- **Therapist Directory & Booking**  
  Browse approved therapists, view availability, and schedule appointments.

- **Therapist Portal**  
  Manage sessions, view bookings, and record session notes.

- **Recommendations**  
  Receive personalized mindfulness suggestions based on mood trends.

- **Admin Dashboard**  
  Manage users, therapists, and system data.

---

## Frontend Highlights

- Progressive Web App (**PWA**) support  
- Centralized **Auth Context** for JWT handling  
- **Protected routes** with role-based permissions  
- Mobile-first UI using **Tailwind CSS**  
- Component library powered by **Shadcn/UI**  
- Clean and scalable folder architecture  

---

## Tech Stack

| Category         | Technology               |
| ---------------- | ------------------------ |
| Framework        | React (Vite)             |
| Language         | TypeScript               |
| Styling          | Tailwind + Shadcn/UI     |
| State Management | React Context API        |
| Charts           | Recharts                 |
| Forms            | React Hook Form          |
| Icons            | Lucide React             |
| UI Components    | Radix UI (via Shadcn/UI) |
| Notifications    | Sonner                   |
| Build Tool       | Vite                     |

---

## Running the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mindease-frontend.git
cd mindease-frontend
```

### 2. Install Dependencies

Using **npm**:

```console
npm install
```

### 3. Configure Environment Variables
Create a .env file in the root of the project with the following content:

```Ini, TOML

VITE_API_URL=http://localhost:8000/api
Modify the URL according to your backend configuration.
```

### 4. Start the Development Server
Run one of the following commands:

```Shell

npm run dev
```

### 5. Build for Production
To create a production build, run:

```Shell

npm run build
```

## Documentation
Full documentation is available at: https://riddhima-gkmit.github.io/mindease-documentation/