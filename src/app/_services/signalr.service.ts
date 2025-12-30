import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: signalR.HubConnection;
  
  StartConnection = () => {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.apiUrl + "/chatHub")
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build()
      
    this.hubConnection
      .start()
      .then( () => console.log('SingalR Start'))
      .catch( err => console.log(`Error for => ${err}`))
  }

  ReceiveListener(): signalR.HubConnection | undefined {
    return this.hubConnection
  }
}
