# Form management
Author: **Đinh Việt Quang**

## Features done

### Authentication
```txt
✅ POST     /api/users/login        Login
✅ POST    /api//users/logout       Logout
```
### Form management

```txt
✅ GET     /api/forms               Get all forms
✅ POST    /api/forms               Create a new form
✅ GET     /api/forms/:id           Get form details by id (including fields)
✅ PUT     /api/forms/:id           Update form information
✅ DELETE  /api/forms/:id           Delete a form
```

### Field management in a form

```txt
✅ POST    /api/forms/:id/fields        Add a field to a form
✅ PUT     /api/forms/:id/fields/:fid   Update a field
✅ DELETE  /api/forms/:id/fields/:fid   Delete a field
```

### Submission 

```txt
✅ GET     /api/forms/active        Get active forms sorted by display order
✅ POST    /api/forms/:id/submit    Submit a form
✅ GET     /api/submissions         View submitted forms
```

### Role-based access

- `admin worker`
  - login/logout
  - create, update, delete forms
  - create, update, delete form fields
  - view all forms
  - submit forms
  - view all submissions
- `worker`
  - login/logout
  - view active forms
  - submit forms
  - view only their own submissions

All the demonstration can be found in [assets](assets)

## Setup 
### Local setup 
1. Press the Fork button (top right the page) to save copy of this project on your account.
2. Clone this project to your local machine.

```shell
  git clone https://github.com/helloitsurdvq/formManagement.git
```
3. Intall dependencies for frontend and backend:
```shell
  cd frontend
  npm install
```
```shell
  cd backend
  npm install
```
4. Connect databse on MySQL with [db.sql](backend/db.sql) and [.env](backend/.env.example) file

### Containerization


## Usage
To run the local website, use the following command for both frontend and backend server:

```shell
  cd frontend
  npm run dev
```

```shell
  cd backend
  npm start
```
The application will be accessible at:

- Client: [http://localhost:8080/](http://localhost:8080/)
- Server: [http://localhost:3000/api/](http://localhost:3000/api/)

## Demonstration
All the demo images can be found in:
- API endpoint: [link](assets/API-endpoint/)
- Frontend: [link](assets/UI/)
- Unit test, Containerization: [link](assets/other/)