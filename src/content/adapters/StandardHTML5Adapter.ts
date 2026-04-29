export class StandardHTML5Adapter {
  protected video: HTMLVideoElement | null = null;
  protected isHost: boolean = false;
  protected roomId: string | null = null;
  protected onAction: (action: string, time: number) => void;

  constructor(onAction: (action: string, time: number) => void) {
    this.onAction = onAction;
    this.init();
  }

  async init() {
    this.findVideoElement();
    if (!this.video) {
        console.log('No video element found initially. Observing...');
        const observer = new MutationObserver(() => {
          this.findVideoElement();
          if (this.video) {
            observer.disconnect();
            this.attachListeners();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        this.attachListeners();
    }
  }

  findVideoElement() {
    const video = document.querySelector('video');
    if (video) {
      this.video = video;
      console.log('Video element found:', video);
    }
  }

  attachListeners() {
    if (!this.video) return;

    // Use capturing phase or standard to ensure we catch it
    this.video.addEventListener('play', () => this.handleHostAction('play'));
    this.video.addEventListener('pause', () => this.handleHostAction('pause'));
    this.video.addEventListener('seeked', () => this.handleHostAction('seeked'));
  }

  handleHostAction(action: string) {
    if (!this.isHost || !this.video) return;
    this.onAction(action, this.video.currentTime);
  }

  public setHostState(isHost: boolean, roomId: string) {
    this.isHost = isHost;
    this.roomId = roomId;
    console.log(`Adapter state set: isHost=${isHost}`);
    
    if (!isHost) {
      this.checkAutoplayPermission();
    }
  }

  private checkAutoplayPermission() {
    // If the browser hasn't had a user interaction, play() might fail.
    // We show a subtle overlay asking the user to click.
    if (document.getElementById('kindred-sync-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'kindred-sync-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: rgba(99, 102, 241, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-family: sans-serif;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: kindred-slide-in 0.5s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes kindred-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    overlay.innerHTML = `
      <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e;"></div>
      <span>Click to Sync Audio/Video</span>
    `;

    overlay.onclick = () => {
      overlay.remove();
      // An empty play/pause to "unlock" audio for the session
      if (this.video) {
        const dummy = this.video.play();
        if (dummy !== undefined) {
          dummy.then(() => {
            if (this.video?.paused) this.video.pause();
          }).catch(() => {});
        }
      }
    };

    document.body.appendChild(overlay);
    
    // Auto-remove if user clicks anywhere else on the page too
    const removeOnAnyClick = () => {
        overlay.remove();
        document.removeEventListener('click', removeOnAnyClick);
    };
    document.addEventListener('click', removeOnAnyClick);
  }

  public applyRemoteCommand(action: string, time: number) {
    if (!this.video) return;
    
    if (action === 'play') {
      if (Math.abs(this.video.currentTime - time) > 2) {
         this.video.currentTime = time;
      }
      this.video.play().catch(console.error);
    } else if (action === 'pause') {
      if (Math.abs(this.video.currentTime - time) > 2) {
        this.video.currentTime = time;
      }
      this.video.pause();
    } else if (action === 'seeked') {
      this.video.currentTime = time;
    }
  }
}
