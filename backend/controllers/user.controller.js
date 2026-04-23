const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config');

const jwtSecret = process.env.JWT_SECRET || 'form-management-secret';

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
};

const isMatch = async (select, savePwd) => {
  if (!savePwd) return false;
  if (savePwd.startsWith('$2a$') || savePwd.startsWith('$2b$')) return bcrypt.compare(select, savePwd);
  return select === savePwd;
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'email and password are required' });

  try {
    const accounts = await query('select * from accounts where email = ? limit 1', [email]);
    if (accounts.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const account = accounts[0];
    const passwordMatches = await isMatch(password, account.password);

    if (!passwordMatches) 
      return res.status(401).json({ message: 'Invalid email or password' });
    const user = {
      id: account.id,
      email: account.email,
      type_of_account: account.type_of_account,
      role: account.type_of_account,
    };

    const token = jwt.sign(user, jwtSecret, { expiresIn: '1d' });
    res.status(200).json({
      message: 'Login successfully',
      data: { user, token, },
    });
  } catch (error) {
    res.status(500).json({ message: 'Cannot login', error: error.message });
  }
};

const logout = (req, res) => {
  res.status(200).json({
    message: 'Logout successfully',
  });
};

module.exports = { login, logout };