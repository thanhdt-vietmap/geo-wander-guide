export const CONFIG = {
  VIETMAP_API_KEY: "07898da8410ac45ca5706a51601a1dcecc90b71718b09c40",
  VIETMAP_BASE_URL: "https://maps.vietmap.vn/api",
  RATE_LIMIT: {
    MAX_REQUESTS: 15,
    RESET_TIME: 15 * 1000, // 15 seconds
    BLACKLIST_THRESHOLD: 5, // Number of rate limit violations before blacklisting
    MAX_QUEUE_SIZE: 100, // Maximum number of queued requests per IP
    REQUEST_TIMEOUT: 30 * 1000, // 30 seconds timeout for queued requests
  },
  TIMESTAMP_TOLERANCE: 30 * 1000, // 30 seconds
};
