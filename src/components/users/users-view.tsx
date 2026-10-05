"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Pen, Plus, Square, SquareCheck, Trash2 } from "lucide-react";
import { PAGE_SIZE, useUserList } from "@/hooks/listings";
import { useNow } from "@/hooks/use-now";
import { formatDatePadded, formatNumber, formatRelative } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/store";
import { setPage, setUserFilters, resetFilters, type UserSort } from "@/store/filtersSlice";
import {
  applyUserOverride,
  clearSelection,
  setUsersSelected,
  toggleUser,
} from "@/store/selectionSlice";
import type { User, UserRole, UserStatus } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, RowAction, type Column } from "@/components/ui/data-table";
import { FilterSelect } from "@/components/ui/filter-select";
import { MobilePageHeader, MobileStat, PageHeader, StatCard } from "@/components/ui/kpi";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { MobileListContent } from "@/components/ui/mobile-list-content";
import { AddUserDialog, DeleteUserDialog } from "./user-dialogs";

const ROLE_OPTIONS: { value: UserRole | "All"; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Admin", label: "Admin" },
  { value: "Editor", label: "Editor" },
  { value: "Viewer", label: "Viewer" },
];
const STATUS_OPTIONS: { value: UserStatus | "All"; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Suspended", label: "Suspended" },
];
const SORT_OPTIONS: { value: UserSort; label: string }[] = [
  { value: "joined", label: "Date Joined" },
  { value: "name", label: "Name" },
  { value: "lastActive", label: "Last Active" },
];

function useUserStats(users: User[] | undefined) {
  const now = useNow();
  return useMemo(() => {
    const month = now - 30 * 86_400_000;
    return {
      total: users?.length ?? 0,
      active: users?.filter((u) => u.status === "Active").length ?? 0,
      newThisMonth: users?.filter((u) => new Date(u.joinedAt).getTime() > month).length ?? 0,
    };
  }, [users, now]);
}

export function UsersView() {
  const list = useUserList();
  const stats = useUserStats(list.data);
  const filters = useAppSelector((s) => s.filters.users);
  const selected = useAppSelector((s) => s.selection.selectedUserIds);
  const dispatch = useAppDispatch();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);

  const pageIds = list.result.items.map((u) => u.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const hasFilters = filters.search || filters.role !== "All" || filters.status !== "All";

  const columns: Column<User>[] = [
    {
      key: "select",
      header: (
        <button
          type="button"
          role="checkbox"
          aria-checked={allOnPage}
          aria-label="Select all on page"
          onClick={() => dispatch(setUsersSelected({ ids: pageIds, selected: !allOnPage }))}
        >
          {allOnPage ? (
            <SquareCheck className="size-4 text-indigo-600" />
          ) : (
            <Square className="size-4 text-slate-400" />
          )}
        </button>
      ),
      width: 32,
      align: "center",
      cell: (u) => {
        const on = selected.includes(u.id);
        return (
          <button
            type="button"
            role="checkbox"
            aria-checked={on}
            aria-label={`Select ${u.name}`}
            onClick={(e) => {
              e.stopPropagation();
              dispatch(toggleUser(u.id));
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {on ? <SquareCheck className="size-4 text-indigo-600" /> : <Square className="size-4 text-slate-400" />}
          </button>
        );
      },
      skeleton: <Skeleton className="size-4" />,
    },
    {
      key: "user",
      header: "User",
      cell: (u) => (
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={u.avatar} name={u.name} size={32} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[13px] font-semibold text-slate-900">{u.name}</span>
            <span className="truncate text-[11px] text-slate-500">{u.email}</span>
          </span>
        </span>
      ),
      skeleton: (
        <span className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <span className="flex flex-col gap-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </span>
        </span>
      ),
    },
    { key: "role", header: "Role", width: 110, cell: (u) => <RoleBadge role={u.role} /> },
    { key: "status", header: "Status", width: 110, cell: (u) => <StatusBadge status={u.status} /> },
    {
      key: "joined",
      header: "Join Date",
      width: 110,
      cell: (u) => <span className="whitespace-nowrap text-[13px] text-slate-600">{formatDatePadded(u.joinedAt)}</span>,
    },
    {
      key: "active",
      header: "Last Active",
      width: 110,
      cell: (u) => <span className="whitespace-nowrap text-[13px] text-slate-600">{formatRelative(u.lastActiveAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      width: 80,
      align: "right",
      cell: (u) => (
        <span className="flex gap-3">
          <RowAction label={`Edit ${u.name}`} href={`/users/${u.id}`}>
            <Pen className="size-4" />
          </RowAction>
          <RowAction
            label={`Delete ${u.name}`}
            onClick={() => setDeleting(u)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="size-4" />
          </RowAction>
        </span>
      ),
      skeleton: <Skeleton className="h-4 w-12" />,
    },
  ];

  const empty = (
    <EmptyState
      title={hasFilters ? "No users match your filters" : "No users yet"}
      description={hasFilters ? "Try a different search term or clear the filters." : "Invite your first user to get started."}
      action={
        hasFilters && (
          <Button size="sm" onClick={() => dispatch(resetFilters("users"))}>
            Clear filters
          </Button>
        )
      }
    />
  );

  const loading = list.isPending || !list.data;

  return (
    <>
      {/* Desktop */}
      <div className="hidden w-full flex-col gap-6 p-8 lg:flex">
        <PageHeader
          title="Users Directory"
          description="Manage all registered users in your application"
          action={
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Add User
            </Button>
          }
        />

        <div className="flex w-full gap-4">
          <StatCard label="Total Users" value={formatNumber(stats.total)} loading={loading} />
          <StatCard label="Active Users" value={formatNumber(stats.active)} loading={loading} />
          <StatCard label="New This Month" value={formatNumber(stats.newThisMonth)} loading={loading} />
        </div>

        <Card className="flex w-full flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={filters.search}
              onChange={(search) => dispatch(setUserFilters({ search }))}
              placeholder="Search users by name or email..."
              className="w-[280px]"
            />
            <FilterSelect
              label="Role"
              value={filters.role}
              options={ROLE_OPTIONS}
              onChange={(role) => dispatch(setUserFilters({ role }))}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              options={STATUS_OPTIONS}
              onChange={(status) => dispatch(setUserFilters({ status }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-slate-500">Sort by:</span>
            <FilterSelect
              value={filters.sort}
              options={SORT_OPTIONS}
              align="right"
              valueClassName="text-slate-900"
              onChange={(sort) => dispatch(setUserFilters({ sort }))}
            />
          </div>
        </Card>

        {selected.length > 0 && <BulkActionsBar ids={selected} />}

        <Card className="flex w-full flex-col gap-4 p-5">
          {list.isError ? (
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={list.result.items}
                loading={loading}
                minWidth={900}
                getHref={(u) => `/users/${u.id}`}
                empty={empty}
              />
              {!loading && list.result.total > 0 && (
                <Pagination
                  {...list.result}
                  className="pt-3"
                  onPageChange={(page) => dispatch(setPage({ section: "users", page }))}
                />
              )}
            </>
          )}
        </Card>
      </div>

      {/* Mobile */}
      <div className="flex w-full flex-col gap-4 p-4 lg:hidden">
        <MobilePageHeader title="User Management" description="Manage registered application users" />
        <div className="flex gap-2">
          <SearchInput
            value={filters.search}
            onChange={(search) => dispatch(setUserFilters({ search }))}
            placeholder="Search users..."
            className="flex-1 bg-white"
            iconSize={14}
          />
          <FilterSelect
            value={filters.status}
            options={STATUS_OPTIONS.map((o) => ({ ...o, label: o.value === "All" ? "All statuses" : o.label }))}
            onChange={(status) => dispatch(setUserFilters({ status }))}
            align="right"
            ariaLabel="Filter users by status"
            triggerClassName="block size-9 rounded-lg"
            trigger={<Image src="/figma/mobile-filter-btn.svg" alt="" width={36} height={36} />}
          />
        </div>
        <div className="flex gap-2">
          <MobileStat size="sm" label="Total Users" value={formatNumber(stats.total)} loading={loading} />
          <MobileStat size="sm" label="Active" value={formatNumber(stats.active)} loading={loading} />
          <MobileStat size="sm" label="New This Mo" value={formatNumber(stats.newThisMonth)} loading={loading} />
        </div>
        <Button variant="primary" className="rounded-lg p-3 text-[13px]" onClick={() => setAdding(true)}>
          Add New User
        </Button>

        {list.isError ? (
          <Card>
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            <MobileListContent
              items={list.result.items}
              isLoading={loading}
              skeletonHeight="h-[113px]"
              emptyState={<Card>{empty}</Card>}
              renderItem={(u) => (
                <MobileUserCard key={u.id} user={u} onDelete={() => setDeleting(u)} />
              )}
            />
          </div>
        )}
        {!loading && list.result.total > PAGE_SIZE && (
          <Pagination {...list.result} onPageChange={(page) => dispatch(setPage({ section: "users", page }))} />
        )}
      </div>

      <AddUserDialog open={adding} onClose={() => setAdding(false)} />
      <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function MobileUserCard({ user: u, onDelete }: { user: User; onDelete: () => void }) {
  return (
    <Link
      href={`/users/${u.id}`}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 active:bg-slate-50"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar src={u.avatar} name={u.name} size={36} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[13px] font-semibold text-slate-900">{u.name}</span>
            <span className="truncate text-[11px] text-slate-500">{u.email}</span>
          </span>
        </span>
        <span className="flex gap-2">
          <span aria-hidden>
            <Image src="/figma/mobile-edit-btn.svg" alt="" width={24} height={24} />
          </span>
          <button
            type="button"
            aria-label={`Delete ${u.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            <Image src="/figma/mobile-trash-btn.svg" alt="" width={24} height={24} />
          </button>
        </span>
      </div>
      <div className="h-px w-full bg-slate-200" />
      <div className="flex items-center justify-between gap-2">
        <span className="flex gap-1.5">
          <RoleBadge role={u.role} mobile />
          <StatusBadge status={u.status} shape="pillSm" />
        </span>
        <span className="text-[10px] text-slate-500">Active {formatRelative(u.lastActiveAt)}</span>
      </div>
    </Link>
  );
}

function BulkActionsBar({ ids }: { ids: number[] }) {
  const dispatch = useAppDispatch();
  return (
    <div className="flex w-full items-center justify-between rounded-lg border border-indigo-600 bg-indigo-50 p-3">
      <div className="flex items-center gap-2">
        <Check className="size-4 text-indigo-600" />
        <p className="text-[13px] font-semibold text-indigo-600">
          {ids.length} {ids.length === 1 ? "user" : "users"} selected
        </p>
        <button
          type="button"
          onClick={() => dispatch(clearSelection())}
          className="ml-2 text-xs font-medium text-indigo-600 underline-offset-2 hover:underline"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-3">
        <FilterSelect<UserRole>
          value="Viewer"
          options={ROLE_OPTIONS.filter((o) => o.value !== "All") as { value: UserRole; label: string }[]}
          align="right"
          onChange={(role) => {
            dispatch(applyUserOverride({ ids, patch: { role } }));
            dispatch(clearSelection());
          }}
          triggerClassName="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
          trigger="Change Role"
        />
        <Button
          size="sm"
          className="text-red-500"
          onClick={() => {
            dispatch(applyUserOverride({ ids, patch: { status: "Suspended" } }));
            dispatch(clearSelection());
          }}
        >
          Suspend Accounts
        </Button>
      </div>
    </div>
  );
}
