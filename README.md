# selenium-webdriver-message-port

[`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) for passing bidirectional messages between WebDriver host and browser.

## Background

[`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) is the JavaScript standard communication channel. We are bringing `MessagePort` to [`selenium-webdriver`](https://npmjs.com/package/selenium-webdriver) by leveraging [`ChannelValue`](https://www.w3.org/TR/webdriver-bidi/#cddl-type-scriptchannelvalue) and [`callFunctionInRealm()`](https://www.w3.org/TR/webdriver-bidi/#command-script-callFunction). And optionally, [`executeScript`](https://www.w3.org/TR/webdriver1/#execute-script). Cyclic objects are supported through limited [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) implementation.

This enables libraries that use `MessagePort` to function across the host and the browser, such as [`message-port-rpc`](https://npmjs.com/package/message-port-rpc).

## How to use

In the HTML page:

```html
<script>
  import { messagePort } from 'https://cdn.jsdelivr.net/npm/@onting/selenium-webdriver-message-port/dist/browser.js';

  messagePort.addEventListener('message', ({ data }) => {
    // Will print "Hello from host!"
    console.log(data);
  });

  // start() will uncork events sent from the host side.
  messagePort.start();

  messagePort.postMessage('Hello from browser!');
</script>
```

In the host:

<details>
<summary>Expand to see code to get <code>ScriptManager</code> and <code>RealmInfo</code></summary>

```ts
import { Browser, Builder } from 'selenium-webdriver';

const webDriver = await new Builder().forBrowser(Browser.CHROME).build();

await webDriver.navigate().to('https://github.com/');

const browsingContextId = await webDriver.getWindowHandle();
const scriptManager = await getScriptManagerInstance(browsingContextId, webDriver);
const [realmInfo] = await scriptManager.getRealmsByType('window');
```
</details>

```js
import { viaBiDi } from '@onting/selenium-webdriver-message-port/host';

const { messagePort } = await viaBiDi(scriptManager, { realmId: realmInfo!.realmId });

messagePort.addEventListener('message', ({ data }) => {
  // Will print "Hello from browser!"
  console.log(data);
});

// start() will uncork events sent from the browser side.
messagePort.start();

messagePort.postMessage('Hello from host!');
```

## API

```ts
function viaBiDi(scriptManager: ScriptManager, options: BiDiOptions): Promise<{
  readonly messagePort: MessagePort;
}>;

function viaExecuteScript(webDriver: WebDriver): {
  readonly messagePort: MessagePort;
  readonly poll: () => Promise<void>;
};
```

## Behaviors

### What can I do with `MessagePort`?

`MessagePort` is an asynchronous bidirectional communication channel between two discrete JavaScript processes.

[`message-port-rpc`](https://npmjs.com/package/message-port-rpc) leverage `MessagePort` and turn any function into remoting function (RPC). Client calling the RPC function will have the arguments transferred to the server via `MessagePort`. And the server returning the RPC function will have the return value transferred back to the client.

<details>
<summary>Expand to see the sample code</summary>

```html
<script>
  import { messagePort } from 'https://cdn.jsdelivr.net/npm/@onting/selenium-webdriver-message-port/dist/browser.js';
  import { messagePortRPC } from 'https://esm.sh/message-port-rpc';

  messagePortRPC(messagePort, message => console.log(message));
</script>
```

```ts
import { setup } from '@onting/selenium-webdriver-message-port/host';
import { messagePortRPC } from 'https://esm.sh/message-port-rpc';

const { messagePort } = await viaBiDi(scriptManager, { realmId: realmInfo!.realmId });

const log = messagePortRPC(messagePort);

await log('Hello from host!');
```
</details>

### What can be transferred across the `MessagePort`?

Data are marshalled using [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) by [@ungap/structured-clone](https://www.npmjs.com/package/@ungap/structured-clone) package. In addition, we also support transferring `MessagePort`.

### Why are my tests lingering?

At the end of the test, call `messagePort.close()` to shut down. If you have transferred additional `MessagePort`, also call `close()` on them.

### My setup does not support WebDriver BiDi

You can use `viaExecuteScript()` instead. However there are some limitations:

- Call `poll()` from time to time to fetch messages from browser to the host
   - Similar to `executeScript()`, special considerations must be made while calling `poll()`. WebDriver is single-threaded, all commands are processed serially. You should not call `poll()` while other WebDriver commands are being processed.
- `executeScript()` is only supported in the window realm and not in worker realms

```js
import { viaExecuteScript } from '@onting/selenium-webdriver-message-port/host';

const webDriver = await new Builder().forBrowser(Browser.CHROME).build();

await webDriver.navigate().to('https://github.com/');

const { messagePort, poll } = viaExecuteScript(webDriver);

messagePort.addEventListener('message', ({ data }) => {
  // Will print "Hello from browser!"
  console.log(data);
});

// start() will uncork events sent from the browser side.
messagePort.start();

messagePort.postMessage('Hello from host!');

// Call poll() to fetch messages from browser.
await poll();
```

### Why am I not receiving the first few messages?

Call `MessagePort.start()` only after all `MessagePort.addEventListener()` are registered. The `start()` will uncork the `MessagePort` and messages will flow through.

If event listeners are not registered before `start()`, messages sent before the registration will be lost.

### Why the `MessagePort` cannot be installed automatically via `addPreloadScript`?

Preloaded scripts are running in a sandboxed realm, which the `window` object is virtually separated from the window realm. Modifying the `window` object in the sandbox realm will not affect the `window` object on the page.

### Why `viaBiDi` is demanding `ScriptManager` but not `WebDriver`?

Although we can derive `ScriptManager` from `WebDriver`, we prefer `ScriptManager` to be passed in.

`ScriptManager` requires lifecycle management. When tearing down, `ScriptManager.close()` must be called to release allocated resources.

We prefer developers to control object lifecycle themselves where possible.

### How are we using this package?

We pair with [`message-port-rpc`](https://npmjs.com/package/message-port-rpc) to enable the page to call RPC functions on the host. For example, the page can call `webDriver.takeScreenshot()` to take a screenshot of the page.

Traditionally, test suite are written in Java/Node.js, it launch the browser navigated to the HTML page, then perform some test steps on it. This is the de facto standard for testing apps.

For component developers, the system-under-test (SUT) is not the HTML page, but a component hosted on the page. That means, test steps written in Java/Node.js will need to go through the page before hitting the component. This extra hop is hurting development experience (DX).

Instead, we are writing test steps directly on the HTML page hosting the SUT component, with WebDriver exposed as an remoting object on the page. During development, we run the test on a long-running local browser and press <kbd>F5</kbd> to rerun the test. The test result is being visualized in real-time. This DX is smoother than the traditional setup.

## Contributions

Like us? [Star](https://github.com/teamonting/selenium-webdriver-message-port/stargazers) us.

Want to make it better? [File](https://github.com/teamonting/selenium-webdriver-message-port/issues) us an issue.

Don't like something you see? [Submit](https://github.com/teamonting/selenium-webdriver-message-port/pulls) a pull request.
