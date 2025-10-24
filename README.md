# Podfeed n8n Node

A custom n8n community node for integrating with the [Podfeed API](https://podfeed.ai) to generate podcast-style audio content using AI.

## Installation

To install this node in your n8n instance:

1. Install the package:
   ```bash
   npm install n8n-nodes-podfeed
   ```

2. Restart your n8n instance.

## Configuration

### Credentials

To use this node, you need to configure your Podfeed API credentials:

1. In n8n, go to **Settings** → **Credentials**
2. Create new credentials of type **Podfeed API**
3. Enter your API key (get it from [podfeed.ai](https://podfeed.ai)): Click on **Get started**, sign in, and navigate to the API menu. 


## Features

This node supports all major Podfeed API operations:

### Operations

- **Generate Audio**: Create podcast-style audio from various input types
- **Get Task Status**: Check the status of an audio generation task
- **Get Audio**: Get details for a specific audio 
- **List Available Voices**: Get all available voices organized by language

### Input Types

The **Generate Audio** operation supports 5 different input types:

1. **Text**: Direct text input for immediate audio generation
2. **URL**: Website URL to scrape and convert to audio
3. **Topic**: Research-based generation from a topic description
4. **Script**: Bring-your-own-script for direct text-to-speech
5. **File**: File upload (supports PDFs, documents, audio files, etc.)

### Audio Modes

- **Monologue**: Single voice narration
- **Dialogue**: Two-voice conversation with host and co-host

### Voice Configuration

- Support for multiple voice providers (Google, ElevenLabs, Gemini)
- Custom voice instructions for personalized speech styles
- Separate voice configuration for dialogue mode (host + co-host)

### Content Configuration

- **Complexity levels**: Beginner, Intermediate, Expert
- **Length options**: Short, Medium, Long
- **Language support**: Multiple languages (default: en-US)
- **Additional options**: Emphasis, Q&A segments, custom instructions
- **Read mode**: Direct text reading for script input type

Check out the audio samples at [podfeed.ai](https://podfeed.ai) to see results for different settings.

## Usage Examples

### Simple Text-to-Audio

1. Select **Generate Audio** operation
2. Choose **Text** input type
3. Enter your text content
4. Select **Monologue** mode
5. Choose a voice (e.g., "gemini-puck")
6. Configure content settings
7. Execute the node

### Website-to-Podcast

1. Select **Generate Audio** operation
2. Choose **URL** input type
3. Enter the website URL
4. Select **Dialogue** mode for conversation-style output
5. Choose host and co-host voices
6. Add custom instructions in Additional Fields
7. Execute the node

### Polling for Task Completion

Audio generation is asynchronous. Build a polling workflow using n8n's standard loop pattern to monitor task completion.

**Workflow Pattern:**

This pattern uses n8n's ["loop until a condition is met"](https://docs.n8n.io/flow-logic/looping/#loop-until-a-condition-is-met) approach:

1. **Podfeed: Generate Audio**
   - Returns `taskId` and initial status

2. **Wait Node** (n8n core node)
   - Set wait time (e.g., 30-60 seconds)
   - This prevents overloading the API with requests

3. **Podfeed: Get Task Status**
   - Use expression: `{{ $('Podfeed').item.json.task_id }}`
   - Returns status object with `status` field: `'in_progress'`, `'completed'`, or `'failed'`

4. **IF Node** (n8n core node)
   - **Condition**: `{{ $json.status === 'completed' || $json.status === 'failed' }}`
   - **TRUE branch**: Task is done (either success or failure) → Exit loop
   - **FALSE branch**: Task still in progress → **Wire this output back to the Wait node (step 2)**

   💡 The loop is created by connecting the IF node's FALSE output wire back to the Wait node's input.

5. **Handle Result** (after exiting the loop)
   - Add another IF node or Switch node to handle `completed` vs `failed`
   - On success: Use `audio_id` from response to get audio details or URL
   - On failure: Handle error appropriately

**Example n8n Workflow:**
For a visual example of this loop pattern, see the [official n8n loop workflow example](https://n8n.io/workflows/1130).

## API Compatibility

This node implements the full Podfeed API functionality, equivalent to the [Python SDK](https://github.com/vmehmeri/podfeed-sdk-python).

## Support

For issues with this n8n node, please report them on the [GitHub repository](https://github.com/vmehmeri/podfeed-n8n-node).

For Podfeed API support, contact: support@podfeed.ai

## License

MIT
