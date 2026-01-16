// UI Context - Global UI State Management (Toasts, Loading, Modals)

import { IonAlert, IonLoading, IonToast } from '@ionic/react';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

// Toast types
export interface ToastOptions {
  message: string;
  color?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'light'
    | 'medium'
    | 'dark';
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  icon?: string;
  buttons?: Array<{
    text: string;
    role?: string;
    handler?: () => void;
  }>;
}

// Alert types
export interface AlertOptions {
  header?: string;
  subHeader?: string;
  message: string;
  buttons?: Array<
    | string
    | {
        text: string;
        role?: 'cancel' | 'destructive';
        handler?: () => boolean | undefined;
      }
  >;
}

// Loading types
export interface LoadingOptions {
  message?: string;
  spinner?:
    | 'bubbles'
    | 'circles'
    | 'circular'
    | 'crescent'
    | 'dots'
    | 'lines'
    | 'lines-sharp'
    | 'lines-sharp-small'
    | 'lines-small';
  duration?: number;
}

interface UIState {
  toast: ToastOptions | null;
  loading: LoadingOptions | null;
  alert: AlertOptions | null;
}

interface UIContextValue {
  // Toast methods
  showToast: (options: ToastOptions) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  hideToast: () => void;

  // Loading methods
  showLoading: (options?: LoadingOptions) => void;
  hideLoading: () => void;
  isLoading: boolean;

  // Alert methods
  showAlert: (options: AlertOptions) => Promise<boolean>;
  showConfirm: (message: string, header?: string) => Promise<boolean>;
  hideAlert: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [state, setState] = useState<UIState>({
    toast: null,
    loading: null,
    alert: null,
  });

  const [alertResolver, setAlertResolver] = useState<((value: boolean) => void) | null>(null);

  // Toast methods
  const showToast = useCallback((options: ToastOptions) => {
    setState((prev) => ({
      ...prev,
      toast: {
        duration: 3000,
        position: 'bottom',
        ...options,
      },
    }));
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      showToast({ message, color: 'primary' });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      showToast({ message, color: 'danger', duration: 5000 });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => {
      showToast({ message, color: 'warning' });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      showToast({ message, color: 'primary' });
    },
    [showToast]
  );

  const hideToast = useCallback(() => {
    setState((prev) => ({ ...prev, toast: null }));
  }, []);

  // Loading methods
  const showLoading = useCallback((options?: LoadingOptions) => {
    setState((prev) => ({
      ...prev,
      loading: {
        message: 'Loading...',
        spinner: 'crescent',
        ...options,
      },
    }));
  }, []);

  const hideLoading = useCallback(() => {
    setState((prev) => ({ ...prev, loading: null }));
  }, []);

  // Alert methods
  const showAlert = useCallback((options: AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertResolver(() => resolve);
      setState((prev) => ({
        ...prev,
        alert: options,
      }));
    });
  }, []);

  const showConfirm = useCallback(
    (message: string, header?: string): Promise<boolean> => {
      return showAlert({
        header: header || 'Confirm',
        message,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'OK', role: 'destructive' },
        ],
      });
    },
    [showAlert]
  );

  const hideAlert = useCallback(() => {
    setState((prev) => ({ ...prev, alert: null }));
    setAlertResolver(null);
  }, []);

  const handleAlertDismiss = useCallback(
    (confirmed: boolean) => {
      if (alertResolver) {
        alertResolver(confirmed);
      }
      hideAlert();
    },
    [alertResolver, hideAlert]
  );

  const value: UIContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    showLoading,
    hideLoading,
    isLoading: state.loading !== null,
    showAlert,
    showConfirm,
    hideAlert,
  };

  return (
    <UIContext.Provider value={value}>
      {children}

      {/* Toast Component */}
      <IonToast
        isOpen={state.toast !== null}
        message={state.toast?.message}
        color={state.toast?.color}
        duration={state.toast?.duration}
        position={state.toast?.position}
        icon={state.toast?.icon}
        buttons={state.toast?.buttons}
        onDidDismiss={hideToast}
      />

      {/* Loading Component */}
      <IonLoading
        isOpen={state.loading !== null}
        message={state.loading?.message}
        spinner={state.loading?.spinner}
        duration={state.loading?.duration}
      />

      {/* Alert Component */}
      <IonAlert
        isOpen={state.alert !== null}
        header={state.alert?.header}
        subHeader={state.alert?.subHeader}
        message={state.alert?.message}
        buttons={
          state.alert?.buttons?.map((btn) => {
            if (typeof btn === 'string') {
              return {
                text: btn,
                handler: () => handleAlertDismiss(true),
              };
            }
            return {
              ...btn,
              handler: () => {
                const result = btn.handler?.();
                if (result !== false) {
                  handleAlertDismiss(btn.role !== 'cancel');
                }
                return result;
              },
            };
          }) || [
            {
              text: 'OK',
              handler: () => handleAlertDismiss(true),
            },
          ]
        }
        onDidDismiss={() => handleAlertDismiss(false)}
      />
    </UIContext.Provider>
  );
}

export function useUIContext(): UIContextValue {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}

/**
 * Convenience hook for UI operations.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showSuccess, showError, showLoading, hideLoading, showConfirm } = useUI();
 *
 *   const handleSave = async () => {
 *     showLoading({ message: 'Saving...' });
 *     try {
 *       await saveData();
 *       showSuccess('Data saved successfully!');
 *     } catch (error) {
 *       showError('Failed to save data');
 *     } finally {
 *       hideLoading();
 *     }
 *   };
 *
 *   const handleDelete = async () => {
 *     const confirmed = await showConfirm('Are you sure you want to delete this item?');
 *     if (confirmed) {
 *       // Proceed with deletion
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSave}>Save</button>
 *       <button onClick={handleDelete}>Delete</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUI(): UIContextValue {
  return useUIContext();
}

export { UIContext };
