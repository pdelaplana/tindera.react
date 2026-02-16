import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Switch } from 'react-router-dom';
// Components
import AuthGuard from '@/components/AuthGuard';
import OwnerOnlyGuard from '@/components/OwnerOnlyGuard';
import SideMenu from '@/components/SideMenu';
// Contexts
import { AppProviders } from '@/contexts';
import AuthCallbackPage from '@/features/auth/AuthCallbackPage';
import LoginPage from '@/features/auth/LoginPage';
import LogoutPage from '@/features/auth/LogoutPage';
import MerchantWelcomePage from '@/features/auth/MerchantWelcomePage';
import SignupPage from '@/features/auth/SignupPage';
import {
  InventoryItemManagePage,
  InventoryItemTransactionsPage,
  InventoryListPage,
  InventoryTransactionDetailsPage,
  InventoryTransactionsPage,
  PackageSizesPage,
} from '@/features/inventory';
import { POSPage } from '@/features/pos';
import {
  ProductManagePage,
  ProductSalesPage,
  ProductsListPage,
} from '@/features/products';
import { OrderDetailPage, SalesListPage } from '@/features/sales';
import {
  DiscountTypeSettingsPage,
  GlobalModifierGroupManagePage,
  GlobalModifiersPage,
  InventoryCategoriesPage,
  ProductCategoriesPage,
  SettingsPage,
  ShopSettingsPage,
  ShopTeamPage,
  TaxSettingsPage,
  VoidRefundSettingsPage,
} from '@/features/settings';
import { ShopFormPage, ShopSelectionPage } from '@/features/shop';
// Pages
import Home from './features/Home';

// Note: All Ionic CSS and theme variables are imported in main.tsx via global.scss

setupIonicReact({ mode: 'md' });

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppProviders>
      <IonApp>
        <IonReactRouter>
          <SideMenu />
          <IonRouterOutlet id="main">
            <Switch>
              {/* Public Routes */}
              <Route exact path="/signin">
                <LoginPage />
              </Route>
              <Route exact path="/signup">
                <SignupPage />
              </Route>
              <Route exact path="/welcome">
                <MerchantWelcomePage />
              </Route>
              <Route exact path="/logout">
                <LogoutPage />
              </Route>
              <Route exact path="/auth/callback">
                <AuthCallbackPage />
              </Route>
              {/* Protected Routes */}
              <Route exact path="/shops/:shopId/home">
                <AuthGuard>
                  <Home />
                </AuthGuard>
              </Route>
              {/* Products Routes */}
              <Route exact path="/shops/:shopId/products">
                <AuthGuard>
                  <ProductsListPage />
                </AuthGuard>
              </Route>
              {/* Product Manage Page - MUST come before detail page to avoid route conflict */}
              <Route exact path="/shops/:shopId/products/:id/manage">
                <AuthGuard>
                  <ProductManagePage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/products/:id/sales">
                <AuthGuard>
                  <ProductSalesPage />
                </AuthGuard>
              </Route>
              {/* Inventory Routes */}
              <Route exact path="/shops/:shopId/inventory">
                <AuthGuard>
                  <InventoryListPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/inventory/transactions">
                <AuthGuard>
                  <InventoryTransactionsPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/inventory/:itemId/manage">
                <AuthGuard>
                  <InventoryItemManagePage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/inventory/:itemId/packages">
                <AuthGuard>
                  <PackageSizesPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/inventory/:itemId/transactions">
                <AuthGuard>
                  <InventoryItemTransactionsPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/inventory/:itemId/transactions/:transactionId">
                <AuthGuard>
                  <InventoryTransactionDetailsPage />
                </AuthGuard>
              </Route>
              {/* POS Routes */}
              <Route exact path="/pos">
                <AuthGuard>
                  <POSPage />
                </AuthGuard>
              </Route>
              {/* Sales Routes */}
              <Route exact path="/shops/:shopId/sales">
                <AuthGuard>
                  <SalesListPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/sales/:orderId">
                <AuthGuard>
                  <OrderDetailPage />
                </AuthGuard>
              </Route>
              {/* Settings Routes */}
              <Route exact path="/shops/:shopId/settings">
                <AuthGuard>
                  <SettingsPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/settings/shop">
                <AuthGuard>
                  <ShopSettingsPage />
                </AuthGuard>
              </Route>
              {/* Settings — Products */}
              <Route exact path="/shops/:shopId/settings/products/categories">
                <AuthGuard>
                  <ProductCategoriesPage />
                </AuthGuard>
              </Route>
              {/* Modifier Group Manage - MUST come before list route */}
              <Route exact path="/shops/:shopId/settings/products/modifiers/:id/manage">
                <AuthGuard>
                  <GlobalModifierGroupManagePage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/settings/products/modifiers">
                <AuthGuard>
                  <GlobalModifiersPage />
                </AuthGuard>
              </Route>

              {/* Settings — Inventory */}
              <Route exact path="/shops/:shopId/settings/inventory/categories">
                <AuthGuard>
                  <InventoryCategoriesPage />
                </AuthGuard>
              </Route>

              {/* Settings — POS Configuration */}
              <Route exact path="/shops/:shopId/settings/pos/taxes">
                <AuthGuard>
                  <TaxSettingsPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/settings/pos/discounts">
                <AuthGuard>
                  <DiscountTypeSettingsPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/settings/pos/void-refund">
                <AuthGuard>
                  <VoidRefundSettingsPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/settings/team">
                <AuthGuard>
                  <OwnerOnlyGuard>
                    <ShopTeamPage />
                  </OwnerOnlyGuard>
                </AuthGuard>
              </Route>
              {/* Shop Routes */}
              <Route exact path="/shops">
                <AuthGuard>
                  <ShopSelectionPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:id">
                <AuthGuard>
                  <ShopFormPage />
                </AuthGuard>
              </Route>
              {/* Default Redirect */}
              <Route exact path="/">
                <Redirect to="/shops" />
              </Route>
            </Switch>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </AppProviders>
  </QueryClientProvider>
);

export default App;
