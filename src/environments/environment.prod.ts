// export const environment = {
//   production: true,
//   apiUrl: "https://www.sepv.com.tw/gp_api/api",
//   jwt: {
//     allowedDomains: ['10.1.3.16'],
//     disallowedRoutes: ['https://www.sepv.com.tw/gp_api/api/login'],
//   },
//   reportUrl:'http://192.168.1.80/reports/report/%E5%A0%B1%E5%83%B9%E7%B3%BB%E7%B5%B1%E5%A0%B1%E8%A1%A8'
// };ng build --prod --base-href /PMS/


export const environment = {
  production: true,
  apiUrl: "https://www.agroups.com.tw/PMS_api/api",
  jwt: {
    allowedDomains: ['https://www.agroups.com.tw'],
    disallowedRoutes: ['https://www.agroups.com.tw/PMS_api/api/login'],
  },
  reportUrl:'http://https://www.agroups.com.tw/reports/report/%E5%A0%B1%E5%83%B9%E7%B3%BB%E7%B5%B1%E5%A0%B1%E8%A1%A8'
};
