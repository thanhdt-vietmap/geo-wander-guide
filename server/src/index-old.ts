import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import dotenv from "dotenv";
import { ApiService } from "./services/apiService";
import { ServerHMACService } from "./services/serverHMACServices";
dotenv.config();
let service = new ApiService();

const app = express();
const PORT = process.env.PORT || 5005;
(app as any).requestCounts = {};
// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "worker-src 'self' blob:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https:; " +
    "font-src 'self' data:;"
  );
  next();
});
const hmacService: ServerHMACService = ServerHMACService.getInstance();

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/api/users", (req, res) => {
  res.json([
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
  ]);
});
const isValidRequest = (req: express.Request): boolean => {
  let time = parseInt(req.headers["x-timestamp"] as string);
  if (
    isNaN(time) ||
    time < Date.now() - 30 * 1000 ||
    time > Date.now() + 30 * 1000
  ) {
    // console.error("Invalid timestamp");
    return false;
  }
  // console.log("Request timestamp:", time);
  
  if (!req.headers["x-signature"]) {
    // console.error("Missing HMAC signature");
    return false;
  }

  let isValidReq = hmacService.verifyHMAC(
    req.method,
    req.originalUrl,
    time,
    req.headers["x-signature"] as string,
    JSON.stringify(req.body)
  );

  if (!isValidReq) {
    // console.error("Invalid HMAC signature");
    return false;
  }
  return true;
};

const limitReqByIp = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const ip = req.ip || req.connection.remoteAddress;
  const currentTime = Date.now();
  if (!ip) return res.status(400).json({ error: "Unauthorized" });

  const requestCount = (req.app as any).requestCounts[ip] || {
    count: 0,
    lastRequestTime: currentTime,
  };
  // console.log(
  //   `Request from IP: ${ip}, Count: ${
  //     requestCount.count
  //   }, Last Request Time: ${new Date(
  //     requestCount.lastRequestTime
  //   ).toISOString()}`
  // );
  if (!requestCount.lastRequestTime) {
    requestCount.lastRequestTime = currentTime;
  }
  const timeSinceLastRequest = currentTime - requestCount.lastRequestTime;
  const requestLimit = 15; // Max requests per 6s
  const resetTime = 15 * 1000; // Reset every 6s
  if (timeSinceLastRequest > resetTime) {
    requestCount.count = 0; // Reset count if more than a minute has passed
    requestCount.lastRequestTime = currentTime;
  }
  requestCount.count += 1;
  (req.app as any).requestCounts[ip] = requestCount;
  if (requestCount.count > requestLimit) {
    // console.error(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ error: "Too Many Requests" });
  }
  next();
};
const proceedAutocomplete = async (req: express.Request, res: express.Response) => {
  let params = req.query;
  let url = new URL("https://maps.vietmap.vn/api/autocomplete/v3");
  params['apikey']= "07898da8410ac45ca5706a51601a1dcecc90b71718b09c40"
  const result = await service.fetchData(
    url.toString(),
    params as any
  );
  return res.json(result);
};
app.get("/proxy/autocomplete/v3", (req, res) => {
  if (!isValidRequest(req)) {
    // console.error("Invalid request");
    return res.status(400).json({ error: "Bad Request" });
  }
  limitReqByIp(req, res, () => {
    proceedAutocomplete(req, res);
  });
});

app.get("/proxy/place/v3", (req, res) => {
  if (!isValidRequest(req)) {
    // console.error("Invalid request");
    return res.status(400).json({ error: "Bad Request" });
  }
  limitReqByIp(req, res, () => {
    proceedPlace(req, res);
  });
});
app.get("/proxy/route", (req, res) => {
  if (!isValidRequest(req)) {
    // console.error("Invalid request");
    return res.status(400).json({ error: "Bad Request" });
  }
  limitReqByIp(req, res, () => {
    proceedRoute(req, res);
  });
});

const proceedRoute = async (req: express.Request, res: express.Response) => {
  // proceed call to maps.vietmap.vn
  let params = req.query;
  let url = new URL("https://maps.vietmap.vn/api/route");
  params['apikey']= "07898da8410ac45ca5706a51601a1dcecc90b71718b09c40"
  // console.log("params", params);
  const points = params['point'] as string[];
  if (!points) {
    return res.status(400).json({ error: "Missing 'point' parameter" });
  }
  const pointString = points.join('&point=');
  // console.log("url", url.toString());
  const result = await service.fetchData(
    url.toString()+ '?point=' + pointString,
    params as any
  );
  return res.json(result);
};
const proceedPlace = async (req: express.Request, res: express.Response) => {
  // proceed call to maps.vietmap.vn
  let params = req.query;
  let url = new URL("https://maps.vietmap.vn/api/place/v3");
  params['apikey']= "07898da8410ac45ca5706a51601a1dcecc90b71718b09c40"

  const result = await service.fetchData(
    url.toString(),
    params as any
  );
  return res.json(result);
};

const proceedReverse = async (req: express.Request, res: express.Response) => {
  // proceed call to maps.vietmap.vn
  let params = req.query;
  let url = new URL("https://maps.vietmap.vn/api/reverse/v3");
  params['apikey']= "07898da8410ac45ca5706a51601a1dcecc90b71718b09c40"
  const result = await service.fetchData(
    url.toString(),
    params as any
  );
  return res.json(result);
};
app.get("/proxy/reverse/v3", (req, res) => {
  if (!isValidRequest(req)) {
    // console.error("Invalid request");
    return res.status(400).json({ error: "Bad Request" });
  }
  limitReqByIp(req, res, () => {
    proceedReverse(req, res);
  });
});


// Serve static files from React build
// if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
  });
// }

app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
});
