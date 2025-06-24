import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import GoogleGenerativeAI

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('chat-extension: activate function started'); // Added log

	
	console.log('Congratulations, your extension "chat-extension" is now active!');

	
	// Register the 'helloWorld' command (existing)
	let helloWorldDisposable = vscode.commands.registerCommand('chat-extension.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from chat-extension!');
	});

	// Register the new 'startChat' command
	let startChatDisposable = vscode.commands.registerCommand('chat-extension.startChat', () => {
		createChatViewPanel(context); // Pass the context to access secrets
	});

	// Register command to set OpenAI API key
	let setApiKeyDisposable = vscode.commands.registerCommand('chat-extension.setGeminiKey', async () => {
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your Gemini API Key',
			ignoreFocusOut: true,
			password: true // Mask the input
		});

		if (apiKey) {
			await context.secrets.store('geminiApiKey', apiKey);
			vscode.window.showInformationMessage('Gemini API Key stored securely.');
		} else {
			vscode.window.showWarningMessage('Gemini API Key not set.');
		}
	});


	context.subscriptions.push(helloWorldDisposable, startChatDisposable, setApiKeyDisposable);
}

async function createChatViewPanel(context: vscode.ExtensionContext) { // Accept context here
	const panel = vscode.window.createWebviewPanel(
		'chatView', 
		'Chat Assistant', 
		vscode.ViewColumn.Beside, 
		{
			
			enableScripts: true,

			// And restrict the webview to only loading content from our extension's `media` directory.
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media'), vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'dist')]
		}
	);

	// Set the HTML content for the webview
	panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

	// Retrieve API key from secret storage
	const apiKey = await context.secrets.get('geminiApiKey');

	let genAI: GoogleGenerativeAI | undefined;

	if (apiKey) {
		// Initialize Gemini client
		genAI = new GoogleGenerativeAI(apiKey);
	} else {
		vscode.window.showWarningMessage('Gemini API Key not found. Please set it using the "Set Gemini API Key" command.');
	}


	// Handle messages from the webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'sendMessage':
					console.log(`Message from webview: ${message.text}`);
					console.log('Attached files:', message.attachedFiles);

					if (!genAI) {
						panel.webview.postMessage({ command: 'addMessage', text: "Error: Gemini API Key not set. Please set it using the 'Set Gemini API Key' command.", isUser: false });
						return;
					}

					let prompt = message.text;

					// Append attached file content to the prompt
					if (message.attachedFiles && message.attachedFiles.length > 0) {
						message.attachedFiles.forEach((file: { fileName: string; content: string }) => {
							prompt += `\n\nFile: ${file.fileName}\n\`\`\`\n${file.content}\n\`\`\``;
						});
					}

					try {
						// Call Gemini API
						const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"}); // Use a suitable Gemini model
						const chat = model.startChat({
							history: [], // You might want to add conversation history here
							generationConfig: {
								maxOutputTokens: 1000, // Adjust as needed
							},
						});

						const result = await chat.sendMessage(prompt);
						const aiResponse =  result.response.text();


						if (aiResponse) {
							// Send AI response back to the webview
							console.log("📤 Sending AI response to webview once:", aiResponse);
							panel.webview.postMessage({ command: 'addMessage', text: aiResponse, isUser: false });
						} else {
							panel.webview.postMessage({ command: 'addMessage', text: "Sorry, I couldn't generate a response.", isUser: false });
						}

					} catch (error: any) {
						console.error('Error calling Gemini API:', error);
						panel.webview.postMessage({ command: 'addMessage', text: `Error: Failed to get response from AI. ${error.message}`, isUser: false });
					}

					return;
				case 'startFileSelection':
					console.log('Received startFileSelection command');
					const fileUri = await vscode.window.showOpenDialog({
						canSelectFiles: true,
						canSelectFolders: false,
						canSelectMany: false,
						openLabel: 'Select file to attach'
					});

					if (fileUri && fileUri[0]) {
						const selectedFile = fileUri[0];
						console.log(`Selected file: ${selectedFile.fsPath}`);

						try {
							// Read the file content
							const fileContentUint8 = await vscode.workspace.fs.readFile(selectedFile);
							const fileContent = new TextDecoder().decode(fileContentUint8); // Decode Uint8Array to string

							// Send the file name and content back to the webview
							panel.webview.postMessage({
								command: 'fileSelected',
								fileName: path.basename(selectedFile.fsPath),
								content: fileContent
							});

						} catch (error) {
							console.error('Error reading file:', error);
							// Optionally send an error message back to the webview
							panel.webview.postMessage({
								command: 'error',
								message: `Failed to read file: ${path.basename(selectedFile.fsPath)}`
							});
						}
					}
					return;
				case 'insertCode':
					console.log('Received insertCode command');
					const codeToInsert = message.code;
					const editor = vscode.window.activeTextEditor;

					if (editor) {
						editor.edit(editBuilder => {
							const selection = editor.selection;
							// Replace the selection or insert at the cursor
							editBuilder.replace(selection, codeToInsert);
						}).then(success => {
							if (success) {
								console.log('Code inserted successfully.');
								// Optionally send a success message back to the webview
								// panel.webview.postMessage({ command: 'info', message: 'Code inserted.' });
							} else {
								console.error('Failed to insert code.');
								// Optionally send an error message back to the webview
								panel.webview.postMessage({ command: 'error', message: 'Failed to insert code into editor.' });
							}
						});
					} else {
						console.error('No active text editor found.');
						panel.webview.postMessage({ command: 'error', message: 'No active text editor found to insert code.' });
					}
					return;
			}
		},
		undefined,
		[] 
	);
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
	// Get the path to the React build files
	const reactAppPath = path.join(extensionUri.fsPath, 'webview-ui', 'dist');
	const htmlFile = path.join(reactAppPath, 'index.html');

	let htmlContent = fs.readFileSync(htmlFile, 'utf-8');

	// Get the URI for the bundled JavaScript file
	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist', 'bundle.js'));

	// Inject the script into the HTML
	htmlContent = htmlContent.replace('</body>', `  <script src="${scriptUri}"></script>\n</body>`);

	return htmlContent;
}

// This method is called when your extension is deactivated
export function deactivate() {}
