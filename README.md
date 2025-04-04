# omnidemo

View at https://omnidemo-frontend.fly.dev/

## Local setup

1. Build with
   ```bash
   docker-compose up --build
   ```
2. Then visit http://localhost:3000/

The system is configured for ports 3000 and 8000, make sure there are no
other processes listening on these ports.

## Development setup

1. Install Python 3.12+ and create and activate a virtual environment
2. Go into the `backend/` directory and run `poetry install`
3. After that, run `python omnidemo` to start a server on localhost:8000.
4. Install `node` version 22+ and `npm`
5. Go into the `frontend/` directory and run `npm install`
6. Run `npm run dev` to start a frontend server on localhost:5173.
7. Visit http://localhost:5173 to interact with the app.
