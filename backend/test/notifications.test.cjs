const test = require('node:test');
const assert = require('node:assert/strict');
const { NotificationsService } = require('../src/modules/notifications/notifications.service.js');
const { AuthService } = require('../src/modules/auth/auth.service.js');

const user = { sub: '507f1f77bcf86cd799439011', sid: '507f1f77bcf86cd799439012' };

test('registers one token for the active session and removes older tokens', async () => {
  const calls = [];
  const devices = {
    updateOne: async (...args) => { calls.push(['update', ...args]); },
    deleteMany: async (...args) => { calls.push(['delete', ...args]); },
  };
  const service = new NotificationsService(devices, {});

  await service.register(user, { token: 'new-device-token', platform: 'android' });

  assert.equal(calls[0][1].token, 'new-device-token');
  assert.equal(calls[0][2].$set.userId, user.sub);
  assert.equal(calls[0][2].$set.sessionId, user.sid);
  assert.equal(calls[0][2].$set.platform, 'android');
  assert.ok(calls[0][2].$set.lastSeenAt instanceof Date);
  assert.deepEqual(calls[1], ['delete', { token: { $ne: 'new-device-token' }, userId: user.sub, sessionId: user.sid }]);
});

test('sends only to active sessions and removes a rejected token', async () => {
  const devices = [
    { token: 'good-token', sessionId: user.sid },
    { token: 'invalid-token', sessionId: user.sid },
    { token: 'logged-out-token', sessionId: '507f1f77bcf86cd799439013' },
  ];
  let sentPayload;
  let removed;
  const pushDevices = {
    find: () => ({ lean: async () => devices }),
    deleteMany: async (filter) => { removed = filter; },
  };
  const sessions = {
    find: () => ({ select: () => ({ lean: async () => [{ _id: user.sid }] }) }),
  };
  const service = new NotificationsService(pushDevices, sessions);
  service.messaging = () => ({
    sendEachForMulticast: async (payload) => {
      sentPayload = payload;
      return {
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true },
          { success: false, error: { code: 'messaging/registration-token-not-registered' } },
        ],
      };
    },
  });

  const result = await service.sendToUser(user.sub, { title: 'Test', body: 'Hello' });

  assert.deepEqual(result, { sent: 1, failed: 1 });
  assert.deepEqual(sentPayload.tokens, ['good-token', 'invalid-token']);
  assert.deepEqual(removed, { token: { $in: ['invalid-token'] } });
});

test('logout revokes the session and removes its push registrations', async () => {
  let revoked;
  let removed;
  const sessions = {
    updateOne: async (...args) => { revoked = args; return { modifiedCount: 1 }; },
  };
  const pushDevices = {
    deleteMany: async (filter) => { removed = filter; },
  };
  const service = new AuthService({}, sessions, {}, pushDevices);

  await service.logout(user);

  assert.deepEqual(revoked[0], { _id: user.sid, userId: user.sub, revokedAt: null });
  assert.deepEqual(removed, { sessionId: user.sid });
});
