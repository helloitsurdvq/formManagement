const jwt = require('jsonwebtoken');
const User = require("../models/user");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(403).send({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).send({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(403).send({ message: 'Invalid token.' });
  }
};

// const authMiddleware = async (req, res, next) => {
//   const { authorization } = req.headers;

//   if (!authorization) {
//     return res.status(403).json({ error: "Authorization token required" });
//   }

//   const token = authorization.split(" ")[1];
//   const JWT_SECRET = process.env.JWT_SECRET || "hello";

//   try {
//     const { _id } = jwt.verify(token, JWT_SECRET);

//     req.user = await User.findOne({ _id });
//     next();
//   } catch (error) {
//     console.log(error);
//     res.status(403).json({ error: "Request is not authorized" });
//   }
// };

module.exports = authMiddleware;