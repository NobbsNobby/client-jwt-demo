import axios from "axios";

export default class Api {
  constructor(options = {}) {
    this.client = options.client || axios.create()
    this.token = options.token;
    this.refreshToken = options.refreshToken;
    this.refreshRequest = null;
    this.client.interceptors.request.use((config) => {
      if (!this.token) {
        return config;
      }

      const newConfig = {
        headers: {},
        ...config,
      };

      newConfig.headers.Authorization = `Bearer ${this.token}`;
      return newConfig;
    }, (error) => Promise.reject(error))

    this.client.interceptors.response.use((response) => response,
        async (error) => {
          if (!this.refreshToken || error.response.status !== 401 || error.config.retry) {
            return Promise.reject(error);
          }
          if(!this.refreshRequest) {
            this.refreshRequest = this.client.post('/auth/refresh', {refreshToken: this.refreshToken});
          }
          const {data} = await this.refreshRequest;
          this.token = data.token;
          this.refreshToken = data.refreshToken;
          this.refreshRequest = null;

          const newRequest = {
            ...error.config,
            retry: true
          }
          return this.client(newRequest)
        })
  }

  async login({login, password}) {
    const {data} = await this.client.post('/auth/login', {login, password});
    this.token = data.token;
    this.refreshToken = data.refreshToken;
  }

  logout() {
    this.token = null
    this.refreshToken = null
  }

  async getUsers() {
    const {data} = await this.client('/users');
    return data
  }
}
