import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Switch } from 'react-router-dom';
// Components
import AuthGuard from '@/components/AuthGuard';
import SideMenu from '@/components/SideMenu';
// Contexts
import { AppProviders } from '@/contexts';
import LoginPage from '@/pages/Auth/LoginPage';
import LogoutPage from '@/pages/Auth/LogoutPage';
import SignupPage from '@/pages/Auth/SignupPage';
import {
  InventoryCategoriesListPage,
  InventoryItemManagePage,
  InventoryListPage,
  InventoryTransactionDetailsPage,
  PackageSizesPage,
} from '@/pages/Inventory';
import { POSPage } from '@/pages/POS';
import {
  CategoriesListPage,
  ModifierGroupManagePage,
  ModifiersListPage,
  ProductManagePage,
  ProductsListPage,
} from '@/pages/Products';
import { SettingsPage } from '@/pages/Settings';
import { ShopFormPage, ShopSelectionPage } from '@/pages/Shop';
// Pages
import Home from './pages/Home';

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
              <Route exact path="/logout">
                <LogoutPage />
              </Route>
              {/* Protected Routes */}
              <Route exact path="/shops/:shopId/home">
                <AuthGuard>
                  <Home />
                </AuthGuard>
              </Route>
              {/* Products Routes */}
              <Route exact path="/shops/:shopId/products/categories">
                <AuthGuard>
                  <CategoriesListPage />
                </AuthGuard>
              </Route>{' '}
              {/* Modifier Group Manage Page - MUST come before list page to avoid route conflict */}
              <Route exact path="/shops/:shopId/modifiers/:id/manage">
                <AuthGuard>
                  <ModifierGroupManagePage />
                </AuthGuard>
              </Route>{' '}
              <Route exact path="/shops/:shopId/modifiers">
                <AuthGuard>
                  <ModifiersListPage />
                </AuthGuard>
              </Route>
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
              {/* Inventory Routes */}
              <Route exact path="/shops/:shopId/inventory">
                <AuthGuard>
                  <InventoryListPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/inventory/categories">
                <AuthGuard>
                  <InventoryCategoriesListPage />
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
              {/* Settings Routes */}
              <Route exact path="/shops/:shopId/settings">
                <AuthGuard>
                  <SettingsPage />
                </AuthGuard>
              </Route>
              <Route exact path="/shops/:shopId/settings/shop">
                <AuthGuard>
                  <ShopFormPage />
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
