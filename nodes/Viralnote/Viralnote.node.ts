import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Viralnote implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ViralNote',
		name: 'viralnote',
		icon: { light: 'file:viralnote.png', dark: 'file:viralnote.png' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Read social accounts, create drafts, and schedule or publish posts with ViralNote',
		defaults: {
			name: 'ViralNote',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'viralnoteApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://dashboard.viralnote.app/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Brand',
						value: 'brand',
					},
					{
						name: 'Post',
						value: 'post',
					},
					{
						name: 'Social Account',
						value: 'socialAccount',
					},
				],
				default: 'post',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['brand'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many brands',
						action: 'Get many brands',
						routing: {
							request: {
								method: 'GET',
								url: '/brands',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data.items',
										},
									},
								],
							},
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['socialAccount'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many social accounts',
						action: 'Get many social accounts',
						routing: {
							request: {
								method: 'GET',
								url: '/social-accounts',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['post'],
					},
				},
				options: [
					{
						name: 'Create Draft',
						value: 'createDraft',
						description: 'Create a draft post',
						action: 'Create a draft post',
						routing: {
							request: {
								method: 'POST',
								url: '/posts',
								headers: {
									'Idempotency-Key':
										"={{ 'n8n:' + $execution.id + ':' + $nodeId + ':' + $runIndex + ':' + $itemIndex }}",
								},
								body: {
									status: 'draft',
								},
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a post',
						action: 'Delete a post',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/posts/{{encodeURIComponent($parameter.postId)}}',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a post',
						action: 'Get a post',
						routing: {
							request: {
								method: 'GET',
								url: '=/posts/{{encodeURIComponent($parameter.postId)}}',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many posts',
						action: 'Get many posts',
						routing: {
							request: {
								method: 'GET',
								url: '/posts',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data.items',
										},
									},
								],
							},
						},
					},
					{
						name: 'Publish',
						value: 'publish',
						description: 'Publish a post now',
						action: 'Publish a post now',
						routing: {
							request: {
								method: 'POST',
								url: '=/posts/{{encodeURIComponent($parameter.postId)}}/publish',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Schedule',
						value: 'schedule',
						description: 'Schedule a post',
						action: 'Schedule a post',
						routing: {
							request: {
								method: 'POST',
								url: '/posts',
								headers: {
									'Idempotency-Key':
										"={{ 'n8n:' + $execution.id + ':' + $nodeId + ':' + $runIndex + ':' + $itemIndex }}",
								},
								body: {
									status: 'scheduled',
								},
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
				],
				default: 'createDraft',
			},
			{
				displayName: 'Post ID',
				name: 'postId',
				type: 'string',
				default: '',
				description: 'ID of the post to retrieve, delete, or publish',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['delete', 'get', 'publish'],
					},
				},
				required: true,
			},
			{
				displayName:
					'Publishing sends content to the selected social accounts. Confirm the content, accounts, and timing before running this operation.',
				name: 'publishNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['publish', 'schedule'],
					},
				},
			},
			{
				displayName: 'Platforms',
				name: 'platforms',
				type: 'multiOptions',
				default: [],
				description: 'Social platforms connected to the selected brand',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['createDraft', 'schedule'],
					},
				},
				required: true,
				options: [
					{
						name: 'Bluesky',
						value: 'bluesky',
					},
					{
						name: 'Facebook',
						value: 'facebook',
					},
					{
						name: 'Instagram',
						value: 'instagram',
					},
					{
						name: 'LinkedIn',
						value: 'linkedin',
					},
					{
						name: 'Pinterest',
						value: 'pinterest',
					},
					{
						name: 'Reddit',
						value: 'reddit',
					},
					{
						name: 'Threads',
						value: 'threads',
					},
					{
						name: 'TikTok',
						value: 'tiktok',
					},
					{
						name: 'X',
						value: 'twitter',
					},
					{
						name: 'YouTube',
						value: 'youtube',
					},
				],
				routing: {
					send: {
						type: 'body',
						property: 'platforms',
					},
				},
			},
			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				default: '',
				description: 'Text for the post. Platform limits apply.',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['createDraft', 'schedule'],
					},
				},
				required: true,
				typeOptions: {
					rows: 4,
				},
				routing: {
					send: {
						type: 'body',
						property: 'caption',
					},
				},
			},
			{
				displayName: 'Scheduled For',
				name: 'scheduledFor',
				type: 'dateTime',
				default: '',
				description: 'Time when the post should be published',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['schedule'],
					},
				},
				required: true,
				routing: {
					send: {
						type: 'body',
						property: 'scheduledFor',
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				default: {},
				description: 'Additional post fields',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['createDraft', 'schedule'],
					},
				},
				placeholder: 'Add Field',
				options: [
					{
						displayName: 'Brand ID',
						name: 'brandId',
						type: 'string',
						default: '',
						description: 'Brand workspace for this post. Omit to use the credential default.',
						routing: {
							send: {
								type: 'body',
								property: 'brandId',
							},
						},
					},
					{
						displayName: 'Library Item ID',
						name: 'libraryItemId',
						type: 'string',
						default: '',
						description: 'Existing ViralNote media library item to attach',
						routing: {
							send: {
								type: 'body',
								property: 'libraryItemId',
							},
						},
					},
					{
						displayName: 'Platform Account IDs',
						name: 'platformAccountIds',
						type: 'json',
						default: '{}',
						description: 'JSON object mapping each platform to the intended connected account IDs',
						routing: {
							send: {
								type: 'body',
								property: 'platformAccountIds',
								value: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}',
							},
						},
					},
					{
						displayName: 'Platform Metadata',
						name: 'platformMetadata',
						type: 'json',
						default: '{}',
						description: 'JSON object with provider-specific fields, such as Pinterest board IDs',
						routing: {
							send: {
								type: 'body',
								property: 'platformMetadata',
								value: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}',
							},
						},
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description:
							'Internal post label, also used as the title on platforms that require one',
						routing: {
							send: {
								type: 'body',
								property: 'title',
							},
						},
					},
				],
			},
			{
				displayName: 'Brand ID',
				name: 'brandId',
				type: 'string',
				default: '',
				description: 'Filter by brand workspace. Omit to use the credential default.',
				displayOptions: {
					show: {
						resource: ['post', 'socialAccount'],
						operation: ['getAll'],
					},
				},
				routing: {
					send: {
						type: 'query',
						property: 'brandId',
						value: '={{$value || undefined}}',
					},
				},
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['getAll'],
					},
				},
				routing: {
					send: {
						paginate: '={{$value}}',
					},
					operations: {
						pagination: {
							type: 'generic',
							properties: {
								continue: '={{ !!$response.body.data.nextCursor }}',
								request: {
									qs: {
										limit: 50,
										cursor: '={{$response.body.data.nextCursor}}',
									},
								},
							},
						},
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 50,
				},
				routing: {
					send: {
						type: 'query',
						property: 'limit',
					},
					output: {
						maxResults: '={{$value}}',
					},
				},
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				default: {},
				description: 'Filters for the post list',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['getAll'],
					},
				},
				placeholder: 'Add Filter',
				options: [
					{
						displayName: 'Since',
						name: 'since',
						type: 'string',
						default: '',
						description: 'Only posts updated after this ISO 8601 timestamp',
						routing: {
							send: {
								type: 'query',
								property: 'since',
								value: '={{$value || undefined}}',
							},
						},
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'string',
						default: '',
						description: 'Only posts matching this status',
						routing: {
							send: {
								type: 'query',
								property: 'status',
								value: '={{$value || undefined}}',
							},
						},
					},
				],
			},
		],
	};
}
