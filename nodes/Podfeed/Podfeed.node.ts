import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class Podfeed implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Podfeed',
		name: 'podfeed',
		icon: 'file:podfeed.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Generate podcast-style audio content using AI with Podfeed',
		defaults: {
			name: 'Podfeed',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'podfeedApi',
				required: true,
			},
		],
		properties: [
			// Resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Audio',
						value: 'audio',
					},
				],
				default: 'audio',
			},
			
			// Operation selection
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['audio'],
					},
				},
				options: [
					{
						name: 'Delete Audio',
						value: 'deleteAudio',
						description: 'Delete an audio file',
						action: 'Delete audio file',
					},
					{
						name: 'Generate Audio',
						value: 'generateAudio',
						description: 'Generate podcast-style audio from content',
						action: 'Generate audio content',
					},
					{
						name: 'Get Audio',
						value: 'getAudio',
						description: 'Get details for a specific audio file',
						action: 'Get audio details',
					},
					{
						name: 'Get Task Status',
						value: 'getTaskStatus',
						description: 'Check the status of an audio generation task',
						action: 'Get task status',
					},
					{
						name: 'List Audios',
						value: 'listAudios',
						description: 'List generated audio files',
						action: 'List audio files',
					},
					{
						name: 'List Available Voices',
						value: 'listVoices',
						description: 'Get all available voices organized by language',
						action: 'List available voices',
					},
					{
						name: 'Wait for Completion',
						value: 'waitForCompletion',
						description: 'Wait for an audio generation task to complete',
						action: 'Wait for completion',
					},
				],
				default: 'generateAudio',
			},

			// Generate Audio Operation Fields
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
				},
				options: [
					{
						name: 'File',
						value: 'file',
						description: 'File upload',
					},
					{
						name: 'Script',
						value: 'script',
						description: 'Bring-your-own-script',
					},
					{
						name: 'Text',
						value: 'text',
						description: 'Direct text input',
					},
					{
						name: 'Topic',
						value: 'topic',
						description: 'Research-based generation',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'Website URL to scrape',
					},
				],
				default: 'text',
				required: true,
			},

			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
				},
				options: [
					{
						name: 'Monologue',
						value: 'monologue',
						description: 'Single voice narration',
					},
					{
						name: 'Dialogue',
						value: 'dialogue',
						description: 'Two-voice conversation',
					},
				],
				default: 'monologue',
				required: true,
			},

			// Input Content Fields
			{
				displayName: 'Text Content',
				name: 'textContent',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						inputType: ['text'],
					},
				},
				default: '',
				required: true,
				description: 'The text content to convert to audio',
			},

			{
				displayName: 'Website URL',
				name: 'websiteUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						inputType: ['url'],
					},
				},
				default: '',
				required: true,
				description: 'The website URL to scrape and convert',
			},

			{
				displayName: 'Topic',
				name: 'topic',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						inputType: ['topic'],
					},
				},
				default: '',
				required: true,
				description: 'The topic to research and generate content about',
			},

			{
				displayName: 'Script Content',
				name: 'scriptContent',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						inputType: ['script'],
					},
				},
				default: '',
				required: true,
				description: 'Your pre-written script content',
			},

			{
				displayName: 'File URLs or Base64',
				name: 'fileContent',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						inputType: ['file'],
					},
				},
				default: '',
				required: true,
				description: 'File URLs (https://...) or GCS URIs (gs://...), one per line, or base64 encoded file content',
			},

			// Voice Configuration - Monologue
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						mode: ['monologue'],
					},
				},
				default: 'google-male-puck',
				required: true,
				description: 'Voice to use for monologue mode (e.g., "google-male-puck", "elevenlabs-rachel")',
			},

			// Voice Configuration - Dialogue
			{
				displayName: 'Host Voice',
				name: 'hostVoice',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						mode: ['dialogue'],
					},
				},
				default: 'google-male-puck',
				required: true,
				description: 'Host voice for dialogue mode',
			},

			{
				displayName: 'Co-Host Voice',
				name: 'cohostVoice',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						mode: ['dialogue'],
					},
				},
				default: 'google-female-leda',
				required: true,
				description: 'Co-host voice for dialogue mode',
			},

			// Content Configuration
			{
				displayName: 'Content Level',
				name: 'level',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
				},
				options: [
					{
						name: 'Beginner',
						value: 'beginner',
					},
					{
						name: 'Intermediate',
						value: 'intermediate',
					},
					{
						name: 'Expert',
						value: 'expert',
					},
				],
				default: 'intermediate',
			},

			{
				displayName: 'Content Length',
				name: 'length',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
				},
				options: [
					{
						name: 'Short',
						value: 'short',
					},
					{
						name: 'Medium',
						value: 'medium',
					},
					{
						name: 'Long',
						value: 'long',
					},
				],
				default: 'medium',
			},

			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
				},
				default: 'en-US',
				description: 'Content language code (e.g., "en-US", "es-ES")',
			},

			// Additional Fields for Generate Audio
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
				},
				options: [
					{
						displayName: 'Co-Host Voice Instructions',
						name: 'cohostVoiceInstructions',
						type: 'string',
						default: '',
						description: 'Custom instructions for co-host voice (dialogue mode)',
					},
					{
						displayName: 'Emphasis',
						name: 'emphasis',
						type: 'string',
						default: '',
						description: 'Content emphasis or focus area',
					},
					{
						displayName: 'Host Voice Instructions',
						name: 'hostVoiceInstructions',
						type: 'string',
						default: '',
						description: 'Custom instructions for host voice (dialogue mode)',
					},
					{
						displayName: 'Questions',
						name: 'questions',
						type: 'string',
						default: '',
						description: 'Include Q&A segments',
					},
					{
						displayName: 'Read Mode',
						name: 'readMode',
						type: 'boolean',
						default: false,
						description: 'Whether to use direct text reading mode (monologue only)',
					},
					{
						displayName: 'User Instructions',
						name: 'userInstructions',
						type: 'string',
						default: '',
						description: 'Custom instructions for content generation',
					},
					{
						displayName: 'Voice Instructions',
						name: 'voiceInstructions',
						type: 'string',
						default: '',
						description: 'Custom instructions for voice synthesis (monologue mode)',
					},
				],
			},

			// Task Status Operation Fields
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['getTaskStatus', 'waitForCompletion'],
					},
				},
				default: '',
				required: true,
				description: 'The task ID returned from generate audio',
			},

			// Wait for Completion Operation Fields
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['waitForCompletion'],
					},
				},
				default: 3600,
				description: 'Maximum time to wait in seconds',
			},

			{
				displayName: 'Poll Interval (Seconds)',
				name: 'pollInterval',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['waitForCompletion'],
					},
				},
				default: 30,
				description: 'Time between status checks in seconds',
			},

			// List Audios Operation Fields
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['listAudios'],
					},
				},
				default: 50,
				description: 'Max number of results to return',
			},

			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['listAudios'],
					},
				},
				default: 0,
				description: 'Number of audios to skip',
			},

			{
				displayName: 'Status Filter',
				name: 'statusFilter',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['listAudios'],
					},
				},
				options: [
					{
						name: 'All',
						value: '',
					},
					{
						name: 'Processing',
						value: 'processing',
					},
					{
						name: 'Completed',
						value: 'completed',
					},
					{
						name: 'Failed',
						value: 'failed',
					},
				],
				default: '',
				description: 'Filter by status',
			},

			// Get Audio and Delete Audio Operation Fields
			{
				displayName: 'Audio ID',
				name: 'audioId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['getAudio', 'deleteAudio'],
					},
				},
				default: '',
				required: true,
				description: 'The unique identifier of the audio',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'audio') {
					let result: any;
					
					if (operation === 'generateAudio') {
						const inputType = this.getNodeParameter('inputType', i) as string;
						const mode = this.getNodeParameter('mode', i) as string;
						const level = this.getNodeParameter('level', i) as string;
						const length = this.getNodeParameter('length', i) as string;
						const language = this.getNodeParameter('language', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;

						const data: any = {
							inputType,
							mode,
							language,
							level,
							length,
						};

						// Add input content based on type
						if (inputType === 'text') {
							data.textContent = this.getNodeParameter('textContent', i) as string;
						} else if (inputType === 'url') {
							data.websiteUrl = this.getNodeParameter('websiteUrl', i) as string;
						} else if (inputType === 'topic') {
							data.topic = this.getNodeParameter('topic', i) as string;
						} else if (inputType === 'script') {
							data.scriptContent = this.getNodeParameter('scriptContent', i) as string;
						} else if (inputType === 'file') {
							const fileContent = this.getNodeParameter('fileContent', i) as string;
							// Process file URLs or GCS URIs
							const fileUrls = fileContent.split('\n').map(url => url.trim()).filter(url => url);
							data.gcsUris = fileUrls;
						}

						// Add voice configuration
						if (mode === 'monologue') {
							data.voice = this.getNodeParameter('voice', i) as string;
						} else if (mode === 'dialogue') {
							data.hostVoice = this.getNodeParameter('hostVoice', i) as string;
							data.coHostVoice = this.getNodeParameter('cohostVoice', i) as string;
						}

						// Add additional fields
						if (additionalFields.voiceInstructions) {
							data.voiceInstructions = additionalFields.voiceInstructions;
						}
						if (additionalFields.hostVoiceInstructions) {
							data.hostVoiceInstructions = additionalFields.hostVoiceInstructions;
						}
						if (additionalFields.cohostVoiceInstructions) {
							data.cohostVoiceInstructions = additionalFields.cohostVoiceInstructions;
						}
						if (additionalFields.emphasis) {
							data.emphasis = additionalFields.emphasis;
						}
						if (additionalFields.questions) {
							data.questions = additionalFields.questions;
						}
						if (additionalFields.userInstructions) {
							data.userInstructions = additionalFields.userInstructions;
						}
						if (additionalFields.readMode) {
							data.readMode = additionalFields.readMode;
						}

						const credentials = await this.getCredentials('podfeedApi');
						result = await this.helpers.requestWithAuthentication.call(
							this,
							'podfeedApi',
							{
								method: 'POST',
								baseURL: credentials.baseUrl as string,
								url: '/api/audios',
								body: data,
								json: true,
							}
						);
					} else if (operation === 'getTaskStatus') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						const credentials = await this.getCredentials('podfeedApi');

						result = await this.helpers.requestWithAuthentication.call(
							this,
							'podfeedApi',
							{
								method: 'GET',
								baseURL: credentials.baseUrl as string,
								url: `/api/audios/tasks/${taskId}`,
								json: true,
							}
						);
					} else if (operation === 'waitForCompletion') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						const timeout = this.getNodeParameter('timeout', i) as number;
						const pollInterval = this.getNodeParameter('pollInterval', i) as number;

						const credentials = await this.getCredentials('podfeedApi');
						const startTime = Date.now();
						const timeoutMs = timeout * 1000;

						while (Date.now() - startTime < timeoutMs) {
							await new Promise<void>(resolve => {
								(globalThis as any).setTimeout(resolve, pollInterval * 1000);
							});

							const status = await this.helpers.requestWithAuthentication.call(
								this,
								'podfeedApi',
								{
									method: 'GET',
									baseURL: credentials.baseUrl as string,
									url: `/api/audios/tasks/${taskId}`,
									json: true,
								}
							);

							if (status.status === 'completed') {
								result = status;
								break;
							} else if (status.status === 'failed') {
								const errorMsg = status.error || 'Task failed';
								throw new NodeOperationError(this.getNode(), `Audio generation failed: ${errorMsg}`);
							}
						}

						if (!result) {
							throw new NodeOperationError(this.getNode(), `Task timed out after ${timeout} seconds`);
						}
					} else if (operation === 'listAudios') {
						const limit = this.getNodeParameter('limit', i) as number;
						const offset = this.getNodeParameter('offset', i) as number;
						const statusFilter = this.getNodeParameter('statusFilter', i) as string;

						const params: any = { limit, offset };
						if (statusFilter) {
							params.status = statusFilter;
						}

						const credentials = await this.getCredentials('podfeedApi');
						result = await this.helpers.requestWithAuthentication.call(
							this,
							'podfeedApi',
							{
								method: 'GET',
								baseURL: credentials.baseUrl as string,
								url: '/api/audios',
								qs: params,
								json: true,
							}
						);
					} else if (operation === 'getAudio') {
						const audioId = this.getNodeParameter('audioId', i) as string;
						const credentials = await this.getCredentials('podfeedApi');

						result = await this.helpers.requestWithAuthentication.call(
							this,
							'podfeedApi',
							{
								method: 'GET',
								baseURL: credentials.baseUrl as string,
								url: `/api/audios/${audioId}`,
								json: true,
							}
						);
					} else if (operation === 'deleteAudio') {
						const audioId = this.getNodeParameter('audioId', i) as string;
						const credentials = await this.getCredentials('podfeedApi');

						result = await this.helpers.requestWithAuthentication.call(
							this,
							'podfeedApi',
							{
								method: 'DELETE',
								baseURL: credentials.baseUrl as string,
								url: `/api/audios/${audioId}`,
								json: true,
							}
						);
					} else if (operation === 'listVoices') {
						const credentials = await this.getCredentials('podfeedApi');
						result = await this.helpers.requestWithAuthentication.call(
							this,
							'podfeedApi',
							{
								method: 'GET',
								baseURL: credentials.baseUrl as string,
								url: '/api/voices',
								json: true,
							}
						);
					}
					
					if (result) {
						returnData.push({ json: result });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}