import axios from 'axios';

export class ApiService {
  async fetchData(url: string, query: any): Promise<any> {
    try {
      const response = await axios.get(url, { params: query });
      return response.data;
    } catch (error) {
      // console.error('Error fetching data:', error);
      throw new Error('Failed to fetch data from the API');
    }
  }

  /// post request
  async postData(url: string, data: any): Promise<any> {
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error) {
      // console.error('Error fetching data:', error);
      throw new Error('Failed to fetch data from the API');
    }
  }
}