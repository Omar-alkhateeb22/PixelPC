import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { CategoryService } from '../../../core/services/category-service';
import { Category } from '../../../core/models/category.models';

const FIXED_CATEGORY_NAMES = [
  'Gaming Laptops',
  'Programming Laptops',
  'Desktop PCs',
  'Gaming Keyboards',
  'Gaming Mice',
  'Monitors',
  'Gaming Headsets',
];

export const OTHER_OPTION_VALUE = '__other__';

@Component({
  selector: 'app-categories',
  imports: [ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly isOtherSelected = signal(false);

  readonly otherOptionValue = OTHER_OPTION_VALUE;

  readonly form = this.fb.nonNullable.group({
    categoryOption: ['', Validators.required],
    customName: [''],
  });

  // Fixed names already used by OTHER categories are excluded; the category
  // currently being edited keeps its own name available so pre-fill/re-save still works.
  readonly availableCategoryNames = computed(() => {
    const editingId = this.editingId();
    const editingName = this.categories().find((c) => c.id === editingId)?.name;
    const used = new Set(this.categories().map((c) => c.name));

    return FIXED_CATEGORY_NAMES.filter((name) => !used.has(name) || name === editingName);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  onCategoryOptionChange(): void {
    const isOther = this.form.controls.categoryOption.value === OTHER_OPTION_VALUE;
    this.isOtherSelected.set(isOther);

    const customNameControl = this.form.controls.customName;
    if (isOther) {
      customNameControl.addValidators(Validators.required);
    } else {
      customNameControl.clearValidators();
      customNameControl.setValue('');
    }
    customNameControl.updateValueAndValidity();
  }

  startEdit(category: Category): void {
    this.editingId.set(category.id);

    if (FIXED_CATEGORY_NAMES.includes(category.name)) {
      this.isOtherSelected.set(false);
      this.form.controls.customName.clearValidators();
      this.form.setValue({ categoryOption: category.name, customName: '' });
    } else {
      this.isOtherSelected.set(true);
      this.form.controls.customName.addValidators(Validators.required);
      this.form.setValue({ categoryOption: OTHER_OPTION_VALUE, customName: category.name });
    }
    this.form.controls.customName.updateValueAndValidity();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.isOtherSelected.set(false);
    this.form.controls.customName.clearValidators();
    this.form.controls.customName.updateValueAndValidity();
    this.form.reset({ categoryOption: '', customName: '' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const raw = this.form.getRawValue();
    const name = raw.categoryOption === OTHER_OPTION_VALUE ? raw.customName.trim() : raw.categoryOption;

    const editingId = this.editingId();
    const request = editingId
      ? this.categoryService.update(editingId, { name })
      : this.categoryService.create({ name });

    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.cancelEdit();
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  deleteCategory(category: Category): void {
    if (!confirm(`هل أنت متأكد من حذف التصنيف "${category.name}"؟`)) {
      return;
    }

    this.errorMessage.set(null);

    this.categoryService.delete(category.id).subscribe({
      next: () => this.load(),
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  }
}
