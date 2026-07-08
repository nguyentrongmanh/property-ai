import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  const credentials = {
    name: 'Test User',
    email: 'auth-e2e@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, rejects a duplicate email, and logs in', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(credentials)
      .expect(201);

    expect(registerRes.body.data.access_token).toBeDefined();
    expect(registerRes.body.data.refresh_token).toBeDefined();
    expect(registerRes.body.data.user.email).toBe(credentials.email);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(credentials)
      .expect(409);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    expect(loginRes.body.data.access_token).toBeDefined();
  });

  it('rejects a wrong password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' })
      .expect(401);
  });

  it('blocks protected routes without a token, allows them with one', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.access_token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.email).toBe(credentials.email);
      });
  });

  it('rotates refresh tokens and rejects reuse of a spent one', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    const refreshToken = loginRes.body.data.refresh_token;

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(401);
  });
});
