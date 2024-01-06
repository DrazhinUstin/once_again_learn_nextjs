'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const InvoiceSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  amount: z.coerce.number(),
  date: z.string(),
  status: z.enum(['pending', 'paid']),
});

const InvoiceFormSchema = InvoiceSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customer_id, amount, status } = InvoiceFormSchema.parse(
    Object.fromEntries(formData.entries()),
  );
  const date = new Date().toISOString().split('T')[0];
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, date, status)
      VALUES (${customer_id}, ${amount * 100}, ${date}, ${status})
    `;
  } catch {
    return { message: 'DB error: Failed to create invoice' };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customer_id, amount, status } = InvoiceFormSchema.parse(
    Object.fromEntries(formData.entries()),
  );
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customer_id}, amount = ${
        amount * 100
      }, status = ${status}
      WHERE id = ${id}
    `;
  } catch {
    return { message: 'DB error: Failed to update invoice' };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    return { message: 'DB error: Failed to delete invoice' };
  }
}
