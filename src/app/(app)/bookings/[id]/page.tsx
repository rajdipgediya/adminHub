import type { Metadata } from "next";
import { BookingDetailView } from "@/components/bookings/booking-detail-view";

export const metadata: Metadata = { title: "Booking Detail" };

export default async function BookingDetailPage({ params }: PageProps<"/bookings/[id]">) {
  const { id } = await params;
  return <BookingDetailView id={Number(id)} />;
}
