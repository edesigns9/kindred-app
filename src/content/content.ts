import { StandardHTML5Adapter } from './adapters/StandardHTML5Adapter';
import { NetflixAdapter } from './adapters/NetflixAdapter';

console.log('Streaming Sync content script loaded on:', window.location.hostname);

let adapter: StandardHTML5Adapter;

const handleHostAction = (action: string, time: number) => {
  console.log(`Sending host action to background: ${action} at time ${time}`);
  chrome.runtime.sendMessage({
    type: 'SYNC_EVENT',
    payload: { action, time }
  });
};

if (window.location.hostname.includes('netflix.com')) {
  console.log('Using Netflix Adapter');
  adapter = new NetflixAdapter(handleHostAction);
} else {
  console.log('Using Standard HTML5 Adapter');
  adapter = new StandardHTML5Adapter(handleHostAction);
}

// Listen for messages from background script/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_ROOM') {
    adapter.setHostState(message.payload.isHost, message.payload.roomId);
    sendResponse({ success: true });
  } else if (message.type === 'REMOTE_COMMAND' && !message.payload.isHost) {
    // Only viewers should apply remote commands
    // We check via adapter.isHost, but since adapter fields are protected, we can expose a getter 
    // or just assume we only receive this when viewer. 
    // Wait, the background script only sends REMOTE_COMMAND to viewers.
    adapter.applyRemoteCommand(message.payload.action, message.payload.time);
  }
});
