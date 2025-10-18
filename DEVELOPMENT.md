# Development Guide

This guide covers local development setup, coding standards, and contribution guidelines for the Church Portal project.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 20+ (LTS recommended)
- **npm**: Version 10+ (comes with Node.js)
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions
- **Docker**: Optional, for containerized development
- **Azure CLI**: For cloud development and testing

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker",
    "ms-vscode.azure-account",
    "ms-azuretools.vscode-azurefunctions"
  ]
}
```

### Project Structure

```
church-portal/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # Database models (Sequelize)
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── tests/              # Backend tests
│   ├── Dockerfile          # Backend container config
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   └── theme/          # Material-UI theming
│   ├── public/             # Static assets
│   ├── Dockerfile          # Frontend container config
│   └── package.json
├── infra/                  # Azure infrastructure (Bicep)
│   ├── main.bicep          # Main infrastructure template
│   ├── resources.bicep     # Resource definitions
│   └── modules/            # Reusable modules
└── .azure/                 # Azure Developer CLI files
```

## Local Development

### Backend Development

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run in development mode**:
   ```bash
   npm run dev  # Uses nodemon for auto-restart
   ```

4. **Run tests**:
   ```bash
   npm test
   npm run test:watch  # Watch mode
   npm run test:coverage  # With coverage
   ```

### Frontend Development

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start  # Runs on http://localhost:3000
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

### Full Stack Development

Run both frontend and backend simultaneously:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

## Coding Standards

### JavaScript/Node.js (Backend)

#### Code Style
- **ES6+**: Use modern JavaScript features
- **Async/Await**: Prefer over Promises and callbacks
- **Destructuring**: Use object/array destructuring
- **Arrow Functions**: For short functions and callbacks

#### Example Controller
```javascript
const { validationResult } = require('express-validator');
const { Donation, Donor } = require('../models');

const createDonation = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Extract data
    const { donorId, amount, donationType, paymentMethod } = req.body;

    // Create donation
    const donation = await Donation.create({
      donorId,
      amount,
      donationType,
      paymentMethod,
      userId: req.user.id
    });

    // Include donor information
    const donationWithDonor = await Donation.findByPk(donation.id, {
      include: [{ model: Donor, as: 'donor' }]
    });

    res.status(201).json({
      success: true,
      data: donationWithDonor,
      message: 'Donation created successfully'
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = { createDonation };
```

#### Error Handling
```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: 'Something went wrong'
  });
};
```

### React/JavaScript (Frontend)

#### Component Structure
```javascript
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  TextField,
  Alert
} from '@mui/material';

const DonationForm = ({ onSubmit, initialData = null }) => {
  // State
  const [formData, setFormData] = useState({
    amount: '',
    donationType: 'tithe',
    paymentMethod: 'check'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effects
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Failed to submit donation');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Render
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add Donation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={handleChange('amount')}
          required
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          fullWidth
        >
          {loading ? 'Submitting...' : 'Add Donation'}
        </Button>
      </form>
    </Paper>
  );
};

export default DonationForm;
```

#### Hooks and State Management
```javascript
// Custom hook for API calls
import { useState, useEffect } from 'react';

const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          ...options
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

## Database Development

### Models (Sequelize)

#### Model Definition
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Donation = sequelize.define('Donation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    donorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Donors',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    donationType: {
      type: DataTypes.ENUM('tithe', 'offering', 'building', 'missions', 'other'),
      allowNull: false,
      defaultValue: 'tithe'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'check', 'online', 'card'),
      allowNull: false
    },
    checkNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    donationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'donations',
    timestamps: true,
    indexes: [
      {
        fields: ['donorId']
      },
      {
        fields: ['donationDate']
      },
      {
        fields: ['donationType']
      }
    ]
  });

  return Donation;
};
```

#### Associations
```javascript
// In models/index.js
const setupAssociations = (models) => {
  // Donor has many donations
  models.Donor.hasMany(models.Donation, {
    foreignKey: 'donorId',
    as: 'donations'
  });

  // Donation belongs to donor
  models.Donation.belongsTo(models.Donor, {
    foreignKey: 'donorId',
    as: 'donor'
  });

  // User has many expenses
  models.User.hasMany(models.ExpenseSubmission, {
    foreignKey: 'userId',
    as: 'expenses'
  });
};
```

### Migrations

```javascript
// migrations/20240115_create_donations.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('donations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      donorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'donors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      donationType: {
        type: Sequelize.ENUM('tithe', 'offering', 'building', 'missions', 'other'),
        allowNull: false,
        defaultValue: 'tithe'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('donations', ['donorId']);
    await queryInterface.addIndex('donations', ['donationDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('donations');
  }
};
```

## Testing

### Backend Testing (Jest)

#### Unit Tests
```javascript
// tests/controllers/donation.test.js
const request = require('supertest');
const app = require('../src/app');
const { User, Donor, Donation } = require('../src/models');

describe('Donation Controller', () => {
  let authToken;
  let testUser;
  let testDonor;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;

    // Create test donor
    testDonor = await Donor.create({
      name: 'Test Donor',
      email: 'donor@example.com'
    });
  });

  afterAll(async () => {
    // Cleanup
    await Donation.destroy({ where: {} });
    await Donor.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('POST /api/donations', () => {
    it('should create a new donation', async () => {
      const donationData = {
        donorId: testDonor.id,
        amount: 100.00,
        donationType: 'tithe',
        paymentMethod: 'check',
        checkNumber: '1234'
      };

      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(donationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('100.00');
      expect(response.body.data.donorId).toBe(testDonor.id);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});
```

#### Service Tests
```javascript
// tests/services/reportService.test.js
const { generateDonationReport } = require('../src/services/reportService');
const { Donation, Donor } = require('../src/models');

describe('Report Service', () => {
  beforeEach(async () => {
    // Seed test data
    const donor = await Donor.create({
      name: 'Test Donor',
      email: 'donor@test.com'
    });

    await Donation.bulkCreate([
      {
        donorId: donor.id,
        amount: 100.00,
        donationType: 'tithe',
        donationDate: '2024-01-15'
      },
      {
        donorId: donor.id,
        amount: 50.00,
        donationType: 'offering',
        donationDate: '2024-01-20'
      }
    ]);
  });

  it('should generate donation report correctly', async () => {
    const report = await generateDonationReport({
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });

    expect(report.summary.totalAmount).toBe(150.00);
    expect(report.summary.totalDonations).toBe(2);
    expect(report.byType.tithe).toBe(100.00);
    expect(report.byType.offering).toBe(50.00);
  });
});
```

### Frontend Testing (React Testing Library)

```javascript
// src/components/__tests__/DonationForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import DonationForm from '../DonationForm';
import theme from '../../theme/churchTheme';

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DonationForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form fields correctly', () => {
    renderWithTheme(<DonationForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/donation type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    renderWithTheme(<DonationForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100.00' }
    });

    fireEvent.click(screen.getByText(/add donation/i));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: '100.00',
        donationType: 'tithe',
        paymentMethod: 'check'
      });
    });
  });

  it('displays validation errors', async () => {
    const mockSubmitWithError = jest.fn().mockRejectedValue(
      new Error('Amount is required')
    );

    renderWithTheme(<DonationForm onSubmit={mockSubmitWithError} />);

    fireEvent.click(screen.getByText(/add donation/i));

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });
  });
});
```

## Debugging

### Backend Debugging

#### VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/app.js",
      "env": {
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/backend/.env",
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

#### Logging
```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Frontend Debugging

#### React Developer Tools
- Install React Developer Tools browser extension
- Use Components and Profiler tabs
- Inspect component props and state

#### Console Debugging
```javascript
// Debug API calls
const debugApi = (url, options) => {
  console.group(`API Call: ${options.method || 'GET'} ${url}`);
  console.log('Options:', options);
  
  return fetch(url, options)
    .then(response => {
      console.log('Response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Response data:', data);
      console.groupEnd();
      return data;
    })
    .catch(error => {
      console.error('API Error:', error);
      console.groupEnd();
      throw error;
    });
};
```

## Performance Optimization

### Backend Optimization

#### Database Query Optimization
```javascript
// Efficient queries with includes
const getDonationsWithDonors = async (page = 1, limit = 10) => {
  return await Donation.findAndCountAll({
    include: [
      {
        model: Donor,
        as: 'donor',
        attributes: ['id', 'name', 'email'] // Only needed fields
      }
    ],
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
    // Add indexes for frequently queried fields
    where: {
      createdAt: {
        [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    }
  });
};
```

#### Caching
```javascript
// Simple in-memory cache
const cache = new Map();

const getCachedData = (key, fetchFunction, ttl = 300000) => { // 5 minutes TTL
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = fetchFunction();
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};
```

### Frontend Optimization

#### Code Splitting
```javascript
// Lazy load components
import { lazy, Suspense } from 'react';
import { CircularProgress } from '@mui/material';

const Reports = lazy(() => import('./components/Reports'));
const Dashboard = lazy(() => import('./components/Dashboard'));

const App = () => {
  return (
    <Suspense fallback={<CircularProgress />}>
      <Routes>
        <Route path="/reports" element={<Reports />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
};
```

#### Memoization
```javascript
import { memo, useMemo } from 'react';

const ExpensiveComponent = memo(({ data, filter }) => {
  const filteredData = useMemo(() => {
    return data.filter(item => item.category === filter);
  }, [data, filter]);

  return (
    <div>
      {filteredData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});
```

## Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `hotfix/*`: Critical fixes

### Commit Messages
Follow conventional commits:
```
feat: add donation receipt generation
fix: resolve expense validation bug
docs: update API documentation
style: format code with prettier
refactor: optimize database queries
test: add unit tests for donation service
```

### Pull Request Process
1. Create feature branch from `develop`
2. Make changes and add tests
3. Update documentation if needed
4. Create pull request to `develop`
5. Code review and approval
6. Merge to `develop`
7. Deploy to staging for testing
8. Merge to `main` for production

---

This guide should be updated as the project evolves. For questions or suggestions, please open an issue on GitHub.