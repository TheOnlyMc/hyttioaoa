import * as vscode from 'vscode';

const VIEW_ID = 'hyttioaoa.view';
const SHOW_UNTIL_KEY = 'hyttioaoa.showWorkingUntilMs';

export function activate(context: vscode.ExtensionContext) {
  const provider = new HyttioaoaViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  // Optional: keep the command around if you use keybindings
  const reloadCmd = vscode.commands.registerCommand('hyttioaoa.reload', async () => {
    await context.globalState.update(SHOW_UNTIL_KEY, Date.now() + 20_000);
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  });
  context.subscriptions.push(reloadCmd);
}

class HyttioaoaViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly ctx: vscode.ExtensionContext) { }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    const { webview } = webviewView;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.ctx.extensionUri, 'media')]
    };

    const memeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.ctx.extensionUri, 'media', 'have-you-tried.jpg')
    );
    const workingUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.ctx.extensionUri, 'media', 'working.jpg')
    );

    // Check if we should show "working" after a reload
    const showUntil = this.ctx.globalState.get<number>(SHOW_UNTIL_KEY, 0);
    const remainingMs = Math.max(0, showUntil - Date.now());
    // Clear the flag so it doesn't persist across future reloads
    void this.ctx.globalState.update(SHOW_UNTIL_KEY, 0);

    webview.html = this.getHtml(webview, memeUri, workingUri, remainingMs);

    webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === 'reload') {
        await this.ctx.globalState.update(SHOW_UNTIL_KEY, Date.now() + 20_000);
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    });
  }

  private getHtml(webview: vscode.Webview, memeUri: vscode.Uri, workingUri: vscode.Uri, remainingMs: number) {
    const cspSource = webview.cspSource;
    const nonce = getNonce();
    const showWorking = remainingMs > 0;

    return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${cspSource} https: data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HYTTIOAOA?</title>
  <style>
    html, body { height:100%; margin:0; padding:0; display:grid; place-items:center; background:#1e1e1e; }
    .card { width:100%; padding:8px; box-sizing:border-box; }
    img {
      width:100%;
      border-radius:8px;
      user-select:none;
      box-shadow:0 6px 18px rgba(0,0,0,.35);
      ${showWorking ? "pointer-events:none; cursor:default; opacity:0.95;" : "cursor:pointer;"}
    }
    .hint{
      color:#ccc; font-weight:700; font-size: clamp(14px, 1.6vw, 16px);
      line-height:1.4; margin-top:8px; text-align:center; opacity:.9; letter-spacing:.2px;
    }
  </style>
</head>
<body>
  <div class="card">
    <img id="meme" src="${showWorking ? workingUri : memeUri}" alt="HYTTIOAOA?" />
    <div class="hint">${showWorking ? '…reloading just happened — give it a sec' : 'Click the image to reload VS Code • HYTTIOAOA?'}</div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const img = document.getElementById('meme');
    const remaining = ${remainingMs};

    // Wenn wir im "working"-Modus sind: NICHT klickbar, nur nach Ablauf zurückwechseln
    if (remaining > 0) {
      setTimeout(() => {
        img.style.pointerEvents = 'auto';
        img.style.cursor = 'pointer';
        img.style.opacity = '';
        img.src = "${memeUri}";
        const hint = document.querySelector('.hint');
        if (hint) hint.textContent = "Click the image to reload VS Code • HYTTIOAOA?";
        // Ab jetzt erst Klick erlauben
        img.addEventListener('click', onClickOnce, { once: true });
      }, remaining);
    } else {
      img.addEventListener('click', onClickOnce, { once: true });
    }

    function onClickOnce() {
      // „once:true“ verhindert Doppeltrigger in der gleichen Session
      vscode.postMessage({ type: 'reload' });
    }
  </script>
</body>
</html>`;
  }
}

function getNonce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let val = '';
  for (let i = 0; i < 32; i++) val += chars.charAt(Math.floor(Math.random() * chars.length));
  return val;
}
