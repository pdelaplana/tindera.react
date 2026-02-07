// Inventory Transaction Details Content - Shared content for transaction details views

import { IonIcon, IonItem, IonLabel, IonList, IonText } from '@ionic/react';
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
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { LoadingSpinner } from '@/components/ui';
import { useInventoryTransaction } from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { designSystem } from '@/theme/designSystem';
import { createCurrencyFormatter } from '@/utils/currency';
import { formatDateLabel } from '@/utils/date';

interface InventoryTransactionDetailsContentProps {
  transactionId: string;
}

// Styled components
const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
`;

const HeaderCard = styled.div`
  padding: 24px;
  margin-bottom: 16px;
  background: ${designSystem.colors.gray[100]};
  border-radius: ${designSystem.borderRadius.md};
  text-align: center;
`;

const IconCircle = styled.div<{ type: string }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  background: ${(props) => {
    switch (props.type) {
      case 'receipt':
        return designSystem.colors.status.paid;
      case 'issue':
        return designSystem.colors.warning;
      case 'sale':
        return designSystem.colors.danger;
      case 'adjustment':
        return designSystem.colors.info;
      case 'countAdjustment':
        return designSystem.colors.brand.secondary;
      default:
        return designSystem.colors.gray[300];
    }
  }};

  ion-icon {
    color: white;
    font-size: 48px;
  }
`;

const IconContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const TransactionTitle = styled.h2`
  margin: 0;
  font-size: ${designSystem.typography.fontSize['2xl']};
  font-weight: ${designSystem.typography.fontWeight.semibold};
`;

const QuantityDisplay = styled.div`
  font-size: ${designSystem.typography.fontSize['3xl']};
  font-weight: ${designSystem.typography.fontWeight.bold};
  text-align: center;
  margin-top: 8px;
`;

const QuantityUnit = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.normal};
  color: ${designSystem.colors.text.secondary};
  margin-top: 4px;
`;

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

const InventoryTransactionDetailsContent: React.FC<InventoryTransactionDetailsContentProps> = ({
  transactionId,
}) => {
  const { currentShop } = useShop();
  const { data: transaction, isLoading } = useInventoryTransaction(transactionId);

  // Memoized formatters
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: formatDateLabel(dateString),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <EmptyContainer>
        <LoadingSpinner />
      </EmptyContainer>
    );
  }

  // Not found state
  if (!transaction) {
    return (
      <EmptyContainer>
        <h3>Transaction Not Found</h3>
        <p>
          <IonText color="medium">The transaction could not be found</IonText>
        </p>
      </EmptyContainer>
    );
  }

  const { date, time } = formatDateTime(transaction.transaction_on);
  const quantityDisplay =
    transaction.quantity_in > 0 ? `+${transaction.quantity_in}` : `-${transaction.quantity_out}`;
  const baseUom = transaction.inventory_items?.base_uom || 'units';

  return (
    <>
      {/* Header Card with Transaction Type and Item */}
      <HeaderCard>
        <IconContainer>
          <IconCircle type={transaction.transaction_type}>
            <IonIcon icon={getTransactionTypeIcon(transaction.transaction_type)} />
          </IconCircle>
          <TransactionTitle>
            {getTransactionTypeLabel(transaction.transaction_type)}
          </TransactionTitle>
          <IonText color="medium">
            <p style={{ margin: '4px 0 0 0' }}>{transaction.item_name}</p>
          </IonText>
        </IconContainer>
        <QuantityDisplay>
          {quantityDisplay}
          <QuantityUnit>{baseUom}</QuantityUnit>
        </QuantityDisplay>
      </HeaderCard>

      {/* Transaction Details List */}
      <CardContainer noPadding={true}>
        <IonList lines="full">
          {/* Date */}
          <IonItem>
            <IonLabel>
              <h3>Date</h3>
              <p>{date}</p>
            </IonLabel>
          </IonItem>

          {/* Time */}
          <IonItem>
            <IonLabel>
              <h3>Time</h3>
              <p>{time}</p>
            </IonLabel>
          </IonItem>

          {/* Reference (if exists) */}
          {transaction.reference && (
            <IonItem>
              <IonLabel>
                <h3>Reference</h3>
                <p>{transaction.reference}</p>
              </IonLabel>
            </IonItem>
          )}

          {/* Supplier (only for receipts) */}
          {transaction.transaction_type === 'receipt' && transaction.supplier && (
            <IonItem>
              <IonLabel>
                <h3>Supplier</h3>
                <p>{transaction.supplier}</p>
              </IonLabel>
            </IonItem>
          )}

          {/* Package Size (only for package-based receipts) */}
          {transaction.transaction_type === 'receipt' &&
            transaction.package_size_id &&
            transaction.package_size && (
              <>
                <IonItem>
                  <IonLabel>
                    <h3>Package Size</h3>
                    <p>
                      {transaction.package_size.package_name} (
                      {transaction.package_size.units_per_package}{' '}
                      {transaction.package_size.package_uom})
                    </p>
                  </IonLabel>
                </IonItem>

                {/* Number of Packages */}
                {transaction.package_quantity && (
                  <IonItem>
                    <IonLabel>
                      <h3>Number of Packages</h3>
                      <p>{transaction.package_quantity}</p>
                    </IonLabel>
                  </IonItem>
                )}

                {/* Cost per Package */}
                {transaction.package_cost_per_unit !== null &&
                  transaction.package_cost_per_unit !== undefined && (
                    <IonItem>
                      <IonLabel>
                        <h3>Cost per Package</h3>
                        <p>{formatCurrency(transaction.package_cost_per_unit)}</p>
                      </IonLabel>
                    </IonItem>
                  )}
              </>
            )}

          {/* Unit Cost (only for receipts) */}
          {transaction.transaction_type === 'receipt' && (
            <IonItem>
              <IonLabel>
                <h3>Unit Cost</h3>
                <p>{formatCurrency(transaction.unit_cost)}</p>
              </IonLabel>
            </IonItem>
          )}

          {/* Adjustment Reason Code (only for adjustments and count adjustments) */}
          {(transaction.transaction_type === 'adjustment' ||
            transaction.transaction_type === 'countAdjustment') &&
            transaction.adjustment_reason_code && (
              <IonItem>
                <IonLabel>
                  <h3>Adjustment Reason</h3>
                  <p>{transaction.adjustment_reason_code}</p>
                </IonLabel>
              </IonItem>
            )}

          {/* Adjustment Reason Other (only if exists) */}
          {transaction.adjustment_reason_other && (
            <IonItem>
              <IonLabel>
                <h3>Other Reason</h3>
                <p>{transaction.adjustment_reason_other}</p>
              </IonLabel>
            </IonItem>
          )}

          {/* Notes (if exists) */}
          {transaction.notes && (
            <IonItem>
              <IonLabel>
                <h3>Notes</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{transaction.notes}</p>
              </IonLabel>
            </IonItem>
          )}

          {/* Created By/At */}
          <IonItem>
            <IonLabel>
              <h3>Created</h3>
              <p>
                {new Date(transaction.created_at).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </IonLabel>
          </IonItem>

          {/* Created By */}
          {transaction.user_profile?.display_name && (
            <IonItem>
              <IonLabel>
                <h3>Created By</h3>
                <p>{transaction.user_profile.display_name}</p>
              </IonLabel>
            </IonItem>
          )}

          {/* Updated By/At (if different from created) */}
          {transaction.updated_at !== transaction.created_at && (
            <IonItem lines="none">
              <IonLabel>
                <h3>Last Updated</h3>
                <p>
                  {new Date(transaction.updated_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </IonLabel>
            </IonItem>
          )}
        </IonList>
      </CardContainer>
    </>
  );
};

export default InventoryTransactionDetailsContent;
