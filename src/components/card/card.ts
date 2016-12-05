import { Component, Input } from '@angular/core';

// import { Gravatar } from 'ng2-gravatar-directive';

import { NiceTime } from '../../pipes/nice-time';

@Component({
  selector: 'response-card',
  templateUrl: 'card.html',
  inputs: ['response', 'index']
})
export class CardComponent {

  index: number = 0;
  response: any = {};

  constructor() {
    console.log('Card Component');
  }

  ngOnInit() {
  }

  cardSelected(event) {
    console.log('Card cardSelected');
  }

  menuSelected(event) {
    console.log('Card menuSelected');
  }
}