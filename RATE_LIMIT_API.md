# Rate Limit API Documentation

Tài liệu này mô tả các API để kiểm tra thông tin rate limit theo IP.

## API Endpoints

### 1. Kiểm tra Rate Limit của IP hiện tại (Public API)

**Endpoint:** `GET /api/rate-limit/status`

**Mô tả:** Lấy thông tin rate limit của IP đang gửi request (API công khai).

**Response:**
```json
{
  "success": true,
  "data": {
    "ip": "192.168.1.100",
    "limits": {
      "maxRequestsPerWindow": 100,
      "windowSizeMs": 60000,
      "dailyRequestLimit": 200
    },
    "current": {
      "requestCount": 15,
      "dailyCount": 45
    },
    "status": {
      "canMakeRequest": true,
      "rateLimitExceeded": false,
      "dailyLimitExceeded": false,
      "isQueued": false
    },
    "usage": {
      "windowUsagePercent": 15,
      "dailyUsagePercent": 22,
      "remainingRequests": 85,
      "remainingDailyRequests": 155
    },
    "timestamps": {
      "nextWindowReset": "2025-06-11T10:30:00.000Z",
      "nextDailyReset": "2025-06-12T00:00:00.000Z"
    }
  },
  "timestamp": "2025-06-11T10:29:30.123Z"
}
```

### 2. Kiểm tra Rate Limit chi tiết của IP hiện tại (Admin API)

**Endpoint:** `GET /admin/rate-limiter/my-limits`

**Mô tả:** Lấy thông tin rate limit chi tiết của IP đang gửi request (dành cho admin).

**Response:**
```json
{
  "success": true,
  "data": {
    "ip": "192.168.1.100",
    "exists": true,
    "isBlacklisted": false,
    "limits": {
      "maxRequestsPerWindow": 100,
      "windowSizeMs": 60000,
      "dailyRequestLimit": 200,
      "effectiveDailyLimit": 200,
      "blacklistThreshold": 10,
      "maxQueueSize": 50
    },
    "current": {
      "requestCount": 15,
      "dailyCount": 45,
      "violations": 0,
      "botSuspicionScore": 0,
      "isSuspiciousBot": false,
      "queueSize": 0
    },
    "status": {
      "canMakeRequest": true,
      "rateLimitExceeded": false,
      "dailyLimitExceeded": false,
      "isQueued": false,
      "isProcessing": false
    },
    "usage": {
      "windowUsagePercent": 15,
      "dailyUsagePercent": 22,
      "remainingRequests": 85,
      "remainingDailyRequests": 155
    },
    "timestamps": {
      "lastRequest": "2025-06-11T10:29:15.123Z",
      "lastAccess": "2025-06-11T10:29:15.123Z",
      "dailyResetTime": "2025-06-11T00:00:00.000Z",
      "nextWindowReset": "2025-06-11T10:30:15.123Z",
      "nextDailyReset": "2025-06-12T00:00:00.000Z"
    }
  },
  "timestamp": "2025-06-11T10:29:30.123Z"
}
```

### 3. Kiểm tra Rate Limit của IP cụ thể (Admin API)

**Endpoint:** `GET /admin/rate-limiter/ip/:ip`

**Mô tả:** Lấy thông tin rate limit của một IP cụ thể (dành cho admin).

**Parameters:**
- `ip` (string): Địa chỉ IP cần kiểm tra

**Example:** `GET /admin/rate-limiter/ip/192.168.1.100`

**Response:** Tương tự như endpoint `/admin/rate-limiter/my-limits`

## Thông tin trường dữ liệu

### Limits
- `maxRequestsPerWindow`: Số request tối đa trong một cửa sổ thời gian
- `windowSizeMs`: Kích thước cửa sổ thời gian (milliseconds)
- `dailyRequestLimit`: Giới hạn request mỗi ngày
- `effectiveDailyLimit`: Giới hạn thực tế (có thể thấp hơn nếu là bot)
- `blacklistThreshold`: Số vi phạm để bị blacklist
- `maxQueueSize`: Kích thước tối đa của hàng đợi

### Current Status
- `requestCount`: Số request trong cửa sổ thời gian hiện tại
- `dailyCount`: Số request trong ngày
- `violations`: Số lần vi phạm rate limit
- `botSuspicionScore`: Điểm nghi ngờ bot (0-100)
- `isSuspiciousBot`: Có được đánh dấu là bot nghi ngờ
- `queueSize`: Số request đang trong hàng đợi

### Status Flags
- `canMakeRequest`: Có thể thực hiện request không
- `rateLimitExceeded`: Đã vượt quá rate limit cửa sổ
- `dailyLimitExceeded`: Đã vượt quá limit hàng ngày
- `isQueued`: Có request đang trong hàng đợi
- `isProcessing`: Đang xử lý hàng đợi

### Usage Statistics
- `windowUsagePercent`: Phần trăm sử dụng trong cửa sổ hiện tại
- `dailyUsagePercent`: Phần trăm sử dụng trong ngày
- `remainingRequests`: Số request còn lại trong cửa sổ
- `remainingDailyRequests`: Số request còn lại trong ngày

## Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Cách sử dụng

### JavaScript/Frontend
```javascript
// Kiểm tra rate limit status
async function checkRateLimit() {
  try {
    const response = await fetch('/api/rate-limit/status');
    const result = await response.json();
    
    if (result.success) {
      console.log('Rate limit info:', result.data);
      console.log(`Remaining requests: ${result.data.usage.remainingRequests}`);
      console.log(`Daily usage: ${result.data.usage.dailyUsagePercent}%`);
    }
  } catch (error) {
    console.error('Error checking rate limit:', error);
  }
}
```

### cURL
```bash
# Kiểm tra rate limit của IP hiện tại
curl -X GET "http://localhost:5005/api/rate-limit/status"

# Admin: Kiểm tra rate limit chi tiết
curl -X GET "http://localhost:5005/admin/rate-limiter/my-limits"

# Admin: Kiểm tra rate limit của IP cụ thể
curl -X GET "http://localhost:5005/admin/rate-limiter/ip/192.168.1.100"
```

## Notes

1. **Public API** (`/api/rate-limit/status`) chỉ trả về thông tin cơ bản cần thiết cho người dùng.
2. **Admin API** trả về thông tin chi tiết bao gồm bot detection, violations, và blacklist status.
3. IP được xác định tự động từ request headers (X-Forwarded-For, X-Real-IP, etc.).
4. Bot suspicious score cao sẽ làm giảm `effectiveDailyLimit`.
5. Blacklisted IP sẽ có `canMakeRequest: false`.
