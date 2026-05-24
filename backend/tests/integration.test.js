require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const db = require('../src/config/db');
const initDb = require('../src/config/initDb');

let server;
let port;
let baseUrl;
let token;
let foodLogId;
const testEmail = 'testintegration@example.com';
const testPassword = 'password123';
const today = new Date().toISOString().split('T')[0];

test.before(async () => {
  // Ensure tables are bootstrapped
  await initDb();

  // Start express app on dynamic port
  server = app.listen(0);
  port = server.address().port;
  baseUrl = `http://localhost:${port}/api/v1`;

  // Clean up any test user if left over
  await db.query("DELETE FROM public.users WHERE email = $1", [testEmail]);
});

test.after(async () => {
  // Clean up test user
  await db.query("DELETE FROM public.users WHERE email = $1", [testEmail]);
  
  // Close server and database pool
  server.close();
  await db.pool.end();
});

test.describe('NutriPlan-Lite Integration Tests', () => {

  // 1. Auth Tests
  test('POST /auth/register - Should register a new user', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.status, 'success');
    assert.ok(body.data.token);
    assert.strictEqual(body.data.user.email, testEmail);

    token = body.data.token; // Save token for subsequent tests
  });

  test('POST /auth/login - Should successfully log in', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.ok(body.data.token);
  });

  // 2. Profile Tests
  test('GET /profile - Should retrieve default profile details', async () => {
    const res = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.age, 25);
    assert.strictEqual(Number(body.data.weight), 70);
    assert.strictEqual(Number(body.data.height), 175);
    assert.strictEqual(body.data.gender, 'male');
    assert.strictEqual(body.data.fitness_goal, 'maintain');
  });

  test('PUT /profile - Should update profile details successfully', async () => {
    const updateData = {
      age: 30,
      weight: 75.5,
      height: 180,
      gender: 'female',
      activity_level: 1.5,
      fitness_goal: 'lose',
      macro_split: 'balanced',
      water_target: 3000
    };

    const res = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(updateData),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.age, 30);
    assert.strictEqual(Number(body.data.weight), 75.5);
    assert.strictEqual(body.data.gender, 'female');
    assert.strictEqual(body.data.water_target, 3000);
  });

  test('PUT /profile - Custom split validation failure if not 100%', async () => {
    const invalidData = {
      macro_split: 'custom',
      custom_protein: 30,
      custom_carbs: 40,
      custom_fat: 20 // Total = 90%
    };

    const res = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(invalidData),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.status, 'error');
    assert.ok(body.message.includes('add up to exactly 100%') || (body.errors && body.errors[0].message.includes('total exactly 100%')));
  });

  test('PUT /profile - Custom split validation success if exactly 100%', async () => {
    const validData = {
      macro_split: 'custom',
      custom_protein: 30,
      custom_carbs: 40,
      custom_fat: 30 // Total = 100%
    };

    const res = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(validData),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.macro_split, 'custom');
    assert.strictEqual(Number(body.data.custom_protein), 30);
    assert.strictEqual(Number(body.data.custom_carbs), 40);
    assert.strictEqual(Number(body.data.custom_fat), 30);
  });

  // 3. Food Logs Tests
  test('POST /food-logs - Should add a food log', async () => {
    const logData = {
      log_date: today,
      meal_type: 'breakfast',
      food_name: 'Banana Oat Oatmeal',
      quantity_grams: 150,
      calories: 320,
      protein: 8,
      carbs: 55,
      fat: 6
    };

    const res = await fetch(`${baseUrl}/food-logs`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(logData),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.status, 'success');
    assert.ok(body.data.id);
    assert.strictEqual(body.data.food_name, 'Banana Oat Oatmeal');
    assert.strictEqual(Number(body.data.quantity_grams), 150);

    foodLogId = body.data.id;
  });

  test('GET /food-logs - Should retrieve food logs for a date', async () => {
    const res = await fetch(`${baseUrl}/food-logs?date=${today}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].id, foodLogId);
  });

  test('PUT /food-logs/:id - Should update an existing food log', async () => {
    const updateData = {
      quantity_grams: 200,
      calories: 420
    };

    const res = await fetch(`${baseUrl}/food-logs/${foodLogId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(updateData),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(Number(body.data.quantity_grams), 200);
    assert.strictEqual(body.data.calories, 420);
  });

  test('DELETE /food-logs/:id - Should delete a food log', async () => {
    const res = await fetch(`${baseUrl}/food-logs/${foodLogId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');

    // Confirm deletion
    const checkRes = await fetch(`${baseUrl}/food-logs?date=${today}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.data.length, 0);
  });

  // 4. Water Logs Tests
  test('POST /water-logs - Should add a water log', async () => {
    const waterData = {
      log_date: today,
      amount_ml: 250
    };

    const res = await fetch(`${baseUrl}/water-logs`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(waterData),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.status, 'success');
    assert.ok(body.data.id);
    assert.strictEqual(body.data.amount_ml, 250);
  });

  test('GET /water-logs - Should retrieve water logs for a date', async () => {
    const res = await fetch(`${baseUrl}/water-logs?date=${today}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].amount_ml, 250);
  });

  test('DELETE /water-logs - Should reset water logs for a date', async () => {
    const res = await fetch(`${baseUrl}/water-logs?date=${today}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');

    // Confirm deletion
    const checkRes = await fetch(`${baseUrl}/water-logs?date=${today}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.data.length, 0);
  });
});
