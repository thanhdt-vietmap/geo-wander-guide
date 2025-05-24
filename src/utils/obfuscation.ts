
// Code obfuscation utilities for production builds
export class CodeSecurity {
  private static readonly OBFUSCATION_MAP = new Map([
    ['api', 'a1'],
    ['key', 'k2'],
    ['secret', 's3'],
    ['hmac', 'h4'],
    ['token', 't5'],
    ['auth', 'a6']
  ]);

  public static obfuscateString(input: string): string {
    return btoa(input).split('').reverse().join('');
  }

  public static deobfuscateString(input: string): string {
    return atob(input.split('').reverse().join(''));
  }

  public static obfuscateObject(obj: Record<string, any>): Record<string, any> {
    const obfuscated: Record<string, any> = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      const obfuscatedKey = this.OBFUSCATION_MAP.get(key) || key;
      obfuscated[obfuscatedKey] = typeof value === 'string' 
        ? this.obfuscateString(value)
        : value;
    });
    
    return obfuscated;
  }

  public static addAntiDebugger(): void {
    if (import.meta.env.PROD) {
      // Anti-debugging measures for production
      setInterval(() => {
        const start = performance.now();
        // @ts-ignore
        debugger;
        const end = performance.now();
        
        if (end - start > 100) {
          // Developer tools might be open
          window.location.href = 'about:blank';
        }
      }, 1000);
      
      // Disable right-click in production
      document.addEventListener('contextmenu', e => e.preventDefault());
      
      // Disable F12, Ctrl+Shift+I, Ctrl+U
      document.addEventListener('keydown', e => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault();
        }
      });
    }
  }
}

// Initialize security measures
if (import.meta.env.PROD) {
  CodeSecurity.addAntiDebugger();
}
