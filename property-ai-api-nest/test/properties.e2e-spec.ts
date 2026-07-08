import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AiService } from '../src/ai/ai.service';
import { Building } from '../src/properties/entities/building.entity';
import { WorkOrder } from '../src/work-orders/entities/work-order.entity';
import { createTestApp } from './utils/create-test-app';
import { registerAndLogin } from './utils/auth-helpers';

describe('Properties (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let aiService: AiService;

  beforeAll(async () => {
    app = await createTestApp();

    const buildings = app.get<Repository<Building>>(
      getRepositoryToken(Building),
    );
    const workOrders = app.get<Repository<WorkOrder>>(
      getRepositoryToken(WorkOrder),
    );

    await buildings.save([
      {
        id: 'P-001',
        name: 'Full House',
        type: 'office',
        status: 'active',
        city: 'Amsterdam',
        units: 10,
        occupancyRate: 0.9,
        amenities: ['elevator'],
      },
      {
        id: 'P-002',
        name: 'Empty House',
        type: 'retail',
        status: 'active',
        city: 'Rotterdam',
        units: 5,
        occupancyRate: 0.2,
        amenities: null,
      },
    ] as Building[]);

    await workOrders.save([
      {
        id: 'WO-1001',
        propertyId: 'P-001',
        sourceText: 'x',
        requesterEmail: 'a@example.com',
        title: 'Open one',
        category: 'general',
        priority: 'high',
        summary: 's',
        status: 'open',
      },
      {
        id: 'WO-1002',
        propertyId: 'P-001',
        sourceText: 'x',
        requesterEmail: 'a@example.com',
        title: 'Completed one',
        category: 'general',
        priority: 'low',
        summary: 's',
        status: 'completed',
      },
    ] as WorkOrder[]);

    aiService = app.get(AiService);
    accessToken = await registerAndLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists properties with the fullest first', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.map((p: { id: string }) => p.id)).toEqual([
      'P-001',
      'P-002',
    ]);
  });

  it('returns an explicit message instead of an empty list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/properties?city=Nowhere')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toEqual([]);
    expect(typeof res.body.message).toBe('string');
  });

  it('shows a property with its open work order count', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/properties/P-001')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.open_work_orders).toBe(1);
  });

  it('404s for a missing property', () => {
    return request(app.getHttpServer())
      .get('/api/properties/P-999')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('returns occupancy stats grouped by city', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/properties/stats')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ city: 'Amsterdam', total_properties: 1 }),
      ]),
    );
  });

  it('generates an AI summary via the fake client', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/properties/P-001/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.summary).toBe('Fake building summary.');
  });

  it('caches a summary and invalidates it on work-order create/update/delete', async () => {
    const spy = jest.spyOn(aiService, 'generateBuildingSummary');
    const baselineCalls = spy.mock.calls.length;

    const propertyRes = await request(app.getHttpServer())
      .post('/api/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Cache Test Building', city: 'Utrecht' })
      .expect(201);

    const propertyId = propertyRes.body.data.id;

    // Previous test runs may leave Redis cache entries for deterministic IDs.
    // Touching the property through update guarantees a clean cache state.
    await request(app.getHttpServer())
      .patch(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ city: 'Utrecht' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/properties/${propertyId}/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(spy.mock.calls.length).toBe(baselineCalls + 1);

    await request(app.getHttpServer())
      .get(`/api/properties/${propertyId}/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(spy.mock.calls.length).toBe(baselineCalls + 1);

    const created = await request(app.getHttpServer())
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        property_id: propertyId,
        email: 'staff@example.com',
        mode: 'manual',
        description: 'reported directly by building staff after a walkthrough',
        title: 'Cache invalidation create test',
        category: 'general',
        priority: 'low',
        summary: 'Created to validate summary cache invalidation.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/properties/${propertyId}/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(spy.mock.calls.length).toBe(baselineCalls + 2);

    await request(app.getHttpServer())
      .patch(`/api/work-orders/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'in_progress' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/properties/${propertyId}/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(spy.mock.calls.length).toBe(baselineCalls + 3);

    await request(app.getHttpServer())
      .delete(`/api/work-orders/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/properties/${propertyId}/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(spy.mock.calls.length).toBe(baselineCalls + 4);
  });

  it('creates a property with a generated prefixed id', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New Test Building',
        city: 'Nijmegen',
        units: 20,
        occupancy_rate: 0.5,
      })
      .expect(201);

    expect(res.body.data.id).toMatch(/^P-/);
    expect(res.body.data.name).toBe('New Test Building');
    expect(res.body.data.status).toBe('active');
  });

  it('creates a property with only the required field', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Minimal Building' })
      .expect(201);

    expect(res.body.data.type).toBeNull();
    expect(res.body.data.city).toBeNull();
  });

  it('rejects a property without a name', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ city: 'Nowhere' })
      .expect(422);

    expect(res.body.errors.name).toBeDefined();
  });

  it('blocks property creation without a token', () => {
    return request(app.getHttpServer())
      .post('/api/properties')
      .send({ name: 'No Auth Building' })
      .expect(401);
  });

  it('updates only the fields given, leaving the rest untouched', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Editable Building', city: 'Delft', units: 12 })
      .expect(201);

    const id = created.body.data.id;

    const res = await request(app.getHttpServer())
      .patch(`/api/properties/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ city: 'Leiden', occupancy_rate: 0.42 })
      .expect(200);

    expect(res.body.data.name).toBe('Editable Building');
    expect(res.body.data.city).toBe('Leiden');
    expect(res.body.data.units).toBe(12);
    expect(res.body.data.occupancy_rate).toBe(0.42);
  });

  it('404s when updating a missing property', () => {
    return request(app.getHttpServer())
      .patch('/api/properties/P-999')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ city: 'Nowhere' })
      .expect(404);
  });

  it('blocks property updates without a token', () => {
    return request(app.getHttpServer())
      .patch('/api/properties/P-001')
      .send({ city: 'Nowhere' })
      .expect(401);
  });
});
