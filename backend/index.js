require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const formRoutes = require('./routes/form.route');
const submitRoutes = require('./routes/submit.route');
const userRoutes = require('./routes/user.route');

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined')); 
}

app.use('/api', submitRoutes);
app.use('/api/users', userRoutes);
app.use('/api/forms', formRoutes);

const port = 3000;
app.listen(port, () => {
   console.log(`Server listening on port ${port}`);
});
