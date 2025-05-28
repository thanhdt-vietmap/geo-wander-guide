// Security and anti-debugging utilities
export class SecurityManager {
  private static isInitialized = false;
  private static originalConsole: any = {};
  private static originalFetch: any;
  private static originalXHR: any;

  public static initialize(): void {
    if (this.isInitialized) return;
    this.overrideConsole();
    // this.disableManualRequests();
    this.isInitialized = true;
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

    this.showWelcomeMessage();

    console.info = console.log;
    console.debug = console.log;
    console.clear = () => {
      this.originalConsole.clear();
    };
    this.showWelcomeMessage();
  }


  private static showWelcomeMessage() {
    const styles = {
      title: 'color: #FF6B6B; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);',
      subtitle: 'color: #4ECDC4; font-size: 16px; font-weight: bold;',
      normal: 'color: #45B7D1; font-size: 14px;',
      highlight: 'color: #96CEB4; font-size: 14px; font-weight: bold;',
      warning: 'color: #FFEAA7; font-size: 14px; background: rgba(255, 234, 167, 0.1); padding: 5px;'
    };

    console.clear();

    console.log('%c🗺️ VIETMAP API', styles.title);
    console.log('%c═══════════════════════════════════════', styles.subtitle);
    console.log('%cGiải pháp bản đồ số đa nền tảng!!!', styles.normal);
    console.log('');
    console.log('%c🎯 Tại sao chọn Vietmap?', styles.subtitle);
    console.log('%c• 🇻🇳 Dữ liệu bản đồ Việt Nam chuẩn xác nhất', styles.normal);
    console.log('%c• ⚡ API nhanh, ổn định, dễ tích hợp', styles.normal);
    console.log('%c• 💰 Giá cả phải chăng cho startup Việt', styles.normal);
    console.log('%c• 🛠️ SDK đầy đủ: JS, TS, React, Flutter, React Native, Kotlin Multiplatform, Android, iOS', styles.normal);
    console.log('%c• 📱 Autocomplete, Search, Geocoding, Routing, Places API, Matrix, TSP, VRP', styles.normal);
    console.log('');
    console.log('%c🔥 Dùng thử miễn phí:', styles.warning);
    console.log('%chttps://maps.vietmap.vn', styles.highlight);
    console.log('%cmaps-api.support@vietmap.vn', styles.normal);
    console.log('%c═══════════════════════════════════════', styles.subtitle);
    // Tài liệu API
    console.log('%c📚 Tài liệu API:', styles.warning)
    console.log('%chttps://maps.vietmap.vn/docs', styles.highlight);
    // Hỗ trợ kỹ thuật
    console.log('%c💬 Hỗ trợ kỹ thuật:', styles.warning)
    // zalo
    console.log('%chttps://zalo.me/vietmapmapsapi', styles.highlight);
    // facebook
    console.log('%c📱 Facebook:', styles.warning);
    console.log('%chttps://www.facebook.com/VietmapSolutions', styles.highlight);
    // github
    console.log('%c🐱 GitHub:', styles.warning)
    console.log('%chttps://github.com/vietmap-company', styles.highlight);
    // youtube
    console.log('%c📺 YouTube:', styles.warning)
    console.log('%chttps://www.youtube.com/@VietmapSolutions', styles.highlight);
    
    console.log('%c🗺️ VIETMAP API', styles.title);
    console.log('%c═══════════════════════════════════════', styles.subtitle);
    console.log('%cChào dev! 👋 Bạn đang inspect trang web à?', styles.normal);
    console.log('%cVậy thì đừng quên check out Vietmap API nhé! 🚀', styles.highlight);
    
    console.log('');
    console.log('%c🚀 Kéo lên trên để biết thêm chi tiết!', styles.subtitle);
    
    // Console art

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

        // return Promise.reject(new Error('Manual requests blocked by Security Manager'));
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
          // this.showSecurityBanner();
          this.showWelcomeMessage();
          Promise.reject(new Error('Manual requests blocked by Security Manager'));
          console.warn('🕵️ Phát hiện Developer Tools đang mở');
        }
      } else {
        devtools.open = false;
      }
    }, 500);

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
        // console.error('🚫 Debugger detected');
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

  }
}
