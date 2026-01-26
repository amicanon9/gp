import { LoginMenus } from './../_models/loginmenus';
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Currency } from "app/_models/currency";
import { Invoices } from "app/_models/invoices";
import { LoginRoles } from "app/_models/loginroles";
import { Organizations } from "app/_models/organizations";
import { ProformaInvoices } from "app/_models/proformainvoices";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';

const apiUrl = environment.apiUrl + '/droplist';

@Injectable({
  providedIn: "root",
})
export class DroplistService {
  constructor(private http: HttpClient) { }


  /**
   * @description
   * psbasicinfo Read methods
   * if input id is all, return all psbasicinfo data
   * if input id is number, return customer data with this id
   *
   * @param id default "all"
   * @returns Observable<psbasicinfo[] | psbasicinfo>
   */
  public getpsbasicinfo(
    id: string = "all"
  ): Observable<any[] | any> {
    if (id !== "all")
      return this.http.get<any>(apiUrl + "/psbasicinfo/" + id);
    return this.http.get<any[]>(apiUrl + "/psbasicinfo");
  }


  /**
   * @description
   * Organizations Read methods
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
   * LoginRoles Read methods
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
   * Currency Read methods
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
   * ProformaInvoices Read methods
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
      return this.http.get<ProformaInvoices>(apiUrl + "/ProformaInvoices/" + id);
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
   * Invoices Read methods
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
    return this.http.get<LoginMenus>(apiUrl + "/menus");
  }
  /**
    * @description
    * get menu
    *
    * @param source
    * @returns
    */
  public getMenulist() {
    return this.http.get(apiUrl + "/loginmenus");
  }
  /**
   * @description
   * 拿案場清單
   *
   * @param 
   * @returns
   */
  public getHearders() {
    return this.http.get(apiUrl + "/headers");
  }

}
