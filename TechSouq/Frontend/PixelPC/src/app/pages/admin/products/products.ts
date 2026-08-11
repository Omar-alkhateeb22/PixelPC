import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ProductService } from '../../../core/services/product-service';
import { CategoryService } from '../../../core/services/category-service';
import { Product, ProductDetail, ProductVariant, VariantRequest } from '../../../core/models/product.models';
import { Category } from '../../../core/models/category.models';
import { buildImageUrl } from '../../../core/utils/image';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface VariantAttributes {
  ram: string;
  storage: string;
  color: string;
}

type VariantFormGroup = FormGroup<{
  stockKeepingUnit: import('@angular/forms').FormControl<string>;
  ram: import('@angular/forms').FormControl<string>;
  storage: import('@angular/forms').FormControl<string>;
  color: import('@angular/forms').FormControl<string>;
  price: import('@angular/forms').FormControl<number>;
  stockQuantity: import('@angular/forms').FormControl<number>;
  reorderLevel: import('@angular/forms').FormControl<number>;
}>;

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(true);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly editingId = signal<number | null>(null);

  // Variants: a flat section below the products table (never nested inside it),
  // plus a single modal shared by add/edit so the two states can never collide.
  readonly selectedProductId = signal<number | null>(null);
  readonly productDetail = signal<ProductDetail | null>(null);
  readonly variantsLoading = signal(false);

  readonly showVariantModal = signal(false);
  readonly editingVariantId = signal<number | null>(null);
  readonly variantForm = signal<VariantFormGroup | null>(null);
  readonly isSavingVariant = signal(false);

  readonly selectedProduct = computed(
    () => this.products().find((p) => p.id === this.selectedProductId()) ?? null,
  );

  readonly editingProduct = computed(
    () => this.products().find((p) => p.id === this.editingId()) ?? null,
  );

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', Validators.required),
    brand: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.nonNullable.control('', Validators.required),
    // Starts disabled — there's nothing valid to pick until categories load.
    // Enabled/disabled imperatively in loadCategories(), never via a template
    // [disabled] binding, since that conflicts with the formControlName directive.
    categoryId: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
  });

  readonly buildImageUrl = buildImageUrl;

  // Ids of products whose imageUrl failed to load, so a broken URL falls back
  // to the placeholder instead of the browser's broken-image icon.
  readonly brokenImageIds = signal<Set<number>>(new Set());

  onImageError(productId: number): void {
    this.brokenImageIds.update((ids) => new Set(ids).add(productId));
  }

  // The file picker isn't part of the reactive form (file inputs can't be value-bound),
  // so its selection, local preview, and validation state live here instead.
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageError.set('صيغة الملف غير مدعومة. الصيغ المسموحة: JPG، PNG، WEBP.');
      input.value = '';
      return;
    }

    this.imageError.set(null);

    if (this.imagePreviewUrl()) {
      URL.revokeObjectURL(this.imagePreviewUrl()!);
    }
    this.selectedImageFile.set(file);
    this.imagePreviewUrl.set(URL.createObjectURL(file));
  }

  private clearSelectedImage(): void {
    if (this.imagePreviewUrl()) {
      URL.revokeObjectURL(this.imagePreviewUrl()!);
    }
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    this.imageError.set(null);

    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  ngOnInit(): void {
    this.load();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.form.controls.categoryId.disable();

    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categoriesLoading.set(false);
        if (categories.length > 0) {
          this.form.controls.categoryId.enable();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.categoriesLoading.set(false);
        this.errorMessage.set(`تعذر تحميل التصنيفات: ${this.extractErrorMessage(err)}`);
      },
    });
  }

  private createVariantFormGroup(): VariantFormGroup {
    return this.fb.nonNullable.group({
      stockKeepingUnit: ['', Validators.required],
      ram: [''],
      storage: [''],
      color: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [0, [Validators.required, Validators.min(0)]],
    });
  }

  private buildAttributesJson(attrs: VariantAttributes): string {
    const result: Record<string, string> = {};
    if (attrs.ram.trim()) result['ram'] = attrs.ram.trim();
    if (attrs.storage.trim()) result['storage'] = attrs.storage.trim();
    if (attrs.color.trim()) result['color'] = attrs.color.trim();
    return JSON.stringify(result);
  }

  private parseAttributesJson(json: string | null | undefined): VariantAttributes {
    try {
      const parsed = JSON.parse(json || '{}');
      return {
        ram: typeof parsed.ram === 'string' ? parsed.ram : '',
        storage: typeof parsed.storage === 'string' ? parsed.storage : '',
        color: typeof parsed.color === 'string' ? parsed.color : '',
      };
    } catch {
      return { ram: '', storage: '', color: '' };
    }
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.brokenImageIds.set(new Set());

    this.productService.getAll().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  startEdit(product: Product): void {
    if (this.categoriesLoading()) {
      return;
    }

    this.editingId.set(product.id);
    this.clearSelectedImage();
    this.form.setValue({
      name: product.name,
      brand: product.brand,
      description: product.description,
      categoryId: product.categoryId,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.clearSelectedImage();
    this.form.reset({ name: '', brand: '', description: '', categoryId: null });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const raw = this.form.getRawValue();
    const editingId = this.editingId();
    const data = {
      name: raw.name,
      brand: raw.brand,
      description: raw.description,
      categoryId: raw.categoryId!,
      // Preserve the existing image on an edit where no new file was picked —
      // UpdateProduct overwrites ImageUrl unconditionally, so omitting it here
      // would silently wipe out the product's photo.
      imageUrl: editingId ? (this.editingProduct()?.imageUrl ?? undefined) : undefined,
    };

    const request = editingId
      ? this.productService.update(editingId, data)
      : this.productService.create(data);

    request.subscribe({
      next: (product) => {
        const productId = editingId ?? product.id;
        const file = this.selectedImageFile();

        if (!file) {
          this.isSubmitting.set(false);
          this.cancelEdit();
          this.load();
          return;
        }

        this.productService.uploadImage(productId, file).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.cancelEdit();
            this.load();
          },
          error: (err: HttpErrorResponse) => {
            this.isSubmitting.set(false);
            this.errorMessage.set(`تم حفظ بيانات المنتج، لكن تعذر رفع الصورة: ${this.extractErrorMessage(err)}`);
            this.cancelEdit();
            this.load();
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`هل أنت متأكد من حذف المنتج "${product.name}"؟`)) {
      return;
    }

    this.errorMessage.set(null);

    this.productService.delete(product.id).subscribe({
      next: () => {
        if (this.selectedProductId() === product.id) {
          this.selectedProductId.set(null);
          this.productDetail.set(null);
        }
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  selectProductForVariants(product: Product): void {
    if (this.selectedProductId() === product.id) {
      this.selectedProductId.set(null);
      this.productDetail.set(null);
      return;
    }

    this.selectedProductId.set(product.id);
    this.loadProductDetail(product.id);
  }

  closeVariantsSection(): void {
    this.selectedProductId.set(null);
    this.productDetail.set(null);
  }

  private loadProductDetail(productId: number): void {
    this.variantsLoading.set(true);
    this.errorMessage.set(null);

    this.productService.getById(productId).subscribe({
      next: (detail) => {
        this.productDetail.set(detail);
        this.variantsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.variantsLoading.set(false);
      },
    });
  }

  openAddVariantModal(): void {
    this.editingVariantId.set(null);
    this.variantForm.set(this.createVariantFormGroup());
    this.showVariantModal.set(true);
  }

  openEditVariantModal(variant: ProductVariant): void {
    // Build and fully populate a brand-new form before it's ever published to the
    // template, so the template can never observe a freshly-created-but-empty instance.
    const attrs = this.parseAttributesJson(variant.attributesJson);
    const group = this.createVariantFormGroup();
    group.setValue({
      stockKeepingUnit: variant.stockKeepingUnit,
      ram: attrs.ram,
      storage: attrs.storage,
      color: attrs.color,
      price: variant.price,
      stockQuantity: variant.stockQuantity,
      reorderLevel: variant.reorderLevel,
    });

    this.editingVariantId.set(variant.id);
    this.variantForm.set(group);
    this.showVariantModal.set(true);
  }

  closeVariantModal(): void {
    this.showVariantModal.set(false);
    this.editingVariantId.set(null);
    this.variantForm.set(null);
  }

  submitVariantModal(): void {
    const productId = this.selectedProductId();
    const form = this.variantForm();

    if (!productId || !form || form.invalid) {
      form?.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSavingVariant.set(true);

    const data = this.toVariantRequest(form);
    const editingVariantId = this.editingVariantId();

    const request = editingVariantId
      ? this.productService.updateVariant(editingVariantId, data)
      : this.productService.createVariant(productId, data);

    request.subscribe({
      next: () => {
        this.isSavingVariant.set(false);
        this.closeVariantModal();
        this.loadProductDetail(productId);
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingVariant.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  deleteVariant(variant: ProductVariant): void {
    const productId = this.selectedProductId();
    if (!productId || !confirm(`هل أنت متأكد من حذف النسخة "${variant.stockKeepingUnit}"؟`)) {
      return;
    }

    this.errorMessage.set(null);

    this.productService.deleteVariant(variant.id).subscribe({
      next: () => {
        if (this.editingVariantId() === variant.id) {
          this.closeVariantModal();
        }
        this.loadProductDetail(productId);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  private toVariantRequest(form: VariantFormGroup): VariantRequest {
    const raw = form.getRawValue();
    return {
      stockKeepingUnit: raw.stockKeepingUnit,
      attributesJson: this.buildAttributesJson({ ram: raw.ram, storage: raw.storage, color: raw.color }),
      price: raw.price,
      stockQuantity: raw.stockQuantity,
      reorderLevel: raw.reorderLevel,
    };
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      return String((err.error as { message: unknown }).message);
    }

    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  }
}
