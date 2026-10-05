import type { Metadata } from "next";
import { TransactionDetailView } from "@/components/transactions/transaction-detail-view";

export const metadata: Metadata = { title: "Transaction Detail" };

export default async function TransactionDetailPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params;
  return <TransactionDetailView id={Number(id)} />;
}
