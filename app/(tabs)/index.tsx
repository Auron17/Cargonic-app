import React from 'react';
import { EmptyState, Screen } from '../../src/components';
import { uz } from '../../src/i18n/uz';

export default function LoadsTabScreen() {
  return (
    <Screen>
      <EmptyState
        title={uz.nav.loads}
        description="Yuklar lentasi (M3 bosqichida ulanadi). Bu yerda yaqin atrofdagi mos yuklar ko‘rinadi."
        icon="📦"
      />
    </Screen>
  );
}
