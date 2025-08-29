<div align="center">
  <img src="public/logo.png" alt="FitTrack Logo" width="120" height="120">
  <h1>FitTrack</h1>
  <h3><em>A modern fitness coaching platform with a comprehensive exercise database.</em></h3>
</div>

---

## About The Project

FitTrack is a comprehensive, full-stack fitness coaching application designed to help users create workout plans, track their progress, and access a vast database of exercises. Each exercise comes with detailed instructions and video demonstrations to ensure proper form and execution.

This platform provides a seamless and intuitive user experience for managing personal fitness goals.

---

## Key Features

-   **Workout Planning:** Easily create, customize, and save workout routines.
-   **Progress Tracking:** Monitor your performance and track your fitness journey over time.
-   **Extensive Exercise Database:** Access a large collection of exercises with detailed video guides and instructions.
-   **User Authentication:** Secure user registration and login functionality.
-   **Responsive Design:** A fully responsive interface that works on both desktop and mobile devices.

---

## Built With

This project is built with a modern, robust, and scalable tech stack:

-   **[Next.js](https://nextjs.org/)** - React Framework for Production
-   **[React](https://reactjs.org/)** - A JavaScript library for building user interfaces
-   **[TypeScript](https://www.typescriptlang.org/)** - Typed Superset of JavaScript
-   **[Prisma](https://www.prisma.io/)** - Next-generation Node.js and TypeScript ORM
-   **[PostgreSQL](https://www.postgresql.org/)** - A powerful, open-source object-relational database system
-   **[pnpm](https://pnpm.io/)** - Fast, disk space-efficient package manager
-   **[Docker](https://www.docker.com/)** - Containerization Platform

---

## Project Architecture

This project follows **Feature-Sliced Design (FSD)** principles with the Next.js App Router to ensure a scalable and maintainable codebase.

src/

├── app/ # Next.js pages, routes, and layouts

├── processes/ # Business flows that involve multiple features

├── widgets/ # Composite UI components with business logic (e.g., Sidebar, Header)

├── features/ # Business-level features (e.g., authentication, exercise management)

├── entities/ # Core business entities (e.g., User, Exercise, Workout)

├── shared/ # Shared libraries, UI components, and configuration

└── styles/ # Global CSS and themes



This structured design promotes clear domain isolation and reusability across the application.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed on your machine:
-   Node.js (v18+)
-   pnpm (v8+)
-   Docker

### Installation

1.  **Clone the repository**
    ```
    git clone https://github.com/sdiv0503/FitTrack.git
    cd FitTrack
    ```

2.  **Docker Installation (Recommended)**
    -   Copy the example environment variables file:
        ```
        cp .env.example .env
        ```
    -   Start all services using the provided Makefile:
        ```
        make dev
        ```
    This command will start the database in a Docker container, run migrations, seed the database with sample data, and launch the Next.js development server.

3.  **Access the application**
    Open your browser and navigate to `http://localhost:3000`.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

