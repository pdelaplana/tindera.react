// SideMenu - Application side navigation menu

import {
  IonButton,
  IonButtons,
  IonContent,
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
  optionsOutline,
  pricetagOutline,
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
      submenu: [
        {
          title: t('navigation.catalog'),
          url: currentShop ? `/shops/${currentShop.id}/products` : '/products',
          icon: pricetagOutline,
        },
        {
          title: t('navigation.modifiers'),
          url: currentShop ? `/shops/${currentShop.id}/modifiers` : '/modifiers',
          icon: optionsOutline,
        },
      ],
    },
    {
      title: t('navigation.sales'),
      url: '/sales',
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

  return (
    <IonMenu contentId="main" type="overlay">
      <IonHeader>
        <IonToolbar style={{ '--background': 'white' }}>
          <IonTitle>
            <AppLogo
              showText={true}
              height="36px"
              text={currentShop?.name || t('common.appName')}
            />
          </IonTitle>
          <IonButtons slot="end">
            <IonMenuToggle autoHide={false}>
              <IonButton onClick={() => router.push('/shops', 'root')}>
                <IonIcon slot="icon-only" icon={swapHorizontalOutline} />
              </IonButton>
            </IonMenuToggle>
          </IonButtons>
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
    </IonMenu>
  );
};

export default SideMenu;
