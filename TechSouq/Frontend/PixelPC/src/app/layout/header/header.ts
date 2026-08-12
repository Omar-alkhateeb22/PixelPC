import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../core/services/auth';
import { CartService } from '../../core/services/cart-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly auth = inject(Auth);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isAdmin = this.auth.isAdmin;
  readonly cartItemCount = this.cartService.itemCount;

  constructor() {
    // Header is mounted once outside <router-outlet>, so it never re-runs
    // ngOnInit on navigation — watch auth state directly instead.
    effect(() => {
      if (this.isLoggedIn() && !this.isAdmin()) {
        this.cartService.refreshCount();
      } else {
        this.cartService.resetCount();
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
