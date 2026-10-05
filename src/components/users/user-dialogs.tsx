"use client";

import { useState } from "react";
import { useAddUser, useDeleteUser, type NewUserInput } from "@/hooks/mutations";
import { useAppDispatch } from "@/store";
import { setUsersSelected } from "@/store/selectionSlice";
import type { User, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";

const EMPTY: NewUserInput = { firstName: "", lastName: "", email: "", role: "Viewer", gender: "female" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const add = useAddUser();

  const errors = {
    firstName: !form.firstName.trim() && "First name is required",
    lastName: !form.lastName.trim() && "Last name is required",
    email: !EMAIL.test(form.email) && "Enter a valid email address",
  };
  const valid = !Object.values(errors).some(Boolean);

  const close = () => {
    setForm(EMPTY);
    setTouched(false);
    add.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add New User"
      description="Create an account and send an invitation email."
      footer={
        <>
          <Button size="sm" onClick={close} disabled={add.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            type="submit"
            form="add-user-form"
            disabled={add.isPending || (touched && !valid)}
          >
            {add.isPending ? "Creating…" : "Create User"}
          </Button>
        </>
      }
    >
      <form
        id="add-user-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (valid) add.mutate(form, { onSuccess: close });
        }}
        className="grid grid-cols-2 gap-3"
      >
        <Field label="First name" error={touched && errors.firstName}>
          <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </Field>
        <Field label="Last name" error={touched && errors.lastName}>
          <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </Field>
        <Field label="Email" error={touched && errors.email} className="col-span-2">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Role">
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
            <option>Admin</option>
            <option>Editor</option>
            <option>Viewer</option>
          </select>
        </Field>
        <Field label="Gender">
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value as NewUserInput["gender"] })}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </Field>
        {add.isError && <p className="col-span-2 text-xs text-red-500">{add.error.message}</p>}
      </form>
    </Dialog>
  );
}

/** Input wrapper matching the Design System "Input Fields" spec. */
function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string | false;
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <span
        className={`flex rounded-md border bg-white px-2.5 py-2 text-[13px] focus-within:border-indigo-600 [&>*]:w-full [&>*]:bg-transparent [&>*]:outline-none ${
          error ? "border-red-500" : "border-slate-200"
        }`}
      >
        {children}
      </span>
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </label>
  );
}

export function DeleteUserDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const del = useDeleteUser();
  const dispatch = useAppDispatch();
  return (
    <ConfirmDialog
      open={!!user}
      onClose={() => {
        del.reset();
        onClose();
      }}
      title="Delete user?"
      description={user ? `${user.name} (${user.email}) will lose access immediately.` : ""}
      confirmLabel="Delete User"
      pending={del.isPending}
      error={del.error?.message}
      onConfirm={() =>
        user &&
        del.mutate(user.id, {
          onSuccess: () => {
            dispatch(setUsersSelected({ ids: [user.id], selected: false }));
            onClose();
          },
        })
      }
    />
  );
}
