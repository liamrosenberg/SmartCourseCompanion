const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Check if the frontend sent an Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    // Tokens usually arrive looking like this: "Bearer eyJhbGciOiJIUzI1..."
    // We need to split the string and grab just the token part (index 1)
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access Denied. Invalid token format.' });
    }

    try {
        // 2. Use your secret key to verify the wristband is real and hasn't expired
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach the decoded user information (like their ID) to the request
        req.user = verified;
        
        // 4. The magic word: move on to the actual route!
        next();
        
    } catch (error) {
        // If the token is fake, expired, or tampered with, kick them out
        // 401 is the correct HTTP status for auth failure — AUTH.fetch watches for this
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = verifyToken;