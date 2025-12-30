export const environment = {
  production: false,
  apiUrl: "https://localhost:44322/api",
  jwt: {
    allowedDomains: ['localhost:44322'],
    disallowedRoutes: ['https://localhost:44322/api/login'],
  },
  reportUrl: 'http://192.168.1.80/reports/report/%E5%A0%B1%E5%83%B9%E7%B3%BB%E7%B5%B1%E5%A0%B1%E8%A1%A8'
};
