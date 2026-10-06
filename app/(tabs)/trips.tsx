import React from 'react';
import { EmptyState, Screen } from '../../src/components';
import { uz } from '../../src/i18n/uz';

export default function TripsTabScreen() {
  return (
    <Screen>
      <EmptyState
        title={uz.nav.trips}
        description="Reyslar tarixi va faol reys (M4 bosqichida ulanadi). Hali faol reyslar mavjud emas."
        icon="🚚"
      />
    </Screen>
  );
}
