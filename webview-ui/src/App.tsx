import React, { useState, useEffect, useRef } from 'react';
/// <reference path="./vscode.d.ts" />
import { marked } from 'marked'; 
import hljs from 'highlight.js'; 
import 'highlight.js/styles/github.css'; 


// Declare a variable outside the component to track listener status
let isMessageListenerAdded = false;

// Declare the vscode API
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

interface Message {
  text: string;
  isUser: boolean;
}

interface AttachedFile {
  fileName: string;
  content: string;
}

// Define custom renderer
class CustomRenderer extends marked.Renderer {
  code(code: string, lang: string | undefined, escaped: boolean): string {
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    const highlightedCode = hljs.highlight(code, { language }).value;
   
    return `
      <div class="code-block-container">
        <button class="insert-code-button" data-code="${encodeURIComponent(code)}">Insert Code</button>
        <pre><code class="hljs language-${language}">${highlightedCode}</code></pre>
      </div>
    `;
  }
}

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  renderer: new CustomRenderer(),
  pedantic: false,
  gfm: true,
  breaks: true,
});


function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const listenerInitialized = useRef(false);

useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;
     console.log('Message received:', message);

    switch (message.command) {
      case 'addMessage':
        console.log("addMessage received:", message.text);

        setMessages(current => {
          const exists = current.some(msg => msg.text === message.text && msg.isUser === message.isUser);
          return exists ? current : [...current, { text: message.text, isUser: message.isUser }];
        });
        break;

      case 'fileSelected':
        console.log('📎 File selected:', message.fileName);
        setAttachedFiles(current => [...current, { fileName: message.fileName, content: message.content }]);
        setInput(input => input.replace(/@$/, ''));
        break;

      case 'error':
        console.error(' Error:', message.message);
        setMessages(current => [...current, { text: `Error: ${message.message}`, isUser: false }]);
        break;
    }
  };

  if (!listenerInitialized.current) {
    window.addEventListener('message', handleMessage);
    listenerInitialized.current = true;
  }

  return () => {
    window.removeEventListener('message', handleMessage);
    listenerInitialized.current = false;
    console.log('🧹 Cleaned up listener');
  };
}, []);


// Empty dependency array means this effect runs once on mount and cleans up on unmount

 useEffect(() => {
   const messagesContainer = document.getElementById('messages-container');
   if (!messagesContainer) return;

   const handleInsertClick = (event: MouseEvent) => {
     const target = event.target as HTMLElement;
     if (target.classList.contains('insert-code-button')) {
       const code = decodeURIComponent(target.dataset.code || '');
       vscode.postMessage({
         command: 'insertCode',
         code: code
       });
     }
   };

   messagesContainer.addEventListener('click', handleInsertClick);

   return () => {
     messagesContainer.removeEventListener('click', handleInsertClick);
   };
 }, []); 


 const handleSend = () => {
    if (input.trim() || attachedFiles.length > 0) {
      const userMessageText = input.trim();
      let fullMessage = userMessageText;

      // Append attached file info to the message
      attachedFiles.forEach(file => {
        fullMessage += `\n\nAttached File: ${file.fileName}\n\`\`\`\n${file.content}\n\`\`\``;
      });

      // Add user message (including attachments) to state immediately
      setMessages([...messages, { text: fullMessage, isUser: true }]);

      // Send message and attachments to extension backend
      vscode.postMessage({
        command: 'sendMessage',
        text: userMessageText, // Send original input text
        attachedFiles: attachedFiles // Send attached files array
      });

      // Clear input and attached files
      setInput('');
      setAttachedFiles([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); // Prevent default newline behavior
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    if (newValue.endsWith('@')) {
      // Send a message to the extension to trigger file selection
      vscode.postMessage({ command: 'startFileSelection' });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachedFiles(currentFiles => currentFiles.filter((_, i) => i !== index));
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '10px' }}>
      <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }} id="messages-container">
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.isUser ? 'right' : 'left', margin: '5px 0' }}>
            <div style={{
              display: 'inline-block',
              padding: '8px',
              borderRadius: '5px',
              backgroundColor: msg.isUser ? '#dcf8c6' : '#000000',
              color: msg.isUser ? 'black' : 'white',
              whiteSpace: 'pre-wrap', // Preserve whitespace and line breaks
              maxWidth: '80%', // Limit message width
              wordBreak: 'break-word' // Break long words
            }}>
              {/* Render message content */}
              {msg.isUser ? (
                <div dangerouslySetInnerHTML={{ __html: msg.text }}></div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}></div>
              )}
            </div>
          </div>
        ))}
      </div>
      {attachedFiles.length > 0 && (
        <div style={{ marginTop: '10px', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <strong>Attached Files:</strong>
          {attachedFiles.map((file, index) => (
            <span key={index} style={{ marginLeft: '10px', backgroundColor: '#e9e9eb',color: '#0a0a0a', padding: '3px 8px', borderRadius: '3px' }}>
              {file.fileName}
              <button
                style={{ marginLeft: '5px', cursor: 'pointer', border: 'none', background: 'none', color: 'red' }}
                onClick={() => handleRemoveAttachment(index)}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', marginTop: '10px' }}>
        <input
          type="text"
          style={{ flexGrow: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message or use @ to attach files..."
        />
        <button
          style={{ marginLeft: '10px', padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;