import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import * as voicesData from './voices.json';
import * as voiceProvidersData from './voice_providers.json';

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
				displayName: 'Voice Name or ID',
				name: 'voice',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						mode: ['monologue'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getVoices',
					loadOptionsDependsOn: ['language'],
				},
				default: '',
				required: true,
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},

			// Voice Configuration - Dialogue
			{
				displayName: 'Host Voice Name or ID',
				name: 'hostVoice',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						mode: ['dialogue'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getVoices',
					loadOptionsDependsOn: ['language'],
				},
				default: '',
				required: true,
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},

			{
				displayName: 'Co-Host Voice Name or ID',
				name: 'cohostVoice',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
						mode: ['dialogue'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getVoices',
					loadOptionsDependsOn: ['language'],
				},
				default: '',
				required: true,
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
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
					hide: {
						inputType: ['script'],
					},
				},
				options: [
					{
						name: 'Beginner',
						value: 'beginner',
					},
					{
						name: 'Expert',
						value: 'expert',
					},
					{
						name: 'Intermediate',
						value: 'intermediate',
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
					hide: {
						inputType: ['script'],
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
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
				},
				options: [
					{ name: 'Arabic', value: 'ar' },
					{ name: 'Chinese (Simplified)', value: 'zh-CN' },
					{ name: 'Czech (Czech Republic)', value: 'cs-CZ' },
					{ name: 'Dutch (Netherlands)', value: 'nl-NL' },
					{ name: 'English (UK)', value: 'en-GB' },
					{ name: 'English (US)', value: 'en-US' },
					{ name: 'French (France)', value: 'fr-FR' },
					{ name: 'German (Germany)', value: 'de-DE' },
					{ name: 'Italian (Italy)', value: 'it-IT' },
					{ name: 'Japanese (Japan)', value: 'ja-JP' },
					{ name: 'Polish (Poland)', value: 'pl-PL' },
					{ name: 'Portuguese (Brazil)', value: 'pt-BR' },
					{ name: 'Russian (Russia)', value: 'ru-RU' },
					{ name: 'Spanish (Mexico)', value: 'es-MX' },
					{ name: 'Spanish (Spain)', value: 'es-ES' },
					{ name: 'Turkish (Turkey)', value: 'tr-TR' },
				],
				default: 'en-US',
				description: 'Content language for audio generation',
			},

			// Advanced Settings
			{
				displayName: 'Emphasis',
				name: 'emphasis',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
					hide: {
						inputType: ['script'],
					},
				},
				default: '',
				description: 'Content emphasis or focus area',
			},

			{
				displayName: 'Questions To Be Answered',
				name: 'questions',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
					hide: {
						inputType: ['script'],
					},
				},
				default: '',
				description: 'Include Q&A segments',
			},

			{
				displayName: 'Additional Instructions',
				name: 'userInstructions',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['generateAudio'],
					},
					hide: {
						inputType: ['script'],
					},
				},
				default: '',
				description: 'Custom instructions for content generation',
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
						displayName: 'Host Voice Instructions',
						name: 'hostVoiceInstructions',
						type: 'string',
						default: '',
						description: 'Custom instructions for host voice (dialogue mode)',
					},
					{
						displayName: 'Read Mode',
						name: 'readMode',
						type: 'boolean',
						default: false,
						description: 'Whether to use direct text reading mode (monologue only)',
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

			// Get Audio Operation Fields
			{
				displayName: 'Audio ID',
				name: 'audioId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['getAudio'],
					},
				},
				default: '',
				required: true,
				description: 'The unique identifier of the audio',
			},

		],
	};

	methods = {
		loadOptions: {
			async getVoices(this: ILoadOptionsFunctions) {
				const language = this.getCurrentNodeParameter('language') as string;
				if (!language) {
					return [];
				}

				const languageData = (voicesData as any)[language];
				if (!languageData?.voices) {
					return [];
				}

				return Object.entries(languageData.voices).map(([value, voice]: [string, any]) => {
					const ttsProvider = voice.tts;
					const providerConfig = (voiceProvidersData as any)[ttsProvider];
					const creditsMultiplier = providerConfig?.credits_multiplier || 1.0;
					const displayNameWithCost = `${voice.display_name} - ${creditsMultiplier} credits/min`;

					return {
						name: displayNameWithCost,
						value: value,
					};
				});
			},
		},
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
						const emphasis = this.getNodeParameter('emphasis', i) as string;
						const questions = this.getNodeParameter('questions', i) as string;
						const userInstructions = this.getNodeParameter('userInstructions', i) as string;
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
							data.voice = this.getNodeParameter('voice', i) as string || 'gemini-puck';
						} else if (mode === 'dialogue') {
							const hostVoiceId = this.getNodeParameter('hostVoice', i) as string || 'gemini-puck';
							const cohostVoiceId = this.getNodeParameter('cohostVoice', i) as string || 'gemini-aoede';

							// Validate voice mixing compatibility
							const languageData = (voicesData as any)[language];
							if (languageData?.voices) {
								const hostVoice = languageData.voices[hostVoiceId];
								const cohostVoice = languageData.voices[cohostVoiceId];

								if (hostVoice && cohostVoice) {
									const hostProvider = hostVoice.tts;
									const cohostProvider = cohostVoice.tts;

									const hostProviderConfig = (voiceProvidersData as any)[hostProvider];
									const cohostProviderConfig = (voiceProvidersData as any)[cohostProvider];

									// Check if either provider cannot mix with others
									if (!hostProviderConfig?.provider_can_mix_with_others && hostProvider !== cohostProvider) {
										throw new NodeOperationError(this.getNode(), `${hostProvider} voices cannot be mixed with other voice providers. Please select another ${hostProvider} voice for the co-host.`);
									}

									if (!cohostProviderConfig?.provider_can_mix_with_others && hostProvider !== cohostProvider) {
										throw new NodeOperationError(this.getNode(), `${cohostProvider} voices cannot be mixed with other voice providers. Please select another ${cohostProvider} voice for the host.`);
									}
								}
							}

							data.hostVoice = hostVoiceId;
							data.coHostVoice = cohostVoiceId;
						}

						// Add direct fields
						if (emphasis) {
							data.emphasis = emphasis;
						}
						if (questions) {
							data.questions = questions;
						}
						if (userInstructions) {
							data.userInstructions = userInstructions;
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
						if (additionalFields.readMode) {
							data.readMode = additionalFields.readMode;
						}

						const credentials = await this.getCredentials('podfeedApi');
						result = await this.helpers.httpRequestWithAuthentication.call(
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

						result = await this.helpers.httpRequestWithAuthentication.call(
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

							const status = await this.helpers.httpRequestWithAuthentication.call(
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
					} else if (operation === 'getAudio') {
						const audioId = this.getNodeParameter('audioId', i) as string;
						const credentials = await this.getCredentials('podfeedApi');

						result = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'podfeedApi',
							{
								method: 'GET',
								baseURL: credentials.baseUrl as string,
								url: `/api/audios/${audioId}`,
								json: true,
							}
						);
					} else if (operation === 'listVoices') {
						const credentials = await this.getCredentials('podfeedApi');
						result = await this.helpers.httpRequestWithAuthentication.call(
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
						returnData.push({
							json: result,
							pairedItem: { item: i }
					});
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
