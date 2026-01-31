// Inventory Transactions List - Display grouped inventory transactions

import {
  IonButton,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
} from '@ionic/react';
import {
  arrowDownSharp,
  arrowUpSharp,
  calculatorSharp,
  cashSharp,
  construct,
  swapVerticalSharp,
} from 'ionicons/icons';
import type React from 'react';
import { useMemo } from 'react';
import { CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import type { InventoryTransaction } from '@/types';
import { formatDateLabel } from '@/utils/date';

interface InventoryTransactionsListProps {
  transactions: InventoryTransaction[] | undefined;
  isLoading: boolean;
  baseUom: string;
  canEdit: boolean;
  onTransactionClick: (transactionId: string) => void;
  onReceiveClick: () => void;
  // Infinite scroll props
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const getTransactionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    receipt: 'Receipt',
    issue: 'Issue',
    sale: 'Sale',
    adjustment: 'Adjustment',
    countAdjustment: 'Count Adjustment',
  };
  return labels[type] || type;
};

const getTransactionTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    receipt: arrowDownSharp,
    issue: arrowUpSharp,
    sale: cashSharp,
    adjustment: swapVerticalSharp,
    countAdjustment: calculatorSharp,
  };
  return icons[type] || construct;
};

const InventoryTransactionsList: React.FC<InventoryTransactionsListProps> = ({
  transactions,
  isLoading,
  baseUom,
  canEdit,
  onTransactionClick,
  onReceiveClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    if (!transactions) return {};

    return transactions.reduce(
      (groups, transaction) => {
        const dateLabel = formatDateLabel(transaction.transaction_on);
        if (!groups[dateLabel]) groups[dateLabel] = [];
        groups[dateLabel].push(transaction);
        return groups;
      },
      {} as Record<string, typeof transactions>
    );
  }, [transactions]);

  if (isLoading) {
    return (
      <Div className="ion-text-center" style={{ padding: '48px' }}>
        <IonText color="medium">Loading transactions...</IonText>
      </Div>
    );
  }

  if (transactions && transactions.length === 0) {
    return (
      <Div className="ion-text-center" style={{ padding: '48px 16px' }}>
        <h3>No Transactions Yet</h3>
        <p>
          <IonText color="medium">
            There are no inventory transactions for this item. Start by receiving inventory.
          </IonText>
        </p>
        <IonButton onClick={onReceiveClick} disabled={!canEdit}>
          Receive Inventory
        </IonButton>
      </Div>
    );
  }

  const groupEntries = Object.entries(groupedTransactions);

  return (
    <CardContainer noPadding={true}>
      <IonList lines="full">
        {groupEntries.map(([date, txns], groupIndex) => (
          <IonItemGroup key={date}>
            <IonItemDivider>
              <IonLabel color="dark">
                <h2>{date}</h2>
              </IonLabel>
            </IonItemDivider>
            {txns.map((txn, txnIndex) => {
              const isLastItem =
                groupIndex === groupEntries.length - 1 && txnIndex === txns.length - 1;
              return (
                <IonItem
                  key={txn.id}
                  button
                  detail={true}
                  lines={isLastItem ? 'none' : undefined}
                  onClick={() => onTransactionClick(txn.id)}
                >
                  <IonIcon
                    icon={getTransactionTypeIcon(txn.transaction_type)}
                    slot="start"
                    style={{ fontSize: '24px' }}
                  />
                  <IonLabel>
                    <h3>{getTransactionTypeLabel(txn.transaction_type)}</h3>
                    <p color="medium">{new Date(txn.transaction_on).toLocaleTimeString()}</p>
                  </IonLabel>
                  <IonLabel slot="end" className="ion-text-right ion-padding-end" color="dark">
                    {txn.quantity_in > 0 ? `+${txn.quantity_in}` : `-${txn.quantity_out}`}
                    <br />
                    <IonNote>{baseUom}</IonNote>
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonItemGroup>
        ))}
      </IonList>
      {hasMore && (
        <div className="ion-text-center ion-padding">
          <IonButton fill="clear" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </IonButton>
        </div>
      )}
    </CardContainer>
  );
};

export default InventoryTransactionsList;
