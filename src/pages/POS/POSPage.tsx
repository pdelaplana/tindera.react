// POSPage - Main order-taking screen

import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { cartOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
// Layout
import { POSLayout } from '@/components/layouts';
// POS Components
import {
  CartPanel,
  CategoryPillScroller,
  CategorySidebar,
  CheckoutModal,
  ProductCard,
  ProductCustomizationModal,
} from '@/components/pos';
// UI Components
import { BottomSheet } from '@/components/ui';
import { useIsMobile, useIsTabletOrLarger } from '@/hooks/useBreakpoint';
import { useCart } from '@/hooks/useCart';
// Hooks
import { useProductCategories, useProducts } from '@/hooks/useProduct';
import { productService } from '@/services/product.service';
import type { CartItemAddon, CartItemModifier, Product, ProductWithDetails } from '@/types';

const POSPage: React.FC = () => {
  const history = useHistory();
  const isMobile = useIsMobile();
  const isTablet = useIsTabletOrLarger();

  // Cart state
  const {
    items,
    itemCount,
    subtotal,
    totals,
    currency,
    isEmpty,
    addToCart,
    removeFromCart,
    updateQuantity,
    customerName,
    getItem,
    clearCart,
  } = useCart();

  // Category filter state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Mobile cart sheet state
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customization modal state
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<ProductWithDetails | null>(
    null
  );
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);

  // Checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Fetch products and categories
  const { data: categories = [], isLoading: categoriesLoading } = useProductCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts(
    selectedCategoryId ? { categoryId: selectedCategoryId } : undefined
  );

  const isLoading = categoriesLoading || productsLoading;

  // Handle product tap - check for modifiers/addons then add to cart
  const handleProductTap = async (product: (typeof products)[0]) => {
    // Fetch product details to check for modifiers and addons
    const { data: productDetails } = await productService.getProduct(product.id);

    const hasCustomization =
      (productDetails?.linkedModifierGroups?.length ?? 0) > 0 || (productDetails?.addons.length ?? 0) > 0;

    if (hasCustomization) {
      // Product has modifiers or addons - show modal
      setSelectedProduct(product);
      setSelectedProductDetails(productDetails);
      setEditingCartItemId(null);
      setCustomizationModalOpen(true);
    } else {
      // No customization - add directly to cart with empty configuration
      addToCart(product, 1, [], []);
    }
  };

  // Handle product long press - open quantity modal (to be implemented in Phase 7)
  const handleProductLongPress = (product: (typeof products)[0]) => {
    // TODO: Open quantity adjustment modal
    console.log('Long press on:', product.name);
  };

  // Handle editing cart item modifiers/addons
  const handleEditCartItem = async (cartItemId: string) => {
    const cartItem = getItem(cartItemId);
    if (!cartItem) return;

    // Fetch product details to check if it has modifiers or addons
    const { data: productDetails } = await productService.getProduct(cartItem.product_id);

    const hasCustomization =
      (productDetails?.linkedModifierGroups?.length ?? 0) > 0 || (productDetails?.addons.length ?? 0) > 0;

    if (hasCustomization) {
      // Product has modifiers or addons - show modal for editing
      setSelectedProduct(cartItem.product);
      setSelectedProductDetails(productDetails);
      setEditingCartItemId(cartItemId);
      setCustomizationModalOpen(true);
    }
    // If no customization, do nothing (no need to edit)
  };

  // Handle customization modal save
  const handleCustomizationModalSave = (
    selectedAddons: CartItemAddon[],
    selectedModifiers: CartItemModifier[]
  ) => {
    if (!selectedProduct) return;

    if (editingCartItemId) {
      // Editing existing cart item
      // Remove the old item and add a new one with the new configuration
      // (Different configurations are separate line items)
      const existingItem = getItem(editingCartItemId);
      if (existingItem) {
        removeFromCart(editingCartItemId);
        // Add new item with the same quantity but new configuration
        addToCart(selectedProduct, existingItem.quantity, selectedModifiers, selectedAddons);
      }
    } else {
      // Adding new item to cart with configuration
      addToCart(selectedProduct, 1, selectedModifiers, selectedAddons);
    }

    // Close modal and reset state
    setCustomizationModalOpen(false);
    setSelectedProduct(null);
    setSelectedProductDetails(null);
    setEditingCartItemId(null);
  };

  // Handle charge button
  const handleCharge = () => {
    setCheckoutModalOpen(true);
  };

  // Render category section based on device
  const renderCategories = () => {
    if (isTablet) {
      return (
        <CategorySidebar
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      );
    }
    return null;
  };

  // Render product grid
  const renderProductGrid = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <IonSpinner name="crescent" />
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>
            {selectedCategoryId
              ? 'Try selecting a different category'
              : 'Add products to get started'}
          </p>
        </div>
      );
    }

    return (
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            onTap={() => handleProductTap(product)}
            onLongPress={() => handleProductLongPress(product)}
          />
        ))}
      </div>
    );
  };

  // Render cart panel (tablet only)
  const renderCartPanel = () => {
    if (!isTablet) return null;

    return (
      <CartPanel
        items={items}
        subtotal={subtotal}
        tax={totals.tax}
        taxRate={totals.taxRate}
        discount={totals.discount}
        total={totals.total}
        currency={currency}
        customerName={customerName ?? undefined}
        onQuantityChange={updateQuantity}
        onRemoveItem={removeFromCart}
        onEditItem={handleEditCartItem}
        onCharge={handleCharge}
      />
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>New Order</IonTitle>
          {isMobile && !isEmpty && (
            <IonButtons slot="end">
              <IonButton onClick={() => setIsCartOpen(true)}>
                <IonIcon slot="icon-only" icon={cartOutline} />
                <IonBadge color="danger" style={{ position: 'absolute', top: 0, right: 0 }}>
                  {itemCount}
                </IonBadge>
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>

        {/* Mobile category pills */}
        {isMobile && (
          <IonToolbar className="category-toolbar">
            <CategoryPillScroller
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent>
        <POSLayout
          categories={renderCategories()}
          products={renderProductGrid()}
          cart={renderCartPanel()}
        />

        {/* Mobile Cart FAB */}
        {isMobile && !isEmpty && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => setIsCartOpen(true)} className="btn-neumorphic">
              <IonIcon icon={cartOutline} />
              <IonBadge color="danger" style={{ position: 'absolute', top: -4, right: -4 }}>
                {itemCount}
              </IonBadge>
            </IonFabButton>
          </IonFab>
        )}

        {/* Mobile Cart Bottom Sheet */}
        <BottomSheet
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          title="Your Order"
          initialBreakpoint={0.5}
          breakpoints={[0, 0.5, 0.75, 1]}
        >
          <CartPanel
            items={items}
            subtotal={subtotal}
            tax={totals.tax}
            taxRate={totals.taxRate}
            discount={totals.discount}
            total={totals.total}
            currency={currency}
            customerName={customerName ?? undefined}
            onQuantityChange={updateQuantity}
            onRemoveItem={removeFromCart}
            onEditItem={handleEditCartItem}
            onCharge={() => {
              setIsCartOpen(false);
              handleCharge();
            }}
          />
        </BottomSheet>

        {/* Product Customization Modal */}
        <ProductCustomizationModal
          isOpen={customizationModalOpen}
          onClose={() => {
            setCustomizationModalOpen(false);
            setSelectedProduct(null);
            setSelectedProductDetails(null);
            setEditingCartItemId(null);
          }}
          product={selectedProduct}
          productDetails={selectedProductDetails}
          existingAddons={editingCartItemId ? getItem(editingCartItemId)?.addons : undefined}
          existingModifiers={editingCartItemId ? getItem(editingCartItemId)?.modifiers : undefined}
          onSave={handleCustomizationModalSave}
          currency={currency}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          items={items}
          subtotal={subtotal}
          tax={totals.tax}
          taxRate={totals.taxRate}
          discount={totals.discount}
          tip={totals.tip}
          total={totals.total}
          currency={currency}
          onSuccess={() => {
            clearCart();
            setCheckoutModalOpen(false);
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default POSPage;
