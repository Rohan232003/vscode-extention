# Chat Extension

A Visual Studio Code extension that provides a chat interface powered by the Google Gemini API.

## Features

*   Interactive chat interface within a VS Code webview.
*   Send messages and attached files to a configured Gemini model.
*   Receive and display AI responses with syntax highlighting for code blocks.
*   Insert AI-generated code directly into your active editor.
*   Securely store your Gemini API key using VS Code's secret storage.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Rohan232003/vscode-extention.git
    cd chat-extension
    ```


2.  **Install dependencies:**
    ```bash
    npm install
    cd webview-ui
    npm install
    cd ..
    ```

3.  **Build the webview:**
    ```bash
    npm run build
    ```

4.  **Set your Gemini API Key:**
    *   Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
    *   Search for and run the command "Set Gemini API Key".
    *   Enter your API key in the input box. Your key will be stored securely.

## Usage

1.  **Start the chat:**
    *   Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
    *   Search for and run the command "Start Chat".
    *   A chat panel will open, usually beside your editor.

2.  **Send messages:**
    *   Type your message in the input box at the bottom of the chat panel.
    *   Press Enter or click the "Send" button.

3.  **Attach files:**
    *   Type `@` in the input box to trigger file selection.
    *   Select the file you want to attach. Its content will be included with your message.

4.  **Insert Code:**
    *   When the AI responds with a code block, an "Insert Code" button will appear next to it.
    *   Click the button to insert the code into your active text editor at the cursor position or replacing the current selection.

## Project Structure

*   `src/extension.ts`: The main extension code, handles commands, webview creation, and communication with the Gemini API.
*   `webview-ui/`: Contains the source code for the webview's user interface (a React application).
    *   `webview-ui/src/App.tsx`: The main React component for the chat interface.
    *   `webview-ui/src/index.html`: The HTML file loaded by the webview.
    *   `webview-ui/src/index.tsx`: The entry point for the React application.




