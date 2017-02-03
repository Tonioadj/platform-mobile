import { Injectable } from '@angular/core';

import { Model, TEXT, INTEGER, DOUBLE, PRIMARY_KEY } from '../models/model';
import { Form } from '../models/form';

import { Table } from '../decorators/table';
import { Column } from '../decorators/column';

@Injectable()
@Table("attributes")
export class Attribute extends Model {

  constructor(values:any=null) {
    super(values);
    this.copyInto(values);
  }

  public newInstance<M extends Attribute>(values:any=null) : Attribute {
    return new Attribute(values);
  }

  @Column("id", INTEGER, PRIMARY_KEY)
  public id: number = null;

  @Column("deployment_id", INTEGER, PRIMARY_KEY)
  public deployment_id: number = null;

  @Column("form_id", INTEGER)
  public form_id: number = null;

  @Column("key", TEXT)
  public key: string = null;

  @Column("label", TEXT)
  public label: string = null;

  @Column("instructions", TEXT)
  public instructions: string = null;

  @Column("input", TEXT)
  public input: string = null;

  @Column("type", TEXT)
  public type: string = null;

  @Column("required", INTEGER)
  public required: boolean = null;

  @Column("priority", INTEGER)
  public priority: number = null;

  @Column("cardinality", INTEGER)
  public cardinality: number = null;

  @Column("options", TEXT)
  public options: string = null;

  @Column("saved", TEXT)
  public saved: Date = null;

  @Column("can_read", INTEGER)
  public can_read: boolean = null;

  @Column("can_create", INTEGER)
  public can_create: boolean = null;

  @Column("can_update", INTEGER)
  public can_update: boolean = null;

  @Column("can_delete", INTEGER)
  public can_delete: boolean = null;

  getOptions() : string[] {
    if (this.options == null) {
      return [];
    }
    else if (Array.isArray(this.options)) {
      return this.options;
    }
    else {
      return this.options.split(',');
    }
  }
}