import { StandardHTML5Adapter } from './StandardHTML5Adapter';

export class NetflixAdapter extends StandardHTML5Adapter {
  constructor(onAction: (action: string, time: number) => void) {
    super(onAction);
    this.injectNetflixBridge();
    this.listenToBridge();
  }

  // We override attachListeners because standard events are blocked or unreliable on Netflix
  attachListeners() {
    // Wait for the bridge to initialize
  }

  injectNetflixBridge() {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        console.log('Netflix Bridge Injected');
        
        function getPlayer() {
          try {
            const videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
            const sessionId = videoPlayer.getAllPlayerSessionIds()[0];
            return videoPlayer.getVideoPlayerBySessionId(sessionId);
          } catch (e) {
            return null;
          }
        }

        let lastState = '';
        
        // Polling state since netflix events can be tricky to hook
        setInterval(() => {
          const player = getPlayer();
          if (!player) return;
          
          const isPaused = player.isPaused();
          const time = player.getCurrentTime();
          const currentState = isPaused ? 'pause' : 'play';
          
          if (currentState !== lastState) {
            lastState = currentState;
            window.postMessage({ type: 'FROM_NETFLIX', action: currentState, time }, '*');
          }
        }, 500);

        window.addEventListener('message', (event) => {
          if (event.source !== window || !event.data || event.data.type !== 'TO_NETFLIX') return;
          
          const player = getPlayer();
          if (!player) return;
          
          const { action, time } = event.data;
          
          if (action === 'play') {
            player.seek(time);
            player.play();
          } else if (action === 'pause') {
            player.seek(time);
            player.pause();
          } else if (action === 'seeked') {
            player.seek(time);
          }
        });
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  listenToBridge() {
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data || event.data.type !== 'FROM_NETFLIX') return;
      
      const { action, time } = event.data;
      if (this.isHost) {
        this.onAction(action, time);
      }
    });
  }

  public applyRemoteCommand(action: string, time: number) {
    window.postMessage({ type: 'TO_NETFLIX', action, time }, '*');
  }
}
