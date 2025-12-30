// export const environment = {
//   production: true,
//   apiUrl: "https://www.sepv.com.tw/gp_api/api",
//   jwt: {
//     allowedDomains: ['10.1.3.16'],
//     disallowedRoutes: ['https://www.sepv.com.tw/gp_api/api/login'],
//   },
//   reportUrl:'http://192.168.1.80/reports/report/%E5%A0%B1%E5%83%B9%E7%B3%BB%E7%B5%B1%E5%A0%B1%E8%A1%A8'
// };


export const environment = {
  production: true,
  apiUrl: "https://10.1.3.16/gp_api/api",
  jwt: {
    allowedDomains: ['10.1.3.16'],
    disallowedRoutes: ['https://10.1.3.16/gp_api/api/login'],
  },
  reportUrl:'http://10.1.3.16/reports/report/%E5%A0%B1%E5%83%B9%E7%B3%BB%E7%B5%B1%E5%A0%B1%E8%A1%A8'
};
