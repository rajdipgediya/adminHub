"use client";

import { useState } from "react";
import { useCreateBooking } from "@/hooks/mutations";
import { useUsers } from "@/hooks/queries";
import { SERVICES } from "@/lib/api/mappers";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const INPUT_CLS =
  "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-400";

interface NewBookingFormState {
  userId: number;
  service: string;
  date: string;
  time: string;
}

export function NewBookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const users = useUsers();
  const create = useCreateBooking();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<NewBookingFormState>({
    userId: 0,
    service: SERVICES[0],
    date: today,
    time: "10:00",
  });

  const isValid = form.userId > 0 && form.date >= today && !!form.time;

  const handleClose = () => {
    create.reset();
    setForm({ userId: 0, service: SERVICES[0], date: today, time: "10:00" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="New Booking"
      description="Schedule a session for an existing customer."
      footer={
        <>
          <Button size="sm" onClick={handleClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!isValid || create.isPending}
            onClick={() => create.mutate(form, { onSuccess: handleClose })}
          >
            {create.isPending ? "Scheduling…" : "Create Booking"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Customer</span>
          <select
            className={INPUT_CLS}
            value={form.userId}
            disabled={users.isLoading}
            onChange={(e) => setForm({ ...form, userId: Number(e.target.value) })}
          >
            <option value={0}>{users.isLoading ? "Loading customers…" : "Select a customer"}</option>
            {users.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Service</span>
          <select
            className={INPUT_CLS}
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
          >
            {SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Date</span>
          <input
            type="date"
            min={today}
            className={INPUT_CLS}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Time</span>
          <input
            type="time"
            className={INPUT_CLS}
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </label>
        {create.isError && <p className="col-span-2 text-xs text-red-500">{create.error.message}</p>}
      </div>
    </Dialog>
  );
}
