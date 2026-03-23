const express = require('express');
const cors = require('cors');

const app = express();
// We use port 5000 or whatever port your environment provides
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows your server to read JSON data sent from the frontend

// A simple test route
app.get('/', (req, res) => {
    res.send('Smart Course Companion Server is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});