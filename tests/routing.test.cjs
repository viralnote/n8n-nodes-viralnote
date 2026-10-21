process.env.N8N_USER_FOLDER = require('node:fs').mkdtempSync(
	require('node:path').join(require('node:os').tmpdir(), 'viralnote-n8n-test-'),
);
require('reflect-metadata');
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const nock = require('nock');
const { Workflow, NodeHelpers } = require('n8n-workflow');
const { RoutingNode } = require('n8n-core/dist/execution-engine/routing-node');
const { ExecuteContext } = require('n8n-core/dist/execution-engine/node-execution-context');
const { Viralnote } = require('../dist/nodes/Viralnote/Viralnote.node');
const { ViralnoteApi } = require('../dist/credentials/ViralnoteApi.credentials');
const nodeType = new Viralnote();
const credential = new ViralnoteApi();
const origin = 'https://dashboard.viralnote.app';
nock.disableNetConnect();
afterEach(() => {
	const pending = nock.pendingMocks();
	nock.cleanAll();
	assert.equal(pending.length, 0, `Unconsumed HTTP mocks: ${pending.join(', ')}`);
});

async function run(parameters) {
	const type = '@viralnote/n8n-nodes-viralnote.viralnote';
	const node = {
		id: 'node',
		name: 'ViralNote',
		type,
		typeVersion: 1,
		position: [0, 0],
		parameters: NodeHelpers.getNodeParameters(
			nodeType.description.properties,
			parameters,
			true,
			false,
		),
		credentials: { viralnoteApi: { id: 'test', name: 'Test' } },
	};
	const workflow = new Workflow({
		id: 'test',
		name: 'ViralNote routing test',
		nodes: [node],
		connections: {},
		active: false,
		nodeTypes: { getByNameAndVersion: () => nodeType },
		settings: { timezone: 'UTC' },
	});
	const items = [{ json: {} }];
	const input = { main: [items] };
	const executeData = { node, data: input, source: { main: [{ previousNode: 'Start' }] } };
	const runData = {
		resultData: { runData: {} },
		executionData: {
			contextData: {},
			nodeExecutionStack: [],
			waitingExecution: {},
			waitingExecutionSource: {},
		},
	};
	const additionalData = {
		executionId: 'test',
		currentNodeParameters: node.parameters,
		credentialsHelper: {
			getParentTypes: () => [],
			preAuthentication: async () => undefined,
			getDecrypted: async () => ({ apiKey: 'test-only-not-a-real-key' }),
			authenticate: async (_credentials, _type, options) => ({
				...options,
				headers: { ...options.headers, Authorization: 'Bearer test-only-not-a-real-key' },
			}),
		},
	};
	const context = new ExecuteContext(
		workflow,
		node,
		additionalData,
		'manual',
		runData,
		0,
		items,
		input,
		executeData,
		[],
	);
	const response = await new RoutingNode(context, nodeType, {
		id: 'test',
		name: 'Test',
		data: { apiKey: 'test-only-not-a-real-key' },
	}).runNode();
	return response[0].map((item) => item.json);
}

test('brand and account lists return separate n8n items', async () => {
	nock(origin)
		.get('/api/v1/brands')
		.query(true)
		.reply(200, { data: { items: [{ id: 'one' }, { id: 'two' }] } });
	assert.deepEqual(await run({ resource: 'brand', operation: 'getAll' }), [
		{ id: 'one' },
		{ id: 'two' },
	]);
	nock(origin)
		.get('/api/v1/social-accounts')
		.query((q) => q.brandId === 'one')
		.reply(200, { data: [{ id: 'account' }] });
	assert.deepEqual(await run({ resource: 'socialAccount', operation: 'getAll', brandId: 'one' }), [
		{ id: 'account' },
	]);
});

test('draft operation sends a draft and parses account metadata JSON', async () => {
	nock(origin, { reqheaders: { authorization: 'Bearer test-only-not-a-real-key' } })
		.post(
			'/api/v1/posts',
			(body) =>
				body.status === 'draft' &&
				body.platforms[0] === 'facebook' &&
				body.caption === 'Review me' &&
				body.platformAccountIds.facebook[0] === 'a1' &&
				body.platformMetadata.facebook.example === true,
		)
		.query(true)
		.reply(201, { data: { id: 'draft', status: 'draft' } });
	assert.deepEqual(
		await run({
			resource: 'post',
			operation: 'createDraft',
			caption: 'Review me',
			platforms: ['facebook'],
			additionalFields: {
				platformAccountIds: '{"facebook":["a1"]}',
				platformMetadata: '{"facebook":{"example":true}}',
				status: 'published',
			},
		}),
		[{ id: 'draft', status: 'draft' }],
	);
});

test('schedule operation sends an explicit schedule time', async () => {
	nock(origin)
		.post(
			'/api/v1/posts',
			(body) => body.status === 'scheduled' && body.scheduledFor === '2030-01-01T12:00:00.000Z',
		)
		.query(true)
		.reply(201, { data: { id: 'scheduled' } });
	assert.deepEqual(
		await run({
			resource: 'post',
			operation: 'schedule',
			caption: 'Future post',
			platforms: ['facebook'],
			scheduledFor: '2030-01-01T12:00:00.000Z',
		}),
		[{ id: 'scheduled' }],
	);
});

test('limited post reads preserve filters and do not fetch another page', async () => {
	nock(origin)
		.get('/api/v1/posts')
		.query(
			(q) =>
				q.limit === '2' &&
				q.brandId === 'brand' &&
				q.status === 'draft' &&
				q.since === '2026-01-01T00:00:00Z',
		)
		.reply(200, { data: { items: [{ id: 'one' }, { id: 'two' }], nextCursor: 'next-page' } });
	assert.deepEqual(
		await run({
			resource: 'post',
			operation: 'getAll',
			returnAll: false,
			limit: 2,
			brandId: 'brand',
			filters: { status: 'draft', since: '2026-01-01T00:00:00Z' },
		}),
		[{ id: 'one' }, { id: 'two' }],
	);
});

test('return all follows opaque cursor pagination and stops at the end', async () => {
	nock(origin)
		.get('/api/v1/posts')
		.query((q) => !q.cursor)
		.reply(200, { data: { items: [{ id: 'one' }], nextCursor: 'opaque/+ cursor' } });
	nock(origin)
		.get('/api/v1/posts')
		.query((q) => q.cursor === 'opaque/+ cursor')
		.reply(200, { data: { items: [{ id: 'two' }], nextCursor: null } });
	assert.deepEqual(await run({ resource: 'post', operation: 'getAll', returnAll: true }), [
		{ id: 'one' },
		{ id: 'two' },
	]);
});

test('post IDs are encoded within their route segment', async () => {
	nock(origin)
		.get('/api/v1/posts/has%2Fslash')
		.query(true)
		.reply(200, { data: { id: 'has/slash' } });
	assert.deepEqual(await run({ resource: 'post', operation: 'get', postId: 'has/slash' }), [
		{ id: 'has/slash' },
	]);
});

test('publish and delete use their own endpoints', async () => {
	nock(origin)
		.post('/api/v1/posts/draft/publish')
		.query(true)
		.reply(200, { data: { id: 'draft', status: 'published' } });
	assert.deepEqual(await run({ resource: 'post', operation: 'publish', postId: 'draft' }), [
		{ id: 'draft', status: 'published' },
	]);
	nock(origin)
		.delete('/api/v1/posts/draft')
		.query(true)
		.reply(200, { data: { id: 'draft', deleted: true } });
	assert.deepEqual(await run({ resource: 'post', operation: 'delete', postId: 'draft' }), [
		{ id: 'draft', deleted: true },
	]);
});

test('permission and entitlement errors remain failures', async () => {
	nock(origin)
		.post('/api/v1/posts/draft/publish')
		.query(true)
		.reply(403, {
			error: { code: 'payment_required', message: 'Publishing requires an active entitlement' },
		});
	await assert.rejects(run({ resource: 'post', operation: 'publish', postId: 'draft' }));
});

test('credential is secret and tested with a read-only endpoint', () => {
	assert.equal(credential.properties.find((p) => p.name === 'apiKey').typeOptions.password, true);
	assert.equal(credential.test.request.method, 'GET');
	assert.equal(credential.test.request.url, '/brands');
	assert.equal(
		nodeType.description.requestDefaults.baseURL,
		'https://dashboard.viralnote.app/api/v1',
	);
});

test('draft retries retain the execution item idempotency key', async () => {
	const keys = [];
	nock(origin)
		.post('/api/v1/posts')
		.query(true)
		.reply(function () {
			keys.push(this.req.headers['idempotency-key']);
			return [503, { error: { code: 'unavailable', message: 'Try again' } }];
		});
	nock(origin)
		.post('/api/v1/posts')
		.query(true)
		.reply(function () {
			keys.push(this.req.headers['idempotency-key']);
			return [201, { data: { id: 'one-draft', status: 'draft' } }];
		});
	await assert.rejects(
		run({
			resource: 'post',
			operation: 'createDraft',
			caption: 'Retry safely',
			platforms: ['facebook'],
		}),
		{ httpCode: '503' },
	);
	assert.deepEqual(
		await run({
			resource: 'post',
			operation: 'createDraft',
			caption: 'Retry safely',
			platforms: ['facebook'],
		}),
		[{ id: 'one-draft', status: 'draft' }],
	);
	assert.deepEqual(keys, ['n8n:test:node:0:0', 'n8n:test:node:0:0']);
});
