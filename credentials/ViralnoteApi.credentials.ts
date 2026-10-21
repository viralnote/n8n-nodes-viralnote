import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ViralnoteApi implements ICredentialType {
	name = 'viralnoteApi';
	displayName = 'ViralNote API';
	icon: ICredentialType['icon'] = {
		light: 'file:../nodes/Viralnote/viralnote.png',
		dark: 'file:../nodes/Viralnote/viralnote.png',
	};
	documentationUrl = 'https://github.com/viralnote/n8n-nodes-viralnote#credentials';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'API key from your ViralNote developer settings. Enter the key without the Bearer prefix.',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } },
	};
	test: ICredentialTestRequest = {
		request: { baseURL: 'https://dashboard.viralnote.app/api/v1', url: '/brands', method: 'GET' },
	};
}
