process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

beforeAll(async () => {
  try {
    await sequelize.sync({ force: false });
  } catch (error) {
    console.error('Test DB Sync Error:', error);
  }
}, 30000);

afterAll(async () => {
  await sequelize.close();
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });

  it('should login a user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});