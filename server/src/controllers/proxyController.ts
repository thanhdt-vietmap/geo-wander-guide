import express from "express";
import { ApiService } from "../services/apiService";
import { CONFIG } from "../config/constants";

const service = new ApiService();

export const autocompleteController = async (req: express.Request, res: express.Response) => {
  let params = req.query;
  let url = new URL(`${CONFIG.VIETMAP_BASE_URL}/autocomplete/v3`);
  params['apikey'] = CONFIG.VIETMAP_API_KEY;
  
  const result = await service.fetchData(
    url.toString(),
    params as any
  );
  return res.json(result);
};

export const placeController = async (req: express.Request, res: express.Response) => {
  let params = req.query;
  let url = new URL(`${CONFIG.VIETMAP_BASE_URL}/place/v3`);
  params['apikey'] = CONFIG.VIETMAP_API_KEY;

  const result = await service.fetchData(
    url.toString(),
    params as any
  );
  return res.json(result);
};

export const routeController = async (req: express.Request, res: express.Response) => {
  let params = req.query;
  let url = new URL(`${CONFIG.VIETMAP_BASE_URL}/route`);
  params['apikey'] = CONFIG.VIETMAP_API_KEY;
  
  // console.log("params", params);
  const points = params['point'] as string[];
  if (!points) {
    return res.status(400).json({ error: "Missing 'point' parameter" });
  }
  
  const pointString = points.join('&point=');
  // console.log("url", url.toString());
  const result = await service.fetchData(
    url.toString() + '?point=' + pointString,
    params as any
  );
  return res.json(result);
};

export const reverseController = async (req: express.Request, res: express.Response) => {
  let params = req.query;
  let url = new URL(`${CONFIG.VIETMAP_BASE_URL}/reverse/v3`);
  params['apikey'] = CONFIG.VIETMAP_API_KEY;
  
  const result = await service.fetchData(
    url.toString(),
    params as any
  );
  return res.json(result);
};
