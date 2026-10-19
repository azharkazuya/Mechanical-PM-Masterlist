/**
 * firestore.rules.test.ts
 * Security rules test suite for Mechanical PM Masterlist & Schedule System
 * Tests compliance against the "Dirty Dozen" threat vectors.
 */

import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'celtic-yew-73bk6',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Security Rules - Dirty Dozen Validation', () => {
  test('Payload 1: Unauthenticated PM item creation must fail', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const itemRef = unauthedDb.doc('pm_items/999');
    await assertFails(
      itemRef.set({
        id: 999,
        domain: 'Civil Piping',
        pm_no: 'TEST-1',
        machine: 'Pump',
        pic: 'Faizal',
        engineer: 'Azhar',
        frequency: '1W',
      })
    );
  });

  test('Payload 2: Ghost field injection (shadow update) must fail', async () => {
    const authedDb = testEnv.authenticatedContext('user_123').firestore();
    const itemRef = authedDb.doc('pm_items/1');
    await assertFails(
      itemRef.set({
        id: 1,
        domain: 'Civil Piping',
        pm_no: 'CP01',
        machine: 'Air Comp',
        pic: 'Faizal',
        engineer: 'Azhar',
        frequency: '1W',
        isAdmin: true,
        superUser: true,
      })
    );
  });

  test('Payload 4: Invalid execution status enum must fail', async () => {
    const authedDb = testEnv.authenticatedContext('user_123').firestore();
    const recordRef = authedDb.doc('execution_records/1_w5');
    await assertFails(
      recordRef.set({
        id: '1_w5',
        itemId: 1,
        weekNumber: 5,
        status: 'hacked_status',
      })
    );
  });

  test('Payload 5: Calendar week out of bounds (Week 99) must fail', async () => {
    const authedDb = testEnv.authenticatedContext('user_123').firestore();
    const recordRef = authedDb.doc('execution_records/1_w99');
    await assertFails(
      recordRef.set({
        id: '1_w99',
        itemId: 1,
        weekNumber: 99,
        status: 'completed',
      })
    );
  });

  test('Payload 6: User profile identity hijack must fail', async () => {
    const attackerDb = testEnv.authenticatedContext('attacker_id').firestore();
    const victimRef = attackerDb.doc('users/victim_id');
    await assertFails(
      victimRef.set({
        uid: 'victim_id',
        email: 'victim@plant.com',
        displayName: 'Victim',
        role: 'admin',
      })
    );
  });

  test('Payload 10: Unauthenticated execution record creation must fail', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const recordRef = unauthedDb.doc('execution_records/1_w1');
    await assertFails(
      recordRef.set({
        id: '1_w1',
        itemId: 1,
        weekNumber: 1,
        status: 'completed',
      })
    );
  });

  test('Payload 11: Arbitrary catch-all collection tampering must fail', async () => {
    const authedDb = testEnv.authenticatedContext('user_123').firestore();
    const secretRef = authedDb.doc('system_secrets/keys');
    await assertFails(
      secretRef.set({
        secret: 'exploited',
      })
    );
  });

  test('Authorized connection test probe read must succeed', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const testRef = unauthedDb.doc('test/connection');
    await assertSucceeds(testRef.get());
  });
});
