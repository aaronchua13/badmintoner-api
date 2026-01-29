#!/bin/bash
curl -X POST http://localhost:3000/courts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Metro Sports Lahug",
    "location": "Metro Sports Centre, Salinas Drive, Cebu City, 6000 Central Visayas, Philippines",
    "latitude": 10.32753435,
    "longitude": 123.90326553448779
}'
