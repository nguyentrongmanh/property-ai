import { INestApplication } from '@nestjs/common';
import request from 'supertest';

let counter = 0;

export async function registerAndLogin(app: INestApplication): Promise<string> {
  counter += 1;
  const email = `e2e-user-${Date.now()}-${counter}@example.com`;

  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ name: 'E2E User', email, password: 'password123' })
    .expect(201);

  return res.body.data.access_token;
}
