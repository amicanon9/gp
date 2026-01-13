import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: signalR.HubConnection;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    // 1. 在建構子就先初始化 HubConnection 配置，但不啟動
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.apiUrl + "/chatHub")
      .withAutomaticReconnect() // 自動重連：0, 2, 10, 30秒
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }

  /**
   * 啟動連線（具備保護機制，防止重複啟動）
   */
  StartConnection(): Promise<void> {
    // 2. 如果已經在 Connected 狀態，直接回傳成功
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }

    // 3. 如果正在連線中，回傳同一個 Promise，避免重複調用 start()
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Started (State: ' + this.hubConnection.state + ')');
        this.connectionPromise = null; // 連線成功後清除暫存的 Promise
      })
      .catch(err => {
        this.connectionPromise = null;
        console.error(`SignalR Connection Error: ${err}`);
        throw err;
      });

    return this.connectionPromise;
  }

  /**
   * 取得連線實體以進行監聽
   */
  get Hub(): signalR.HubConnection {
    return this.hubConnection;
  }
}