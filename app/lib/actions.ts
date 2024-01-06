'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { type InvoiceFormState } from './definitions';

const InvoiceSchema = z.object({
  id: z.string({ invalid_type_error: 'Select a customer' }),
  customer_id: z.string(),
  amount: z.coerce.number().gt(0, { message: 'Amount must be greater then 0' }),
  date: z.string(),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Select a status',
  }),
});

const InvoiceFormSchema = InvoiceSchema.omit({ id: true, date: true });

export async function createInvoice(
  prevState: InvoiceFormState,
  formData: FormData,
) {
  const validatedFields = InvoiceFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create invoice',
    };
  }
  const { customer_id, amount, status } = validatedFields.data;
  const date = new Date().toISOString().split('T')[0];
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, date, status)
      VALUES (${customer_id}, ${amount * 100}, ${date}, ${status})
    `;
  } catch (error) {
    return { message: 'DB error: Failed to create invoice' };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: InvoiceFormState,
  formData: FormData,
) {
  const validatedFields = InvoiceFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to update invoice',
    };
  }
  const { customer_id, amount, status } = validatedFields.data;
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customer_id}, amount = ${
        amount * 100
      }, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
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
