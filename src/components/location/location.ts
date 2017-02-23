import { Component, Output, EventEmitter } from '@angular/core';
import { Geolocation, GeolocationOptions, Geoposition } from 'ionic-native';
import { FormGroup } from '@angular/forms';

import { Value } from '../../models/value';
import { Attribute } from '../../models/attribute';

import { LoggerService } from '../../providers/logger-service';

import { GOOGLE_API_KEY } from '../../helpers/constants';

@Component({
  selector: 'field-location',
  templateUrl: 'location.html',
  inputs: ['value', 'attribute', 'formGroup', 'submitted']
})
export class LocationComponent {

  key: string = GOOGLE_API_KEY;
  formGroup: FormGroup;
  attribute: Attribute = null;
  value: Value = null;
  latitude: number = null;
  longitude: number = null;
  submitted: boolean = false;
  error: boolean = false;

  @Output()
  changeLocation = new EventEmitter();

  constructor(public logger:LoggerService) {

  }

  ngOnInit() {
    this.logger.info(this, "Attribute", this.attribute, "Value", this.value);
    if (this.value && this.value.value) {
      let location:any = this.value.value.split(",");
      this.latitude = Number(location[0]);
      this.longitude = Number(location[1]);
    }
    else {
      this.detectLocation();
    }
  }

  ngAfterContentChecked() {
    if (this.value && this.value.value && this.value.value.length > 0) {
      let location:any = this.value.value.split(",");
      let latitude = Number(location[0]);
      let longitude = Number(location[1]);
      if (this.latitude != latitude) {
        this.latitude = latitude;
      }
      if (this.longitude != longitude) {
        this.longitude = longitude;
      }
    }
  }

  detectLocation() {
    this.logger.info(this, "detectLocation");
    let options:GeolocationOptions = {
      timeout: 6000,
      enableHighAccuracy: true };
    Geolocation.getCurrentPosition(options).then(
      (position:Geoposition) => {
        this.logger.info(this, "detectLocation", "Position", position);
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.error = false;
      },
      (error) => {
        this.logger.error(this, "detectLocation", "Error", error);
        this.latitude = null;
        this.longitude = null;
        this.error = true;
      }).catch(
        (error) => {
          this.logger.error(this, "detectLocation", "Error", error);
          this.latitude = null;
          this.longitude = null;
          this.error = true;
      });
  }

  updateLocation(event) {
    this.logger.info(this, "updateLocation");
    this.changeLocation.emit({
      latitude: this.latitude,
      longitude: this.longitude});
  }
}
