# Security Specification & Threat Model

## 1. Data Invariants
1. **Unauthenticated Write Block**: No anonymous or unauthenticated write requests are permitted to `pm_items`, `execution_records`, or `users`.
2. **Identity Integrity**: Users can only write their own user profile (`request.auth.uid == userId`). Users cannot self-escalate their `role` to `admin`.
3. **Execution Record Integrity**: An execution record must have a valid `itemId` (positive number), `weekNumber` between 1 and 52, and `status` in `['scheduled', 'completed', 'in_progress', 'deferred']`.
4. **PM Item Integrity**: PM routines must have valid IDs, domains with string length <= 64, PM routine codes with length <= 64, and non-empty machine names <= 256 chars.
5. **Boundary & Size Limits**: All string inputs are bounded by size limits to prevent Denial-of-Wallet attacks.
6. **Path Injection Protection**: Path variables must conform to alphanumeric characters and dashes (`isValidId`).
7. **Connection Test**: `/test/connection` allows read access for verifying Firestore reachability.
8. **Catch-All Deny**: Any path not explicitly matched is denied by default.

---

## 2. The "Dirty Dozen" Payloads (Must be Rejected)

1. **Payload 1: Unauthenticated PM Item Creation**
   - Action: `CREATE /pm_items/999`
   - Auth: `null`
   - Data: `{"id": 999, "domain": "Civil Piping", "pm_no": "TEST-1", "machine": "Pump", "pic": "Faizal", "engineer": "Azhar", "frequency": "1W"}`
   - Expected: `PERMISSION_DENIED`

2. **Payload 2: Ghost Field Injection (Shadow Update)**
   - Action: `UPDATE /pm_items/1`
   - Auth: `uid: "user_123"`
   - Data: `{"id": 1, "domain": "Civil Piping", "pm_no": "CP01", "machine": "Air Comp", "pic": "Faizal", "engineer": "Azhar", "frequency": "1W", "isAdmin": true, "superUser": true}`
   - Expected: `PERMISSION_DENIED`

3. **Payload 3: ID Poisoning (Oversized Document ID)**
   - Action: `CREATE /execution_records/` + `A`.repeat(300)
   - Auth: `uid: "user_123"`
   - Data: `{"id": "long_id", "itemId": 1, "weekNumber": 5, "status": "completed"}`
   - Expected: `PERMISSION_DENIED`

4. **Payload 4: Invalid Execution Status Enum**
   - Action: `CREATE /execution_records/1_w5`
   - Auth: `uid: "user_123"`
   - Data: `{"id": "1_w5", "itemId": 1, "weekNumber": 5, "status": "hacked_status"}`
   - Expected: `PERMISSION_DENIED`

5. **Payload 5: Out of Bound Calendar Week Number (Week 99)**
   - Action: `CREATE /execution_records/1_w99`
   - Auth: `uid: "user_123"`
   - Data: `{"id": "1_w99", "itemId": 1, "weekNumber": 99, "status": "completed"}`
   - Expected: `PERMISSION_DENIED`

6. **Payload 6: Profile Identity Hijack**
   - Action: `CREATE /users/other_user_id`
   - Auth: `uid: "attacker_id"`
   - Data: `{"uid": "other_user_id", "email": "victim@plant.com", "displayName": "Victim", "role": "admin"}`
   - Expected: `PERMISSION_DENIED`

7. **Payload 7: Privilege Escalation on User Profile**
   - Action: `UPDATE /users/attacker_id`
   - Auth: `uid: "attacker_id"`
   - Existing: `{"uid": "attacker_id", "email": "tech@plant.com", "displayName": "Tech", "role": "viewer"}`
   - Data: `{"uid": "attacker_id", "email": "tech@plant.com", "displayName": "Tech", "role": "admin"}`
   - Expected: `PERMISSION_DENIED`

8. **Payload 8: Denial of Wallet Oversized String Injection**
   - Action: `UPDATE /execution_records/1_w5`
   - Auth: `uid: "user_123"`
   - Data: `{"id": "1_w5", "itemId": 1, "weekNumber": 5, "status": "completed", "note": "X".repeat(50000)}`
   - Expected: `PERMISSION_DENIED`

9. **Payload 9: Negative PM Item ID Injection**
   - Action: `CREATE /pm_items/-10`
   - Auth: `uid: "user_123"`
   - Data: `{"id": -10, "domain": "Civil Piping", "pm_no": "CP01", "machine": "Pump", "pic": "Faizal", "engineer": "Azhar", "frequency": "1W"}`
   - Expected: `PERMISSION_DENIED`

10. **Payload 10: Unauthenticated Execution Record Creation**
    - Action: `CREATE /execution_records/1_w1`
    - Auth: `null`
    - Data: `{"id": "1_w1", "itemId": 1, "weekNumber": 1, "status": "completed"}`
    - Expected: `PERMISSION_DENIED`

11. **Payload 11: Arbitrary Catch-All Collection Tampering**
    - Action: `CREATE /system_secrets/keys`
    - Auth: `uid: "user_123"`
    - Data: `{"secret": "exploited"}`
    - Expected: `PERMISSION_DENIED`

12. **Payload 12: Corrupted Machine Name (Wrong Type)**
    - Action: `CREATE /pm_items/998`
    - Auth: `uid: "user_123"`
    - Data: `{"id": 998, "domain": "Civil Piping", "pm_no": "CP998", "machine": 12345, "pic": "Faizal", "engineer": "Azhar", "frequency": "1W"}`
    - Expected: `PERMISSION_DENIED`

---

## 3. Test Runner Architecture
See `firestore.rules.test.ts` for unit test validation against `@firebase/rules-unit-testing`.
