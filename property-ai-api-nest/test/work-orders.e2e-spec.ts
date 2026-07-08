import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { Building } from '../src/properties/entities/building.entity';
import { createTestApp } from './utils/create-test-app';
import { registerAndLogin } from './utils/auth-helpers';

describe('Work Orders (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    const buildings = app.get<Repository<Building>>(
      getRepositoryToken(Building),
    );
    await buildings.save({
      id: 'P-001',
      name: 'Test Building',
      type: 'office',
      status: 'active',
      city: 'Amsterdam',
      units: 10,
      occupancyRate: 0.5,
      amenities: null,
    } as Building);

    accessToken = await registerAndLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a work order through the AI pipeline', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        property_id: 'P-001',
        email: 'tenant@example.com',
        description: 'the heating has not worked for three days now',
      })
      .expect(201);

    expect(res.body.data.title).toBe('Fake generated title');
    expect(res.body.data.status).toBe('open');
    expect(res.body.data.property_id).toBe('P-001');
    expect(res.body.data.id).toMatch(/^WO-/);
  });

  it('rejects a non-existent property, invalid email, and too-short description', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        property_id: 'P-999',
        email: 'not-an-email',
        description: 'short',
      })
      .expect(422);

    expect(res.body.errors.property_id).toBeDefined();
    expect(res.body.errors.email).toBeDefined();
    expect(res.body.errors.description).toBeDefined();
  });

  it('lists work orders for a property', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/work-orders?property_id=P-001')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(
      res.body.data.every(
        (wo: { property_id: string }) => wo.property_id === 'P-001',
      ),
    ).toBe(true);
  });

  it('blocks work order creation without a token', () => {
    return request(app.getHttpServer())
      .post('/api/work-orders')
      .send({
        property_id: 'P-001',
        email: 'tenant@example.com',
        description: 'no auth header sent here',
      })
      .expect(401);
  });

  it('creates a work order in manual mode without calling the AI client', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        property_id: 'P-001',
        email: 'staff@example.com',
        mode: 'manual',
        description: 'reported directly by building staff after a walkthrough',
        title: 'Broken handrail on stairwell B',
        category: 'structural',
        priority: 'high',
        summary: 'Handrail on stairwell B is loose and needs to be re-secured.',
      })
      .expect(201);

    expect(res.body.data.title).toBe('Broken handrail on stairwell B');
    expect(res.body.data.category).toBe('structural');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.summary).toBe(
      'Handrail on stairwell B is loose and needs to be re-secured.',
    );
  });

  it('rejects manual mode when title, category, priority or summary are missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        property_id: 'P-001',
        email: 'staff@example.com',
        mode: 'manual',
        description: 'reported directly by building staff after a walkthrough',
      })
      .expect(422);

    expect(res.body.errors.title).toBeDefined();
    expect(res.body.errors.category).toBeDefined();
    expect(res.body.errors.priority).toBeDefined();
    expect(res.body.errors.summary).toBeDefined();
  });

  it('shows a single work order', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        property_id: 'P-001',
        email: 'staff@example.com',
        mode: 'manual',
        description: 'reported directly by building staff after a walkthrough',
        title: 'Leaky faucet in unit 4B',
        category: 'plumbing',
        priority: 'low',
        summary: 'Faucet in unit 4B drips constantly.',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/work-orders/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.title).toBe('Leaky faucet in unit 4B');
  });

  it('404s for a missing work order', () => {
    return request(app.getHttpServer())
      .get('/api/work-orders/WO-9999')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('updates only the fields given, leaving the rest untouched', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        property_id: 'P-001',
        email: 'staff@example.com',
        mode: 'manual',
        description: 'reported directly by building staff after a walkthrough',
        title: 'Original title',
        category: 'general',
        priority: 'low',
        summary: 'Original summary.',
      })
      .expect(201);

    const id = created.body.data.id;

    const res = await request(app.getHttpServer())
      .patch(`/api/work-orders/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'in_progress', priority: 'urgent' })
      .expect(200);

    expect(res.body.data.title).toBe('Original title');
    expect(res.body.data.summary).toBe('Original summary.');
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.priority).toBe('urgent');
  });

  it('404s when updating a missing work order', () => {
    return request(app.getHttpServer())
      .patch('/api/work-orders/WO-9999')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'completed' })
      .expect(404);
  });

  it('blocks work order updates without a token', () => {
    return request(app.getHttpServer())
      .patch('/api/work-orders/WO-9999')
      .send({ status: 'completed' })
      .expect(401);
  });
});
