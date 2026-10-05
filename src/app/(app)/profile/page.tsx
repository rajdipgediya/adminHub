import type { Metadata } from "next";
import { UserDetailView } from "@/components/users/user-detail-view";

export const metadata: Metadata = { title: "My Profile" };

/** The signed-in admin maps to DummyJSON user #1 (role: admin). */
const CURRENT_ADMIN_ID = 1;

export default function ProfilePage() {
  return <UserDetailView id={CURRENT_ADMIN_ID} />;
}
