const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Check if the frontend sent an Authorization header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    
    // We need to split the string and grab just the token part (index 1)
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access Denied. Invalid token format.' });
    }

    try {
        // use secret key
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        req.user = verified;

        
        next();

    } catch (error) {
        
        // 401 error auth failed
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = verifyToken;