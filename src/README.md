# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Student account sign up and sign in
- Sign up and unregister for activities as the signed-in student
- Restrict write actions to authenticated users

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                             | Description                                                         |
| ------ | ------------------------------------ | ------------------------------------------------------------------- |
| GET    | `/activities`                        | Get all activities with their details and current participant count |
| POST   | `/auth/signup`                       | Create a student account with name, grade, and email               |
| POST   | `/auth/login`                        | Sign in with an existing student email                              |
| GET    | `/auth/me`                           | Get currently signed in student profile using `X-Student-Email`    |
| POST   | `/activities/{activity_name}/signup` | Sign up signed-in student for an activity                           |
| DELETE | `/activities/{activity_name}/unregister` | Unregister signed-in student from an activity                    |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level
   - Email

All data is stored in memory, which means data will be reset when the server restarts.
