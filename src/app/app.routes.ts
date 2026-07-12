import { ProductDetail } from './components/products/product-detail/product-detail';
import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { WarehouseList } from './components/warehouse/warehouse-list/warehouse-list';
import { ProductTansfert } from './components/products/product-tansfert/product-tansfert';
import { ProductList } from './components/products/product-list/product-list';
import { WarehouseAudit } from './components/warehouse/warehouse-audit/warehouse-audit';
import { monGuard } from './components/auth/guards/auth.guard';

export const routes: Routes = [

  { path: 'login', component: Login },

  {
    path: '',component: Layout, canActivate: [monGuard],
    children: [
      {path: 'dashboard', component: Dashboard },
      {path: 'warehouses', component: WarehouseList },
      {path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {path: 'transferts', component: ProductTansfert},
      {path: 'products',component: ProductList},
      {path: 'warehouses/:id/audit', component: WarehouseAudit},
      {path: 'products/:id', component: ProductDetail}
    ],
  },

];
