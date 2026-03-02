import { map } from 'rxjs/operators';
import { LoginMenus } from './../_models/loginmenus';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Currency } from "app/_models/currency";
import { Invoices } from "app/_models/invoices";
import { LoginRoles } from "app/_models/loginroles";
import { Organizations } from "app/_models/organizations";
import { ProformaInvoices } from "app/_models/proformainvoices";
import { SetOfBooks } from "app/_models/setofbooks";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { Contracts } from 'app/_models/contracts';

const apiUrl = environment.apiUrl;

@Injectable({
  providedIn: "root",
})
export class ApiService {
  [x: string]: any;
  constructor(private http: HttpClient) {}


getHolidaysData(year: string): Observable<any[]> {
  // 將所有敏感資訊與設定寫在方法內部
  const URL = "https://superiorapis-creator.cteam.com.tw/manager/feature/proxy/99fe9e562fa7/pub_99fe9f51aca7";
  const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjZXJ0IjoiYzVmYjY3NWY5YzVjMTY1ZDRjNWJhNjZmZDkxYTE4ODU3M2Q2NmEwZSIsImlhdCI6MTc3MjA4Nzc4MX0.QGi2vtyPlAwFWbCUYWrIhbkRidFub842BIMJt6GXZr8";

  const httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'Schema', // 照你原本 Axios 的設定寫 Schema
      'token': token
    }),
    params: new HttpParams().set('year', year)
  };

  return this.http.get<any[]>(URL, httpOptions);
}

 public getReport(data: any) {
  return this.http.post(`${apiUrl}/report/Download`, data, { responseType: 'blob' });
}


 public getdata (name:string){
  return this.http.get<any[]>(apiUrl +`/${name}`);
 }
 public getdatabyrole (name:string){
  return this.http.get<any[]>(apiUrl +`/${name}/ByRole`);
 }
public getdatabyid (name:string,id:any){
  return this.http.get<any>(apiUrl +`/${name}/` + id);
 }
  public updatedata(name:string,id: string, data: any) {
    return this.http.patch(apiUrl +`/${name}/` + id, data);
  }

  public deletedata(name:string,id: string) {
    return this.http.delete(apiUrl +`/${name}/` + id);
  }

  public createdata(name:string,data: any) {
    return this.http.post(apiUrl +`/${name}`, data);
  }





 public impotData(data: any) {
    return this.http.post(apiUrl + "/import/ps", data);
  }
 public impotService(data: any) {
    return this.http.post(apiUrl + "/import/service", data);
  }

public getpssurplusinfo (
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/pssurplusinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/pssurplusinfo");
  }

  public updatepssurplusinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/pssurplusinfo/" + id, data);
  }

  public deletepssurplusinfo(id: string) {
    return this.http.delete(apiUrl + "/pssurplusinfo/" + id);
  }

  public createpssurplusinfo(data: any) {
    return this.http.post(apiUrl + "/pssurplusinfo", data);
  }

public getpssurplusdata (
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/pssurplusdata/" + id);
    return this.http.get<any[]>(apiUrl + "/pssurplusdata");
  }

  public updatepssurplusdata(id: string, data: any) {
    return this.http.patch(apiUrl + "/pssurplusdata/" + id, data);
  }

  public deletepssurplusdata(id: string) {
    return this.http.delete(apiUrl + "/pssurplusdata/" + id);
  }

  public createpssurplusdata(data: any) {
    return this.http.post(apiUrl + "/pssurplusdata", data);
  }


 public getbankinfo (
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/bankinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/bankinfo");
  }

  public updatebankinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/bankinfo/" + id, data);
  }

  public deletebankinfo(id: string) {
    return this.http.delete(apiUrl + "/bankinfo/" + id);
  }

  public createbankinfo(data: any) {
    return this.http.post(apiUrl + "/bankinfo", data);
  }


   public getservicenodetaildata (
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/servicenodetaildata/" + id);
    return this.http.get<any[]>(apiUrl + "/servicenodetaildata");
  }

  public updateservicenodetaildata(id: string, data: any) {
    return this.http.patch(apiUrl + "/servicenodetaildata/" + id, data);
  }

  public deleteservicenodetaildata(id: string) {
    return this.http.delete(apiUrl + "/servicenodetaildata/" + id);
  }

  public createservicenodetaildata(data: any) {
    return this.http.post(apiUrl + "/servicenodetaildata", data);
  }



   public getpsbankdata (
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/psbankdata/" + id);
    return this.http.get<any[]>(apiUrl + "/psbankdata");
  }

  public updatepsbankdata(id: string, data: any) {
    return this.http.patch(apiUrl + "/psbankdata/" + id, data);
  }

  public deletepsbankdata(id: string) {
    return this.http.delete(apiUrl + "/psbankdata/" + id);
  }

  public createpsbankdata(data: any) {
    return this.http.post(apiUrl + "/psbankdata", data);
  }




  public getbankbranchinfo (
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/bankbranchinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/bankbranchinfo");
  }

  public updatebankbranchinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/bankbranchinfo/" + id, data);
  }

  public deletebankbranchinfo(id: string) {
    return this.http.delete(apiUrl + "/bankbranchinfo/" + id);
  }

  public createbankbranchinfo(data: any) {
    return this.http.post(apiUrl + "/bankbranchinfo", data);
  }


public getservicenodetailinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/servicenodetailinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/servicenodetailinfo");
  }

  public updateservicenodetailinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/servicenodetailinfo/" + id, data);
  }

  public deleteservicenodetailinfo(id: string) {
    return this.http.delete(apiUrl + "/servicenodetailinfo/" + id);
  }

  public createservicenodetailinfo(data: any) {
    return this.http.post(apiUrl + "/servicenodetailinfo", data);
  }



public getservicenoinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/servicenoinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/servicenoinfo");
  }

  public updateservicenoinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/servicenoinfo/" + id, data);
  }

  public deleteservicenoinfo(id: string) {
    return this.http.delete(apiUrl + "/servicenoinfo/" + id);
  }

  public createservicenoinfo(data: any) {
    return this.http.post(apiUrl + "/servicenoinfo", data);
  }





public getpppowernoinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/pppowernoinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/pppowernoinfo");
  }

  public updatepppowernoinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/pppowernoinfo/" + id, data);
  }

  public deletepppowernoinfo(id: string) {
    return this.http.delete(apiUrl + "/pppowernoinfo/" + id);
  }

  public createpppowernoinfo(data: any) {
    return this.http.post(apiUrl + "/pppowernoinfo", data);
  }


  public getppmeternoinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/ppmeternoinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/ppmeternoinfo");
  }

  public updateppmeternoinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/ppmeternoinfo/" + id, data);
  }

  public deleteppmeternoinfo(id: string) {
    return this.http.delete(apiUrl + "/ppmeternoinfo/" + id);
  }

  public createppmeternoinfo(data: any) {
    return this.http.post(apiUrl + "/ppmeternoinfo", data);
  }




public getpsmeternoinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/psmeternoinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/psmeternoinfo");
  }

  public updatepsmeternoinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/psmeternoinfo/" + id, data);
  }

  public deletepsmeternoinfo(id: string) {
    return this.http.delete(apiUrl + "/psmeternoinfo/" + id);
  }

  public createpsmeternoinfo(data: any) {
    return this.http.post(apiUrl + "/psmeternoinfo", data);
  }





  public getpspowernoinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/pspowernoinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/pspowernoinfo");
  }

  public updatepspowernoinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/pspowernoinfo/" + id, data);
  }

  public deletepspowernoinfo(id: string) {
    return this.http.delete(apiUrl + "/pspowernoinfo/" + id);
  }

  public createpspowernoinfo(data: any) {
    return this.http.post(apiUrl + "/pspowernoinfo", data);
  }

  public createpsbasicinfo(data: any) {
    return this.http.post(apiUrl + "/psbasicinfo", data);
  }
  public createppbasicinfo(data: any) {
      return this.http.post(apiUrl + "/ppbasicinfo", data);
    }

  public getpsbasicinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/psbasicinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/psbasicinfo");
  }


    public getppbasicinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/ppbasicinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/ppbasicinfo");
  }

  public updatepsbasicinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/psbasicinfo/" + id, data);
  }

  public deletepsbasicinfo(id: string) {
    return this.http.delete(apiUrl + "/psbasicinfo/" + id);
  }
  public updateppbasicinfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/ppbasicinfo/" + id, data);
  }

  public deleteppbasicinfo(id: string) {
    return this.http.delete(apiUrl + "/ppbasicinfo/" + id);
  }

  public createSetOfBooks(data: SetOfBooks) {
    return this.http.post(apiUrl + "/setofbooks", data);
  }

  /**
   * @description
   * if input id is all, return all SetOfBooks data
   * if input id is number, return SetOfBooks data with this id
   *
   * @param id default "all"
   * @returns Observable<SetOfBooks[] | SetOfBooks>
   */
  public getSetOfBooks(
    id: string = "all"
  ): Observable<SetOfBooks[] | SetOfBooks> {
    if (id !== "all")
      return this.http.get<SetOfBooks>(apiUrl + "/setofbooks/" + id);
    return this.http.get<SetOfBooks[]>(apiUrl + "/setofbooks");
  }

  /**
   * @description
   * Update specific SetOfBooks data with id,
   *  and update all parts of input data (patch)
   *
   * @param id
   * @param data
   * @returns
   */
  public updateSetOfBooks(id: string, data: any) {
    return this.http.patch(apiUrl + "/SetOfBooks/" + id, data);
  }

  /**
   * @description
   * Delete specific SetOfBooks data with id
   *
   * @param id
   * @returns
   */
  public deleteSetOfBooks(id: string) {
    return this.http.delete(apiUrl + "/SetOfBooks/" + id);
  }

  /**
   * @description
   * Organizations Create methods
   * insert new Organizations data with Organizations format
   *
   * @param data
   * @returns
   */
  public createOrganizations(data: Organizations) {
    return this.http.post(apiUrl + "/Organizations", data);
  }

  /**
   * @description
   * if input id is all, return all Organizations data
   * if input id is number, return Organizations data with this id
   *
   * @param id default "all"
   * @returns Observable<Organizations[] | Organizations>
   */
  public getOrganizations(
    id: string = "all"
  ): Observable<Organizations[] | Organizations> {
    if (id !== "all")
      return this.http.get<Organizations>(apiUrl + "/Organizations/" + id);
    return this.http.get<Organizations[]>(apiUrl + "/Organizations");
  }

  /**
   * @description
   * Update specific Organizations data with id,
   *  and update all parts of input data (patch)
   *
   * @param id
   * @param data
   * @returns
   */
  public updateOrganizations(id: string, data: any) {
    return this.http.patch(apiUrl + "/Organizations/" + id, data);
  }

  /**
   * @description
   * Delete specific Organizations data with id
   *
   * @param id
   * @returns
   */
  public deleteOrganizations(id: string) {
    return this.http.delete(apiUrl + "/Organizations/" + id);
  }
  /**
   * @description
   * LoginInfo Create methods
   * insert new LoginInfo data with LoginInfo format
   *
   * @param data
   * @returns
   */
  public createLoginInfo(data: any) {
    return this.http.post(apiUrl + "/LoginInfo", data);
  }



  /**
   * @description
   * Update specific LoginInfo data with id,
   *  and update all parts of input data (patch)
   *
   * @param id
   * @param data
   * @returns
   */
  public updateLoginInfo(id: string, data: any) {
    return this.http.patch(apiUrl + "/LoginInfo/" + id, data);
  }

  /**
   * @description
   * Delete specific LoginInfo data with id
   *
   * @param id
   * @returns
   */
  public deleteLoginInfo(id: string) {
    return this.http.delete(apiUrl + "/LoginInfo/" + id);
  }

  // /**
  //  * @description
  //  * Add Roles in specific logininfo with id
  //  *
  //  * @param id
  //  * @returns
  //  */
  // public addRolesLoginInfo(id: string, role_id: number) {
  //   return this.http.post(apiUrl + '/LoginInfo/addRoles/' + id, {role_id: role_id});
  // }

  /**
   * @description
   * Add Roles in specific logininfo with id
   *
   * @param id
   * @returns
   */
     public changePassword(new_password: string, old_password: string) {
      return this.http.post(apiUrl + '/LoginInfo/changePassword', {old_password: old_password, new_password: new_password});
    }

  /**
   * @description
   * LoginRoles Create methods
   * insert new LoginRoles data with LoginRoles format
   *
   * @param data
   * @returns
   */
  public createLoginRoles(data: LoginRoles) {
    return this.http.post(apiUrl + "/LoginRoles", data);
  }

  /**
   * @description
   * if input id is all, return all LoginRoles data
   * if input id is number, return LoginRoles data with this id
   *
   * @param id default "all"
   * @returns Observable<LoginRoles[] | LoginRoles>
   */
  public getLoginRoles(
    id: string = "all"
  ): Observable<LoginRoles[] | LoginRoles> {
    if (id !== "all")
      return this.http.get<LoginRoles>(apiUrl + "/LoginRoles/" + id);
    return this.http.get<LoginRoles[]>(apiUrl + "/LoginRoles");
  }

  /**
   * @description
   * Update specific LoginRoles data with username,
   *  and update all parts of input data (patch)
   *
   * @param id
   * @param data
   * @returns
   */
  public updateLoginRoles(id: string, data: any) {
    return this.http.patch(apiUrl + "/LoginRoles/" + id, data);
  }

  /**
   * @description
   * Delete specific LoginRoles data with username
   *
   * @param username
   * @returns
   */
  public deleteLoginRoles(id: string) {
    return this.http.delete(apiUrl + "/LoginRoles/" + id);
  }
  /**
   * @description
   * Currency Create methods
   * insert new Currency data with Currency format
   *
   * @param data
   * @returns
   */
   public createCurrency(data: Currency) {
    return this.http.post(apiUrl + "/Currency", data);
  }

  /**
   * @description
   * if input id is all, return all Currency data
   * if input id is number, return Currency data with this id
   *
   * @param id default "all"
   * @returns Observable<Currency[] | Currency>
   */
  public getCurrency(
    id: string = "all"
  ): Observable<Currency[] | Currency> {
    if (id !== "all")
      return this.http.get<Currency>(apiUrl + "/Currencyconfig/" + id);
    return this.http.get<Currency[]>(apiUrl + "/Currencyconfig");
  }

  /**
   * @description
   * Update specific Currency data with id,
   *  and update all parts of input data (patch)
   *
   * @param id
   * @param data
   * @returns
   */
  public updateCurrency(id: string, data: any) {
    return this.http.patch(apiUrl + "/CurrencyConfig/" + id, data);
  }

  /**
   * @description
   * Delete specific Currency data with id
   *
   * @param id
   * @returns
   */
  public deleteCurrency(id: string) {
    return this.http.delete(apiUrl + "/CurrencyConfig/" + id);
  }
/**
   * @description
   * ProformaInvoices Create methods
   * insert new ProformaInvoices data with ProformaInvoices format
   *
   * @param data
   * @returns
   */
 public createProformaInvoices(data: ProformaInvoices) {
  return this.http.post(apiUrl + "/ProformaInvoices", data);
}

/**
 * @description
 * if input id is all, return all ProformaInvoices data
 * if input id is number, return ProformaInvoices data with this id
 *
 * @param id default "all"
 * @returns Observable<ProformaInvoices[] | ProformaInvoices>
 */
public getProformaInvoices(
  id: string = "all"
): Observable<ProformaInvoices[] | ProformaInvoices> {
  if (id !== "all")
  return this.http.get<ProformaInvoices>(apiUrl + "/ProformaInvoices/" + id).pipe(map((x: ProformaInvoices) => {
    x.invoices_amount = 0;
    x.invoices.forEach(i => {
      x.invoices_amount += i.amount;
    });
    x.pi_remain_amount = x.amount - x.invoices_amount;
    return x;
  }));
  return this.http.get<ProformaInvoices[]>(apiUrl + "/ProformaInvoices").pipe(map((x: ProformaInvoices[]) => {
    x.forEach((y: ProformaInvoices) => {
      y.invoices_amount = 0;
      y.invoices.forEach(i => {
        y.invoices_amount += i.amount;
      });
      y.pi_remain_amount = y.amount - y.invoices_amount;
    });
    return x;
  }));
}

/**
 * @description
 * Update specific ProformaInvoices data with id,
 *  and update all parts of input data (patch)
 *
 * @param id
 * @param data
 * @returns
 */
public updateProformaInvoices(id: string, data: any) {
  return this.http.patch(apiUrl + "/ProformaInvoices/" + id, data);
}

/**
 * @description
 * Delete specific ProformaInvoices data with id
 *
 * @param id
 * @returns
 */
public deleteProformaInvoices(id: string) {
  return this.http.delete(apiUrl + "/ProformaInvoices/" + id);
}
  /**
     * @description
     * Invoices Create methods
     * insert new Invoices data with Invoices format
     *
     * @param data
     * @returns
     */
  public createInvoices(data: Invoices) {
    return this.http.post(apiUrl + "/Invoices", data);
  }
  /**
   * @description
   * if input id is all, return all Invoices data
   * if input id is number, return Invoices data with this id
   *
   * @param id default "all"
   * @returns Observable<Invoices[] | Invoices>
   */
  public getInvoices(
    id: string = "all"
  ): Observable<Invoices[] | Invoices> {
    if (id !== "all")
      return this.http.get<Invoices>(apiUrl + "/Invoices/" + id);
    return this.http.get<Invoices[]>(apiUrl + "/Invoices");
  }

  /**
   * @description
   * Update specific Invoices data with id,
   *  and update all parts of input data (patch)
   *
   * @param id
   * @param data
   * @returns
   */
  public updateInvoices(id: string, data: any) {
    return this.http.patch(apiUrl + "/Invoices/" + id, data);
  }

  /**
   * @description
   * Delete specific Invoices data with id
   *
   * @param id
   * @returns
   */
  public deleteInvoices(id: string) {
    return this.http.delete(apiUrl + "/Invoices/" + id);
  }
/**
     * @description
     * Contracts Create methods
     * insert new Contracts data with Contracts format
     *
     * @param data
     * @returns
     */
 public createContracts(data: Contracts) {
  return this.http.post(apiUrl + "/Contracts", data);
}
/**
 * @description
 * if input id is all, return all Contracts data
 * if input id is number, return Contracts data with this id
 *
 * @param id default "all"
 * @returns Observable<Contracts[] | Contracts>
 */
public getContracts(
  id: string = "all"
): Observable<Contracts[] | Contracts> {
  if (id !== "all")
    return this.http.get<Contracts>(apiUrl + "/Contracts/" + id);
  return this.http.get<Contracts[]>(apiUrl + "/Contracts");
}

/**
 * @description
 * Update specific Contracts data with id,
 *  and update all parts of input data (patch)
 *
 * @param id
 * @param data
 * @returns
 */
public updateContracts(id: string, data: any) {
  return this.http.patch(apiUrl + "/Contracts/" + id, data);
}

/**
 * @description
 * Delete specific Contracts data with id
 *
 * @param id
 * @returns
 */
public deleteContracts(id: string) {
  return this.http.delete(apiUrl + "/Contracts/" + id);
}
  /**
   * @description
   * get codelookup
   *
   * @param source
   * @returns
   */
  public getCodeLookup(source: string) {
    return this.http.get(apiUrl + "/CodeLookup/" + source);
  }
  /**
  * @description
  * get menu
  *
  * @param source
  * @returns
  */
  public getLoginMenus() {
    return this.http.get(apiUrl + "/menus");
  }
  public getMenulist() {
    return this.http.get(apiUrl + "/loginmenus");
  }
  /**
 * @description
 * get menu
 *
 * @param source
 * @returns
 */
  public switchrole(role_id) {
    return this.http.post<{ token: string }>(apiUrl + "/switchrole", { role_id : role_id });
  }
  public getRoles() {
    return this.http.get<any[]>(apiUrl + "/getroles");
  }
  public getpsbasicinfoCompare(data = null) {
    return this.http.post<any[]>(apiUrl + "/psbasicinfoimport/getmodify", data);
  }
  public updatepsbasicinfoCompare(data) {
    return this.http.post<any[]>(apiUrl + "/psbasicinfoimport",data);
  }

  /**
   * @description
   * Upload multiple files
   *
   * @param formData
   * @returns
   */
/// 1. 取得檔案清單
  getimagelist(controller: string, category: string, id: number): Observable<any[]> {
    return this.http.get<any[]>(`${apiUrl}/${controller}/${id}/images/${category}`);
  }

  // 2. 上傳檔案 (支援進度條)
  uploadFiles(controller: string, id: number, category: string, formData: FormData): Observable<HttpEvent<any>> {
    const req = new HttpRequest('POST', `${apiUrl}/${controller}/${id}/images/${category}`, formData, {
      reportProgress: true,
      responseType: 'json'
    });
    return this.http.request(req);
  }

  // 3. 刪除檔案
  deleteFile(controller: string, id: number, category: string, fileName: string): Observable<any> {
    return this.http.delete(`${apiUrl}/${controller}/${id}/images/${category}/${fileName}`);
  }

  // 4. 下載檔案
  downloadFile(controller: string, id: number, category: string, fileName: string): Observable<any> {
    return this.http.get(`${apiUrl}/${controller}/${id}/images/${category}/${fileName}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }
  /**
   * @description
   * Get token with correct username and password
   *
   * @param Username
   * @param Password
   * @returns
   */
  loginGetToken(
    Username: string,
    Password: string
  ): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(apiUrl + "/login", {
      Username,
      Password,
    });
  }
  public refreshToken(username,token) {

    return this.http.post<{ token: string }>(apiUrl + "/refreshToken", {username:username,token:token});

  }
}
