# selenium-webdriver-message-port

[`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) for passing bidirectional messages between WebDriver host and browser.

## Background

[`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) is the JavaScript standard communication channel. We are bringing `MessagePort` to [`selenium-webdriver`](https://npmjs.com/package/selenium-webdriver) by leveraging `executeScript` calls.

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

```js
import { setup } from '@onting/selenium-webdriver-message-port/host';

const { messagePort, poll } = setup(webDriver);

messagePort.addEventListener('message', ({ data }) => {
  // Will print "Hello from browser!"
  console.log(data);
});

// start() will uncork events sent from the browser side.
messagePort.start();

messagePort.postMessage('Hello from host!');

// poll() will receive pending messages posted from the browser.
await poll();
```

## Behaviors

### What can I do with `MessagePort`?

`MessagePort` is an asynchronous bidirectional communication channel between two discrete JavaScript VMs.

[`message-port-rpc`](https://npmjs.com/package/message-port-rpc) leverage `MessagePort` and turn any functions into remoting functions (RPC). Client calling the RPC function will have the arguments passed to the server via `MessagePort`. And the server returning the RPC function will have the return value pass to the client.

### What transferables are supported?

We currently support transferring `MessagePort` only.

### Why are my tests lingering?

At the end of the test, call `messagePort.close()` to shut down. If you have transferred additional `MessagePort`, also call `close()` on them.

### Why am I not receiving messages on host side?

Call `poll()` when your host code is idle. The `poll()` call will retrieve all pending messages from the browser and send it to the port on the host side.

### Why am I not receiving the first few messages?

Call `MessagePort.start()` only after all `MessagePort.addEventListener()` are registered. The `start()` will uncork the `MessagePort` and messages will flow through.

If event listeners are not registered before `start()`, messages sent before the registration will be lost.

### Why `undefined` values are not being sent?

`executeScript()` modifies the value being passed, similar to how `JSON.parse` and `JSON.stringify` works.

Consider using `JSON.stringify` or [structured clone algorithm](https://www.npmjs.com/search?q=structured%20clone%20algorithm) to preserve values that are not safe to pass across the WebDriver serialization context.

### Do you support WebDriver BiDi Protocol?

We do not support the new BiDi protocol yet but this is on our road map. Using BiDi could potentially simplify some userland code.

## Contributions

Like us? [Star](https://github.com/teamonting/selenium-webdriver-message-port/stargazers) us.

Want to make it better? [File](https://github.com/teamonting/selenium-webdriver-message-port/issues) us an issue.

Don't like something you see? [Submit](https://github.com/teamonting/selenium-webdriver-message-port/pulls) a pull request.
