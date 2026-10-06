import React from 'react';
import { EmptyState, Screen } from '../../src/components';
import { uz } from '../../src/i18n/uz';

export default function BalanceTabScreen() {
  return (
    <Screen>
      <EmptyState
        title={uz.nav.balance}
        description="Balans va hisob yozuvlari (M2 bosqichida ulanadi). Hamyon tafsilotlari shu yerda chiqadi."
        icon="💳"
      />
    </Screen>
  );
}
