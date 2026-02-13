// SideMenu - Application side navigation menu

import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import {
  cartOutline,
  chevronDownOutline,
  chevronForwardOutline,
  cubeOutline,
  documentTextOutline,
  homeOutline,
  pricetagOutline,
  returnDownBackOutline,
  settingsOutline,
  statsChartOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import AppLogo from '@/components/shared/AppLogo';
import { useShop } from '@/hooks/useShop';
import { generateSimpleKey } from '@/utils/keyGenerator';

interface SubMenuItem {
  title: string;
  url: string;
  icon: string;
}

interface MenuItem {
  title: string;
  url: string;
  icon: string;
  submenu?: SubMenuItem[];
}

const SideMenu: React.FC = () => {
  const location = useLocation();
  const router = useIonRouter();
  const { currentShop } = useShop();
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const menuItems: MenuItem[] = [
    {
      title: t('navigation.dashboard'),
      url: currentShop ? `/shops/${currentShop.id}/home` : '/shops',
      icon: homeOutline,
    },
    {
      title: t('navigation.order'),
      url: '/pos',
      icon: cartOutline,
    },
    {
      title: t('navigation.products'),
      url: currentShop ? `/shops/${currentShop.id}/products` : '/products',
      icon: pricetagOutline,
      
    },
    {
      title: t('navigation.sales'),
      url: currentShop ? `/shops/${currentShop.id}/sales` : '/sales',
      icon: statsChartOutline,
    },
    {
      title: t('navigation.inventory'),
      url: currentShop ? `/shops/${currentShop.id}/inventory` : '/inventory',
      icon: cubeOutline,
    },
    {
      title: t('navigation.reports'),
      url: '/reports',
      icon: documentTextOutline,
    },
    {
      title: t('navigation.settings'),
      url: currentShop ? `/shops/${currentShop.id}/settings` : '/shops',
      icon: settingsOutline,
    },
  ];

  const returnToShopsItem: MenuItem = {
    title: t('Return To Shops'),
    url: '/shops',
    icon: returnDownBackOutline,
  };

  return (
    <IonMenu contentId="main" type="overlay">
      <IonHeader>
        <IonToolbar style={{ '--background': 'white', height: '102px', paddingTop: '26px', paddingBottom: '16px' }}>
          <IonTitle>
            <AppLogo
              showText={true}
              height="42px"
              text={t('common.appName')}
            />
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="none">
          {menuItems.map((item) => {
            const isExpanded = expandedItems.has(item.title);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isChildActive =
              hasSubmenu && item.submenu?.some((sub) => location.pathname === sub.url);
            const isParentActive = location.pathname === item.url && !isChildActive;

            return (
              <div key={generateSimpleKey(item.title)}>
                {/* Main menu item */}
                {hasSubmenu ? (
                  // For items with submenu, make the whole item clickable for expand/collapse
                  <IonItem
                    button
                    onClick={() => toggleExpanded(item.title)}
                    className={isParentActive ? 'selected' : ''}
                    detail={false}
                  >
                    <IonIcon slot="start" icon={item.icon} />
                    <IonLabel>{item.title}</IonLabel>
                    <IonIcon
                      slot="end"
                      icon={isExpanded ? chevronDownOutline : chevronForwardOutline}
                      style={{ fontSize: '18px' }}
                    />
                  </IonItem>
                ) : (
                  // For items without submenu, use normal navigation
                  <IonMenuToggle autoHide={false}>
                    <IonItem
                      routerLink={item.url}
                      routerDirection="none"
                      className={location.pathname === item.url ? 'selected' : ''}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={item.icon} />
                      <IonLabel>{item.title}</IonLabel>
                    </IonItem>
                  </IonMenuToggle>
                )}

                {/* Submenu items */}
                {hasSubmenu && isExpanded && (
                  <div className="ion-padding-left">
                    {item.submenu?.map((subitem) => (
                      <IonMenuToggle key={generateSimpleKey(subitem.title)} autoHide={false}>
                        <IonItem
                          routerLink={subitem.url}
                          routerDirection="none"
                          className={location.pathname === subitem.url ? 'selected' : ''}
                          detail={false}
                          style={{ '--padding-start': '32px' }}
                        >
                          <IonIcon slot="start" icon={subitem.icon} style={{ fontSize: '18px' }} />
                          <IonLabel>{subitem.title}</IonLabel>
                        </IonItem>
                      </IonMenuToggle>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </IonList>
      </IonContent>
      <IonFooter style={{ boxShadow: 'none' }}>
        <hr style={{ margin: 0, border: 'none', borderTop: '1px solid var(--ion-color-light)' }} />
        <IonList lines="none">
          <IonMenuToggle autoHide={false}>
            <IonItem
              routerLink={returnToShopsItem.url}
              routerDirection="none"
              className={location.pathname === returnToShopsItem.url ? 'selected' : ''}
              detail={false}
            >
              <IonIcon slot="start" icon={returnToShopsItem.icon} />
              <IonLabel>{returnToShopsItem.title}</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonFooter>
    </IonMenu>
  );
};

export default SideMenu;
