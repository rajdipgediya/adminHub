import type { Metadata } from "next";
import { UserDetailView } from "@/components/users/user-detail-view";

export const metadata: Metadata = { title: "User Detail" };

export default async function UserDetailPage({ params }: PageProps<"/users/[id]">) {
  const { id } = await params;
  return <UserDetailView id={Number(id)} />;
}
