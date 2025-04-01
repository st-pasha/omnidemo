#!/bin/bash

# Start backend
python3 -m omnidemo &

# Start frontend
cd /app/frontend/ && npm run start

# Keep the container running
wait
