import { animate, query, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  animations: [

    trigger('architectUIAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({
            opacity: 0,
            display: 'flex',
            flex: '1',
            transform: 'translateY(-20px)',
            flexDirection: 'column'

          }),
        ], { optional: true }),
        query(':enter', [
          animate('600ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
        ], { optional: true }),


      ]),
    ])
  ]
})
export class AdminLayoutComponent implements OnInit {

  ngOnInit() { }
}
