require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');
const expenseRoutes = require('./routes/expenseRoutes');
const offeringRoutes = require('./routes/offeringRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const reimbursementRoutes = require('./routes/reimbursementRoutes');
const donationRoutes = require('./routes/donationRoutes');
const donorRoutes = require('./routes/donorRoutes');
const pastorGiftRoutes = require('./routes/pastorGiftRoutes');
const { sequelize } = require('./models');
const { ensureAuthenticated } = require('./middleware/authMiddleware');
const { createAdminUser } = require('./utils/createAdmin');

const app = express();

// Trust proxy for proper IP detection behind load balancers/proxies
app.set('trust proxy', 1);

// Production-grade middleware
app.use(helmet());
app.use(compression());
app.use(cors());

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

app.use('/auth', authRoutes);
app.use('/api/expenses', ensureAuthenticated, expenseRoutes);
app.use('/api/offerings', ensureAuthenticated, offeringRoutes);
app.use('/api/reports', ensureAuthenticated, reportRoutes);
app.use('/api/reimbursements', ensureAuthenticated, reimbursementRoutes);
app.use('/api/donations', ensureAuthenticated, donationRoutes);
app.use('/api/donors', ensureAuthenticated, donorRoutes);
app.use('/api/pastor-gifts', pastorGiftRoutes);

app.get('/', (req, res) => {
  res.send('Atlanta Little Flock Church Portal Backend Running');
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server and sync database
const PORT = process.env.PORT || 4000;

// Initialize database
console.log('Initializing database...');
sequelize.sync({ force: false }).then(() => {
  console.log('Database synchronized successfully');
  
  return createAdminUser();
}).then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log('=== ATLANTA LITTLE FLOCK CHURCH ADMIN CREDENTIALS ===');
    console.log('Email: admin@church.org');
    console.log('Password: ChurchAdmin2025!');
    console.log('======================================');
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  // Try to start server anyway
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT} (with errors)`);
  });
});
