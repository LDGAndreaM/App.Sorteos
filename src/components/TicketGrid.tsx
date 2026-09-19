import React, { useMemo } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';

import TicketCell from './TicketCell';
import type { Ticket } from '../types';

const MIN_CELL_SIZE = 56;
const GRID_PADDING = 16;

export default function TicketGrid({
  tickets,
  digits,
  onSelect,
}: {
  tickets: Ticket[];
  digits: number;
  onSelect: (ticket: Ticket) => void;
}) {
  const { width } = useWindowDimensions();

  const { numColumns, cellSize } = useMemo(() => {
    const usableWidth = width - GRID_PADDING * 2;
    const columns = Math.max(Math.floor(usableWidth / MIN_CELL_SIZE), 4);
    const size = Math.floor(usableWidth / columns) - 6;
    return { numColumns: columns, cellSize: size };
  }, [width]);

  return (
    <FlatList
      data={tickets}
      key={numColumns}
      keyExtractor={(item) => String(item.number)}
      numColumns={numColumns}
      contentContainerStyle={{ paddingHorizontal: GRID_PADDING - 3, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <TicketCell ticket={item} digits={digits} size={cellSize} onPress={() => onSelect(item)} />
      )}
      initialNumToRender={60}
      maxToRenderPerBatch={60}
      windowSize={10}
      removeClippedSubviews
    />
  );
}
