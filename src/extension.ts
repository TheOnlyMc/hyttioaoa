import * as vscode from 'vscode';

const VIEW_ID = 'hyttioaoa.view';

export function activate(context: vscode.ExtensionContext) {
  // Command: direkter Reload (für Keybindings etc.)
  const reloadCmd = vscode.commands.registerCommand('hyttioaoa.reload', () => {
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  });
  context.subscriptions.push(reloadCmd);

  // WebviewViewProvider registrieren
  const provider = new HyttioaoaViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
}

export function deactivate() {}

class HyttioaoaViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly ctx: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    const { webview } = webviewView;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.ctx.extensionUri, 'media')]
    };

    // Bild aus /media referenzieren
    const imgUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.ctx.extensionUri, 'media', 'have-you-tried.jpg')
    );

    webview.html = this.getHtml(webview, imgUri);

    // Nachrichten aus der Webview entgegennehmen
    webview.onDidReceiveMessage((msg) => {
      if (msg?.type === 'reload') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    });
  }

  private getHtml(webview: vscode.Webview, imgUri: vscode.Uri) {
    const cspSource = webview.cspSource;
    const nonce = getNonce();

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; img-src ${cspSource} https: data:;
                       script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>HYTTIOAOA?</title>
        <style>
          html, body {
            height: 100%;
            padding: 0; margin: 0;
            display: grid; place-items: center;
            background: #1e1e1e;
          }
          .card {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
          }
          img {
            width: 100%;
            border-radius: 8px;
            cursor: pointer;
            user-select: none;
            box-shadow: 0 6px 18px rgba(0,0,0,.35);
          }
          .hint {
            color: #ccc;
            font: 12px/1.4 system-ui, sans-serif;
            margin-top: 6px;
            text-align: center;
            opacity: .8;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <img id="meme" src="${imgUri}" alt="Have you tried turning it off and on again?" title="Click to reload VS Code"/>
          <div class="hint">Click the image to reload VS Code</div>
        </div>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          document.getElementById('meme')?.addEventListener('click', () => {
            vscode.postMessage({ type: 'reload' });
          });
        </script>
      </body>
      </html>
    `;
  }
}

function getNonce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let val = '';
  for (let i = 0; i < 32; i++) val += chars.charAt(Math.floor(Math.random() * chars.length));
  return val;
}
