import { Component, Input, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
@Component({
  selector: 'lib-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true
    }
  ]
})
export class MultiSelectComponent implements OnChanges, ControlValueAccessor {
  @Input() dataSource: any[];
  @Input() disabled = false;
  @Input() valueProperty: string;
  @Input() textProperty: string;
  @Input() pureValue = true;

  // tslint:disable-next-line:variable-name
  _value: string[];

  items: any[];
  selected: any[];
  select: FormControl;

  constructor() {
    this.select = new FormControl(null);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dataSource) {
      const option = {};
      this.setValue(option, null);
      this.setText(option, '請選擇');

      if (this.dataSource) {
        this.dataSource = [option, ...this.dataSource];
      } else {
        this.dataSource = [option];
      }
      this.setItems();
      this.setSelected();
    }
  }

  unselectAll() {
    this._value = null;
    this.setItems();
    this.setSelected();
    if (this.selected.length > 0) {
      if (this.pureValue) {
        this.propagateChange(this._value);
      } else {
        this.propagateChange(this.selected);
      }
    } else {
      this.propagateChange(null);
    }
  }

  selectAll() {
    if (this.dataSource) {
      this._value = this.dataSource.filter(a => this.getValue(a))
        .map(a => this.getValue(a));
      this.setSelected();
      this.setItems();
    }
    if (this.selected.length > 0) {
      if (this.pureValue) {
        this.propagateChange(this._value);
      } else {
        this.propagateChange(this.selected);
      }
    } else {
      this.propagateChange(null);
    }
  }

  selectSingle() {
    if (!this.select.value) {
      return;
    }
    if (!this._value) {
      this._value = [];
    }
    this._value.push(this.select.value);
    this.setItems();
    this.setSelected();
    const hasValue = this.items[0];
    if (hasValue.length > 0) {
      this.select.setValue(this.getValue(hasValue[0]));
    }
    if (this.selected.length > 0) {
      if (this.pureValue) {
        this.propagateChange(this._value);
      } else {
        this.propagateChange(this.selected);
      }
    } else {
      this.propagateChange(null);
    }
  }

  remove(item: any) {

    this._value = [...this._value.filter(a => a !== this.getValue(item))];
    this.setItems();
    this.setSelected();

    const hasValue = this.items.filter(a => this.getValue(a));
    if (hasValue.length > 0) {
      this.select.setValue(this.getValue(hasValue[0]));
    }

    if (this.selected.length > 0) {
      if (this.pureValue) {
        this.propagateChange(this._value);
      } else {
        this.propagateChange(this.selected);
      }
    } else {
      this.propagateChange(null);
    }
  }

  setItems() {
    if (this.dataSource && this._value) {
      if (this._value) {
        this.items = this.dataSource.filter(a => this._value.indexOf(this.getValue(a)) === -1);
      } else {
        this.items = this.dataSource;
      }
    } else {
      this.items = this.dataSource;
    }
  }

  setSelected() {
    if (this.dataSource) {
      if (this._value) {
        const result = [];
        this._value.forEach(a => {
          result.push(this.dataSource.find(b => this.getValue(b) === a));
        });
        this.selected = result;
      } else {
        this.selected = [];
      }
    }
  }

  onChange() {
    this.selectSingle();
  }

  getValue(data: any): any {
    if (data !== null) {
      if (this.valueProperty) {
        const value = data[this.valueProperty];
        return value;
      } else {
        return data.value;
      }
    }
  }

  setValue(data: any, value: any): void {
    if (data !== null) {
      if (this.valueProperty) {
        data[this.valueProperty] = value;
      } else {
        data.value = value;
      }
    }
  }

  getText(data: any) {
    if (data != null) {
      if (this.textProperty) {
        const value = data[this.textProperty];
        return value;
      } else {
        return data.text;
      }
    }
  }
  setText(data: any, text: any): void {
    if (data !== null) {
      if (this.textProperty) {
        data[this.textProperty] = text;
      } else {
        data.text = text;
      }
    }
  }

  propagateChange = (_: any) => { };

  writeValue(obj: any[]): void {
    if (obj !== undefined) {
      if (obj !== null) {

        if (this.pureValue) {
          this._value = obj;
        } else {
          this._value = (obj as any[]).map(a => this.getValue(a));
        }
      } else {
        this._value = null;
      }
      this.setItems();
      this.setSelected();
    }
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {

  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
