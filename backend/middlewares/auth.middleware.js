const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'form-management-secret';

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(401).send({ message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
