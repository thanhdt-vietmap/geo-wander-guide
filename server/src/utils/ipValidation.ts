/**
 * IP validation utilities for filtering out localhost, private, and invalid IP addresses
 */

export interface IPValidationResult {
  isValid: boolean;
  type: 'public' | 'localhost' | 'private' | 'invalid';
  reason?: string;
}

/**
 * Checks if an IP address is valid and not localhost or private
 */
export function validateIP(ip: string | null): IPValidationResult {
  if (!ip) {
    return {
      isValid: false,
      type: 'invalid',
      reason: 'IP address is null or undefined'
    };
  }

  // Clean up IP address (remove port if present)
  const cleanIP = ip.split(':')[0];

  // Check if it's a valid IP format
  if (!isValidIPFormat(cleanIP)) {
    return {
      isValid: false,
      type: 'invalid',
      reason: 'Invalid IP address format'
    };
  }

  // Check for localhost
  if (isLocalhost(cleanIP)) {
    return {
      isValid: false,
      type: 'localhost',
      reason: 'Localhost IP address'
    };
  }

  // Check for private IP ranges
  if (isPrivateIP(cleanIP)) {
    return {
      isValid: false,
      type: 'private',
      reason: 'Private IP address'
    };
  }

  // It's a valid public IP
  return {
    isValid: true,
    type: 'public'
  };
}

/**
 * Checks if IP is in valid IPv4 or IPv6 format
 */
function isValidIPFormat(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Checks if IP is localhost
 */
function isLocalhost(ip: string): boolean {
  const localhostAddresses = [
    '127.0.0.1',    // IPv4 localhost
    '::1',          // IPv6 localhost
    'localhost',    // hostname
    '0.0.0.0'       // sometimes used as localhost
  ];

  return localhostAddresses.includes(ip) || ip.startsWith('127.');
}

/**
 * Checks if IP is in private network ranges
 */
function isPrivateIP(ip: string): boolean {
  if (!isValidIPFormat(ip)) {
    return false;
  }

  // IPv6 private ranges
  if (ip.includes(':')) {
    return isPrivateIPv6(ip);
  }

  // IPv4 private ranges
  const parts = ip.split('.').map(Number);
  
  // 10.0.0.0/8 (Class A private)
  if (parts[0] === 10) {
    return true;
  }
  
  // 172.16.0.0/12 (Class B private)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }
  
  // 192.168.0.0/16 (Class C private)
  if (parts[0] === 192 && parts[1] === 168) {
    return true;
  }

  // 169.254.0.0/16 (Link-local)
  if (parts[0] === 169 && parts[1] === 254) {
    return true;
  }

  return false;
}

/**
 * Checks if IPv6 address is private
 */
function isPrivateIPv6(ip: string): boolean {
  // Remove brackets if present
  const cleanIP = ip.replace(/[\[\]]/g, '');
  
  // fc00::/7 - Unique local addresses
  if (cleanIP.toLowerCase().startsWith('fc') || cleanIP.toLowerCase().startsWith('fd')) {
    return true;
  }
  
  // fe80::/10 - Link-local addresses
  if (cleanIP.toLowerCase().startsWith('fe8') || cleanIP.toLowerCase().startsWith('fe9') ||
      cleanIP.toLowerCase().startsWith('fea') || cleanIP.toLowerCase().startsWith('feb')) {
    return true;
  }
  
  return false;
}

/**
 * Extracts and validates IP from Express request
 */
export function getValidClientIP(req: any): string | null {
  // Try multiple sources for IP address
  const possibleIPs = [
    req.ip,
    req.socket?.remoteAddress,
    req.connection?.remoteAddress,
    req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
    req.headers['x-real-ip'],
    req.headers['x-client-ip']
  ].filter(Boolean);

  for (const ip of possibleIPs) {
    const validation = validateIP(ip as string);
    if (validation.isValid) {
      return ip as string;
    }
  }

  return null;
}

/**
 * Helper function to log IP validation for debugging
 */
export function logIPValidation(ip: string | null, context: string = ''): void {
  const validation = validateIP(ip);
  const timestamp = new Date().toISOString();
  
  if (!validation.isValid) {
    console.log(`[${timestamp}] IP Validation [${context}]: Rejected IP "${ip}" - ${validation.type} (${validation.reason})`);
  } else {
    console.log(`[${timestamp}] IP Validation [${context}]: Accepted public IP "${ip}"`);
  }
}
