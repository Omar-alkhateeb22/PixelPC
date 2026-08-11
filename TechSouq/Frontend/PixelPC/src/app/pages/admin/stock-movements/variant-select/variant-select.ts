import { Component, forwardRef, input, signal, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { VariantOption } from '../../../../core/models/product.models';

interface NavItem {
  id: number | null;
  label: string;
}

@Component({
  selector: 'app-variant-select',
  imports: [],
  templateUrl: './variant-select.html',
  styleUrl: './variant-select.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VariantSelect),
      multi: true,
    },
  ],
})
export class VariantSelect implements ControlValueAccessor {
  readonly options = input<VariantOption[]>([]);
  readonly loading = input(false);
  readonly allowClear = input(false);
  readonly clearLabel = input('بدون تصفية');
  readonly placeholder = input('ابحث عن اسم المنتج أو SKU...');

  readonly searchText = signal('');
  readonly isOpen = signal(false);
  readonly highlightedIndex = signal(0);
  readonly value = signal<number | null>(null);
  readonly disabled = signal(false);

  private onChangeFn: (value: number | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  readonly filteredOptions = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const all = this.options();
    if (!query) return all;
    return all.filter((option) => option.label.toLowerCase().includes(query));
  });

  readonly navItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [];
    if (this.allowClear()) {
      items.push({ id: null, label: this.clearLabel() });
    }
    for (const option of this.filteredOptions()) {
      items.push({ id: option.id, label: option.label });
    }
    return items;
  });

  writeValue(value: number | null): void {
    this.value.set(value);
    this.syncDisplayText();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onFocus(event: FocusEvent): void {
    this.isOpen.set(true);
    this.highlightedIndex.set(0);
    (event.target as HTMLInputElement).select();
  }

  onInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
    this.isOpen.set(true);
    this.highlightedIndex.set(0);
  }

  onBlur(): void {
    this.onTouchedFn();
    window.setTimeout(() => {
      this.isOpen.set(false);
      this.syncDisplayText();
    }, 150);
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.navItems();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isOpen.set(true);
      this.highlightedIndex.update((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      if (this.isOpen() && items.length > 0) {
        event.preventDefault();
        this.selectItem(items[Math.min(this.highlightedIndex(), items.length - 1)]);
      }
    } else if (event.key === 'Escape') {
      this.isOpen.set(false);
      this.syncDisplayText();
    }
  }

  selectItem(item: NavItem): void {
    this.value.set(item.id);
    this.searchText.set(item.id === null ? '' : item.label);
    this.isOpen.set(false);
    this.onChangeFn(item.id);
    this.onTouchedFn();
  }

  private syncDisplayText(): void {
    const match = this.options().find((option) => option.id === this.value());
    this.searchText.set(match ? match.label : '');
  }
}
