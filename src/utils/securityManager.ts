
// Security and anti-debugging utilities
export class SecurityManager {
  private static isInitialized = false;
  private static originalConsole: any = {};
  private static originalFetch: any;
  private static originalXHR: any;

  public static initialize(): void {
    if (this.isInitialized) return;
    
    this.overrideConsole();
    this.blockAllRequests();
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
      '%cMọi hoạt động debug và network request đã bị chặn',
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

  private static blockAllRequests(): void {
    // Block fetch requests
    this.originalFetch = window.fetch;
    window.fetch = (...args: any[]) => {
      console.warn('🚫 Request bị chặn:', args[0]);
      return Promise.reject(new Error('All requests are blocked by Security Manager'));
    };

    // Block XMLHttpRequest
    this.originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = class extends XMLHttpRequest {
      open(...args: any[]) {
        console.warn('🚫 XMLHttpRequest bị chặn:', args[1]);
        throw new Error('XMLHttpRequest blocked by Security Manager');
      }
    } as any;

    // Block dynamic script loading
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string, ...args: any[]) {
      if (tagName.toLowerCase() === 'script') {
        console.warn('🚫 Dynamic script loading bị chặn');
        throw new Error('Script loading blocked by Security Manager');
      }
      return originalCreateElement.call(document, tagName, ...args);
    };
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

    // Anti-debugger
    setInterval(() => {
      const start = performance.now();
      // @ts-ignore
      debugger;
      const end = performance.now();
      
      if (end - start > 100) {
        console.error('🚫 Debugger detected - Redirecting...');
        // Uncomment để redirect khi detect debugger
        // window.location.href = 'about:blank';
      }
    }, 1000);
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
