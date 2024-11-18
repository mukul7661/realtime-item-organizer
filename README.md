# Run the app using following steps

 ```
git clone https://github.com/mukul7661/realtime-item-organizer
cd realtime-item-organizer

cd client
cp .env.example .env
npm install
npm run preview
# Client will be available on port 4173

# Open a new terminal
cd server
cp .env.example .env  # please edit DATABASE_URL 
npm install
npm run build
npm start
# Server will be available on port 3001

# Demo - 

# To run unit tests for server
cd server
npm test
```