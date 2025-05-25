// Security and anti-debugging utilities
export class SecurityManager {
  private static isInitialized = false;
  private static originalConsole: any = {};
  private static originalFetch: any;
  private static originalXHR: any;

  public static initialize(): void {
    if (this.isInitialized) return;
    
    this.overrideConsole();
    this.disableManualRequests();
    this.addAntiDebugging();
    
    this.isInitialized = true;
    console.log('🔒 Security Manager đã được khởi tạo');
  }

  private static overrideConsole(): void {
    // Backup original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
      clear: console.clear,
      table: console.table,
      group: console.group,
      groupEnd: console.groupEnd
    };

    // Override console methods with custom messages
    console.log = (...args: any[]) => {
      this.originalConsole.log(
        '%c🚫 Truy cập bị từ chối - Access Denied',
        'color: red; font-size: 16px; font-weight: bold;'
      );
      this.originalConsole.log(
        '%cWebsite này được bảo vệ bởi Security Manager',
        'color: orange; font-size: 14px;'
      );
    };

    console.warn = (...args: any[]) => {
      this.originalConsole.warn(
        '%c⚠️ Cảnh báo: Không được phép debug website này',
        'color: yellow; font-size: 14px; font-weight: bold;'
      );
    };

    console.error = (...args: any[]) => {
      this.originalConsole.error(
        '%c❌ Lỗi: Hành động không được phép',
        'color: red; font-size: 14px; font-weight: bold;'
      );
    };

    console.info = console.log;
    console.debug = console.log;
    console.clear = () => {
      this.originalConsole.clear();
      this.showSecurityBanner();
    };

    // Show security banner on console open
    this.showSecurityBanner();
  }

  private static showSecurityBanner(): void {
    this.originalConsole.log(
      '%c🛡️ WEBSITE ĐƯỢC BẢO VỆ 🛡️',
      'color: white; background: linear-gradient(45deg, #ff0000, #ff6600); font-size: 20px; font-weight: bold; padding: 10px; border-radius: 5px; text-align: center; display: block; width: 100%;'
    );
    this.originalConsole.log(
      '%cCác hoạt động debug đã bị chặn - Debug activities blocked',
      'color: red; font-size: 16px; font-weight: bold;'
    );
    this.originalConsole.log(
      '%cWebsite Security Manager - Phát hiện Developer Tools',
      'color: orange; font-size: 14px;'
    );
    this.originalConsole.log(
      '%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'color: gray;'
    );
  }

  private static disableManualRequests(): void {
    // Backup original functions
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest;

    let isInternalCall = false;

    // Create a flag to track legitimate calls from application code
    const markAsInternal = () => {
      isInternalCall = true;
      setTimeout(() => { isInternalCall = false; }, 0);
    };

    // Override fetch to block manual execution but allow app requests
    window.fetch = (...args: any[]) => {
      // Check if this is called from user console/manual execution
      const stack = new Error().stack || '';
      const isFromConsole = stack.includes('eval') || 
                           stack.includes('<anonymous>') || 
                           stack.split('\n').length < 5;

      if (isFromConsole && !isInternalCall) {
        console.warn('🚫 Manual fetch requests are blocked');
        return Promise.reject(new Error('Manual requests blocked by Security Manager'));
      }

      return this.originalFetch.apply(window, args);
    };

    // Override XMLHttpRequest to block manual execution
    window.XMLHttpRequest = class extends XMLHttpRequest {
      open(method: string, url: string, async?: boolean, user?: string | null, password?: string | null) {
        const stack = new Error().stack || '';
        const isFromConsole = stack.includes('eval') || 
                             stack.includes('<anonymous>') || 
                             stack.split('\n').length < 5;

        if (isFromConsole && !isInternalCall) {
          console.warn('🚫 Manual XMLHttpRequest blocked');
          throw new Error('Manual XMLHttpRequest blocked by Security Manager');
        }

        return super.open(method, url, async, user, password);
      }
    } as any;

    // Allow legitimate scripts but monitor for suspicious activity
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string, ...args: any[]) {
      if (tagName.toLowerCase() === 'script') {
        const stack = new Error().stack || '';
        const isFromConsole = stack.includes('eval') || stack.includes('<anonymous>');
        
        if (isFromConsole) {
          console.warn('🚫 Manual script creation blocked');
          throw new Error('Manual script creation blocked by Security Manager');
        }
      }
      return originalCreateElement.call(document, tagName, ...args);
    };

    // Expose internal call marker for legitimate app requests
    (window as any).__markInternalCall = markAsInternal;
  }

  private static addAntiDebugging(): void {
    // Detect DevTools opening
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          this.showSecurityBanner();
          console.warn('🕵️ Phát hiện Developer Tools đang mở');
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      console.warn('🚫 Right-click bị vô hiệu hóa');
    });

    // Disable common keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
        console.warn('🚫 Shortcut bị chặn:', e.key);
      }
    });

    // Anti-debugger (less aggressive)
    setInterval(() => {
      const start = performance.now();
      // @ts-ignore
      debugger;
      const end = performance.now();
      
      if (end - start > 100) {
        console.error('🚫 Debugger detected');
        // Don't redirect, just warn
      }
    }, 2000); // Less frequent checks
  }

  // Method để restore original functionality nếu cần
  public static restore(): void {
    if (!this.isInitialized) return;

    // Restore console
    Object.assign(console, this.originalConsole);
    
    // Restore fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    
    // Restore XMLHttpRequest
    if (this.originalXHR) {
      window.XMLHttpRequest = this.originalXHR;
    }

    this.isInitialized = false;
    console.log('🔓 Security Manager đã được tắt');
  }
}
