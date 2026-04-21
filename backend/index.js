const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const formRoutes = require('./routes/form.route');

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined')); 
}

app.use('/api/forms', formRoutes);

app.get('/', (req, res) => {
   res.send('Hello from Node.js server!');
});
const port = 3000;
app.listen(port, () => {
   console.log(`Server listening on port ${port}`);
});