import { Skeleton } from "./skeleton";

interface MobileListContentProps<T> {
  /** Items to render after data has loaded. */
  items: T[];
  /** Whether data is still loading. */
  isLoading: boolean;
  /** Height of each skeleton placeholder (e.g. `"h-[114px]"`). */
  skeletonHeight: string;
  /** Number of skeleton rows to show while loading. */
  skeletonCount?: number;
  /** Node to show when items is empty (and not loading). */
  emptyState: React.ReactNode;
  /** Renders a single item card. */
  renderItem: (item: T) => React.ReactNode;
}

/**
 * Shared mobile list renderer used by Bookings, Transactions and Users views.
 * Handles the three-way loading / empty / populated states so each view
 * does not have to repeat the same conditional logic.
 */
export function MobileListContent<T extends { id: number }>({
  items,
  isLoading,
  skeletonHeight,
  skeletonCount = 5,
  emptyState,
  renderItem,
}: MobileListContentProps<T>) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className={`${skeletonHeight} w-full rounded-lg`} />
        ))}
      </>
    );
  }

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return <>{items.map(renderItem)}</>;
}
