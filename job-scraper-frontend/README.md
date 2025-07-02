# Job Scraper Frontend

This is a modern and responsive frontend for the Job Scraper application, built with React and Vite. It provides a user-friendly interface to interact with the job scraper backend, allowing users to search for jobs from various websites, filter them by keywords, and view the results in a clean and organized manner.

This project was refactored to use a modern, component-based architecture with custom hooks for state management and a dedicated API service layer for maintainability and scalability.

## Features

-   **Dynamic Site Loading:** Automatically fetches the list of supported job sites from the backend API.
-   **Keyword Filtering:** Allows users to filter job results with a custom keyword.
-   **Rich Data Display:** Shows key statistics (total jobs, unique companies, relevant jobs) and a detailed list of job postings.
-   **User-Friendly Interface:** Includes clear loading and error states to keep the user informed.
-   **Responsive Design:** The UI is designed to work well on various screen sizes.
-   **Clean Architecture:** Follows best practices with a clear separation of concerns (UI, state management, API calls).

## Tech Stack

-   **React:** For building the user interface.
-   **Vite:** As the build tool and development server.
-   **JavaScript (ES6+):** The core programming language.
-   **CSS:** For custom styling of the components.
-   **Fetch API:** For making requests to the backend.

## Prerequisites

-   Node.js (v18.x or higher is recommended)
-   `npm` or `yarn`
-   The **Job Scraper Backend** must be running. This frontend is designed to communicate with it on `http://127.0.0.1:5000`.

## Setup and Installation

1.  **Clone the repository** (if you haven't already).

2.  **Navigate to the project directory:**
    ```bash
    cd job-scraper-frontend
    ```

3.  **Install the dependencies:**
    ```bash
    # Using npm
    npm install

    # Or using yarn
    yarn install
    ```

## Running the Application

Once the dependencies are installed and the backend server is running, you can start the frontend development server:

```bash
# Using npm
npm run dev

# Or using yarn
yarn dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

## Project Structure

The `src` directory is organized to separate concerns, making the project easier to manage:

```
src/
├── services/
│   └── api.js          # Handles all communication with the backend API.
├── hooks/
│   └── useJobScraper.js  # A custom hook managing all state and business logic.
├── components/
│   ├── Header.jsx        # The main header of the application.
│   ├── SearchForm.jsx    # The form for site selection and keyword input.
│   ├── JobResults.jsx    # Container for displaying results, loading, or errors.
│   ├── JobStats.jsx      # Displays statistics about the scraped jobs.
│   ├── JobList.jsx       # Renders the list of job cards.
│   └── JobCard.jsx       # Displays a single job posting.
├── assets/
│   └── react.svg         # Example asset.
├── App.jsx               # The main application component that assembles all other components.
├── App.css               # Global styles for the application.
├── main.jsx              # The entry point of the React application.
└── index.css             # Root CSS file.
```
