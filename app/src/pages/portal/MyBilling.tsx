import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Eye, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  OVERDUE: 'bg-red-100 text-red-800',
};

export default function MyBilling() {
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  const invoices = data?.patient?.invoices || [];
  const payments = invoices.flatMap((inv) =>
    (inv.payments || []).map((p) => ({
      ...p,
      invoiceNumber: inv.invoiceNumber,
      invoice: inv,
    }))
  );

  const totalOutstanding = invoices
    .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + Number(i.balanceDue), 0);

  const portalPatientName = `${data?.patient?.user?.firstName || ''} ${data?.patient?.user?.lastName || ''}`.trim();

  const buildInvoiceHtml = (invoice: any) => {
    const patientName =
      `${invoice.patient?.user?.firstName || ''} ${invoice.patient?.user?.lastName || ''}`.trim() ||
      portalPatientName ||
      'Patient';
    return `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .totals { margin-top: 16px; text-align: right; }
            .meta { color: #555; margin-top: 4px; }
          </style>
        </head>
        <body>
          <h1>Invoice #${invoice.invoiceNumber}</h1>
          <div class="meta">Patient: ${patientName || 'Patient'}</div>
          <div class="meta">Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}</div>
          <div class="meta">Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || [])
                .map(
                  (item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${Number(item.unitPrice).toFixed(2)}</td>
                  <td>$${Number(item.totalPrice).toFixed(2)}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
          <div class="totals">
            <p>Subtotal: $${Number(invoice.subtotal).toFixed(2)}</p>
            <p>Tax: $${Number(invoice.taxAmount).toFixed(2)}</p>
            <p>Discount: $${Number(invoice.discountAmount).toFixed(2)}</p>
            <h3>Total: $${Number(invoice.totalAmount).toFixed(2)}</h3>
            <p>Paid: $${Number(invoice.paidAmount).toFixed(2)}</p>
            <p>Balance Due: $${Number(invoice.balanceDue).toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;
  };

  const downloadHtml = (filename: string, html: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleInvoicePrint = (invoice: any) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(buildInvoiceHtml(invoice));
    win.document.close();
    win.focus();
    win.print();
  };

  const handleInvoiceDownload = (invoice: any) => {
    downloadHtml(`invoice-${invoice.invoiceNumber}.html`, buildInvoiceHtml(invoice));
  };

  const buildReceiptHtml = (payment: any) => {
    const patientName =
      `${payment.invoice?.patient?.user?.firstName || ''} ${payment.invoice?.patient?.user?.lastName || ''}`.trim() ||
      portalPatientName ||
      'Patient';
    return `
      <html>
        <head>
          <title>Receipt ${payment.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            .row { margin: 6px 0; }
            .label { color: #666; }
          </style>
        </head>
        <body>
          <h1>Payment Receipt</h1>
          <div class="row"><span class="label">Patient:</span> ${patientName || 'Patient'}</div>
          <div class="row"><span class="label">Amount:</span> $${Number(payment.amount).toFixed(2)}</div>
          <div class="row"><span class="label">Method:</span> ${payment.method}</div>
          <div class="row"><span class="label">Date:</span> ${new Date(payment.paymentDate).toLocaleDateString()}</div>
          ${payment.invoiceNumber ? `<div class="row"><span class="label">Invoice:</span> ${payment.invoiceNumber}</div>` : ''}
          ${payment.reference ? `<div class="row"><span class="label">Reference:</span> ${payment.reference}</div>` : ''}
        </body>
      </html>
    `;
  };

  const handleReceiptPrint = (payment: any) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(buildReceiptHtml(payment));
    win.document.close();
    win.focus();
    win.print();
  };

  const handleReceiptDownload = (payment: any) => {
    downloadHtml(`receipt-${payment.id}.html`, buildReceiptHtml(payment));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/portal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">My Billing</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            ${totalOutstanding.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.length === 0 && (
              <p className="text-sm text-gray-500">No invoices found for this patient.</p>
            )}
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">#{invoice.invoiceNumber}</p>
                    <Badge className={statusColors[invoice.status] || 'bg-gray-100'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Issued: {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                  </p>
                  {invoice.createdBy && (
                    <p className="text-xs text-gray-500">
                      Created by: {invoice.createdBy.firstName} {invoice.createdBy.lastName} ({invoice.createdBy.role})
                    </p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="font-medium">
                      ${Number(invoice.totalAmount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Balance: ${Number(invoice.balanceDue).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setIsInvoiceOpen(true);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInvoicePrint(invoice)}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInvoiceDownload(invoice)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length === 0 && (
              <p className="text-sm text-gray-500">No payments found.</p>
            )}
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium">
                    ${Number(payment.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                  </p>
                  {payment.invoiceNumber && (
                    <p className="text-xs text-gray-500">Invoice: {payment.invoiceNumber}</p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="outline">{payment.method}</Badge>
                  {payment.reference && (
                    <p className="text-xs text-gray-500">{payment.reference}</p>
                  )}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReceiptPrint(payment)}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Receipt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReceiptDownload(payment)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Invoice #</p>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <Badge className={statusColors[selectedInvoice.status] || 'bg-gray-100'}>
                  {selectedInvoice.status}
                </Badge>
              </div>
              <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <div>Issue: {format(new Date(selectedInvoice.issueDate), 'MMM d, yyyy')}</div>
                <div>Due: {format(new Date(selectedInvoice.dueDate), 'MMM d, yyyy')}</div>
              </div>
              <div className="border rounded-lg">
                <div className="grid grid-cols-4 gap-2 border-b bg-gray-50 p-2 text-sm font-medium text-gray-600">
                  <div className="col-span-2">Description</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Total</div>
                </div>
                <div className="divide-y">
                  {(selectedInvoice.items || []).map((item: any) => (
                    <div key={item.id} className="grid grid-cols-4 gap-2 p-2 text-sm">
                      <div className="col-span-2">{item.description}</div>
                      <div className="text-right">{item.quantity}</div>
                      <div className="text-right">${Number(item.totalPrice).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1 text-right text-sm">
                <div>Subtotal: ${Number(selectedInvoice.subtotal).toFixed(2)}</div>
                <div>Tax: ${Number(selectedInvoice.taxAmount).toFixed(2)}</div>
                <div>Discount: ${Number(selectedInvoice.discountAmount).toFixed(2)}</div>
                <div className="text-base font-semibold">
                  Total: ${Number(selectedInvoice.totalAmount).toFixed(2)}
                </div>
                <div>Paid: ${Number(selectedInvoice.paidAmount).toFixed(2)}</div>
                <div>Balance: ${Number(selectedInvoice.balanceDue).toFixed(2)}</div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => handleInvoicePrint(selectedInvoice)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" onClick={() => handleInvoiceDownload(selectedInvoice)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
