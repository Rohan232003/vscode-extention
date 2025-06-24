import * as vscode from 'vscode';

/**
 * @returns An API object that allows the webview to communicate with the extension host.
 *
 * Use this API object to send messages from the webview to the extension host, and to
 * receive messages from the extension host.
 *
 * ```ts
 * const vscode = acquireVsCodeApi();
 * vscode.postMessage({ command: 'alert', text: 'Hello from the webview!' });
 * window.addEventListener('message', event => {
 *   const message = event.data; // The JSON data our extension sent
 *   switch (message.command) {
 *     case 'refactor':
 *       // Do something
 *       break;
 *   }
 * });
 * ```
 */
declare function acquireVsCodeApi(): {
  /**
   * Post a message to the extension host.
   *
   * @param message The message to post.
   */
  postMessage(message: any): void;

  /**
   * Enable state persistence for this webview.
   *
   * @param newState Object to persist.
   * @returns The new state.
   */
  setState(newState: any): any;

  /**
   * Get the persisted state for this webview.
   *
   * @returns The persisted state.
   */
  getState(): any;
};