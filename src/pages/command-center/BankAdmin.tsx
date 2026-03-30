import { useState, useRef } from "react";
import { toast } from "sonner";
import { Building2, Plus, Upload, Pencil, Trash2, ExternalLink, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import BankForm from "@/components/command-center/bank-admin/BankForm";
import {
  useBanksAdmin,
  useDeleteBank,
  useToggleBankActive,
  useBulkImportBanks,
  formatLimitRange,
  type Bank,
  type ProductType,
  type BureauType,
} from "@/hooks/useBanksAdmin";
import { useCommandCenterRole } from "@/hooks/useCommandCenterRole";
import { useNavigate } from "react-router-dom";

type SortField = "name" | "sequence_priority";
type SortDirection = "asc" | "desc";

// CSV Import modal state
interface CsvPreviewRow {
  name: string;
  product_name: string;
  product_type: string;
  bureau_pulled: string;
  requires_relationship: string;
  typical_limit_min: string;
  typical_limit_max: string;
  application_url: string;
  sequence_priority: string;
  notes: string;
  is_active: string;
}

const PRODUCT_TYPE_MAP: Record<string, ProductType> = {
  creditcard: "CreditCard",
  "credit card": "CreditCard",
  loc: "LOC",
  "line of credit": "LOC",
  termloan: "TermLoan",
  "term loan": "TermLoan",
};

const BUREAU_MAP: Record<string, BureauType> = {
  experian: "Experian",
  equifax: "Equifax",
  transunion: "TransUnion",
};

export default function BankAdmin() {
  const navigate = useNavigate();
  const { role, isLoading: roleLoading } = useCommandCenterRole();
  const { data: banks, isLoading } = useBanksAdmin();
  const deleteMutation = useDeleteBank();
  const toggleMutation = useToggleBankActive();
  const bulkImportMutation = useBulkImportBanks();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // CSV Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  // Redirect non-admins
  if (!roleLoading && role !== "admin") {
    navigate("/command-center");
    return null;
  }

  // Sort banks
  const sortedBanks = [...(banks || [])].sort((a, b) => {
    let comparison = 0;
    if (sortField === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === "sequence_priority") {
      comparison = (a.sequence_priority || 0) - (b.sequence_priority || 0);
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Bank deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete bank");
    }
  };

  const handleToggleActive = async (bank: Bank) => {
    try {
      await toggleMutation.mutateAsync({
        id: bank.id,
        isActive: !bank.is_active,
      });
      toast.success(`Bank ${bank.is_active ? "deactivated" : "activated"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update bank status");
    }
  };

  const handleCsvImport = () => {
    fileInputRef.current?.click();
  };

  const parseCsv = (text: string): CsvPreviewRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row");
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

    // Map header indices
    const indices: Record<string, number> = {};
    const expectedFields = [
      "name",
      "product_name",
      "product_type",
      "bureau_pulled",
      "requires_relationship",
      "typical_limit_min",
      "typical_limit_max",
      "application_url",
      "sequence_priority",
      "notes",
      "is_active",
    ];

    expectedFields.forEach((field) => {
      const idx = header.findIndex((h) => h === field || h === field.replace(/_/g, " "));
      if (idx !== -1) {
        indices[field] = idx;
      }
    });

    // Check for required field
    if (indices.name === undefined) {
      throw new Error("CSV must have a 'name' column");
    }

    // Parse data rows
    const rows: CsvPreviewRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      rows.push({
        name: values[indices.name] || "",
        product_name: values[indices.product_name] || "",
        product_type: values[indices.product_type] || "",
        bureau_pulled: values[indices.bureau_pulled] || "",
        requires_relationship: values[indices.requires_relationship] || "false",
        typical_limit_min: values[indices.typical_limit_min] || "",
        typical_limit_max: values[indices.typical_limit_max] || "",
        application_url: values[indices.application_url] || "",
        sequence_priority: values[indices.sequence_priority] || "0",
        notes: values[indices.notes] || "",
        is_active: values[indices.is_active] || "true",
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCsv(text);
        if (rows.length === 0) {
          toast.error("No valid data rows found in CSV");
          return;
        }
        setCsvPreview(rows);
        setShowCsvPreview(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to parse CSV");
      }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    // Convert preview rows to import format
    const importData = csvPreview
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        product_name: row.product_name.trim() || undefined,
        product_type: PRODUCT_TYPE_MAP[row.product_type.toLowerCase()] || undefined,
        bureau_pulled: BUREAU_MAP[row.bureau_pulled.toLowerCase()] || undefined,
        requires_relationship: row.requires_relationship.toLowerCase() === "true" || row.requires_relationship === "1",
        typical_limit_min: row.typical_limit_min ? Number(row.typical_limit_min) : undefined,
        typical_limit_max: row.typical_limit_max ? Number(row.typical_limit_max) : undefined,
        application_url: row.application_url.trim() || undefined,
        sequence_priority: row.sequence_priority ? Number(row.sequence_priority) : 0,
        notes: row.notes.trim() || undefined,
        is_active: row.is_active.toLowerCase() !== "false" && row.is_active !== "0",
      }));

    if (importData.length === 0) {
      toast.error("No valid banks to import");
      return;
    }

    try {
      const result = await bulkImportMutation.mutateAsync({ banks: importData });
      if (result.successCount > 0) {
        toast.success(`Successfully imported ${result.successCount} bank(s)`);
      }
      if (result.errorCount > 0) {
        toast.error(`Failed to import ${result.errorCount} bank(s)`);
        console.log("Import errors:", result.errors);
      }
      setShowCsvPreview(false);
      setCsvPreview([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import banks");
    }
  };

  const getProductTypeBadge = (type: ProductType | null) => {
    if (!type) return <span className="text-slate-400">—</span>;
    const styles: Record<ProductType, string> = {
      CreditCard: "bg-blue-100 text-blue-700",
      LOC: "bg-purple-100 text-purple-700",
      TermLoan: "bg-amber-100 text-amber-700",
    };
    const labels: Record<ProductType, string> = {
      CreditCard: "Credit Card",
      LOC: "Line of Credit",
      TermLoan: "Term Loan",
    };
    return (
      <Badge variant="secondary" className={styles[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const getBureauBadge = (bureau: BureauType | null) => {
    if (!bureau) return <span className="text-slate-400">—</span>;
    const styles: Record<BureauType, string> = {
      Experian: "bg-red-100 text-red-700",
      Equifax: "bg-orange-100 text-orange-700",
      TransUnion: "bg-green-100 text-green-700",
    };
    return (
      <Badge variant="secondary" className={styles[bureau]}>
        {bureau}
      </Badge>
    );
  };

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-600" />
            Bank Master List
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage banks and their products for the funding sequence
          </p>
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Import CSV file"
          />
          <Button
            variant="outline"
            onClick={handleCsvImport}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => {
              setEditingBank(null);
              setFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Bank
          </Button>
        </div>
      </div>

      {/* Banks Table */}
      <Card className="border border-slate-200 rounded-xl shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedBanks.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No banks found</p>
              <p className="text-sm">Add your first bank to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Bank Name
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bureau</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Limit Range</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("sequence_priority")}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Priority
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBanks.map((bank) => (
                  <TableRow key={bank.id} className={!bank.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{bank.name}</TableCell>
                    <TableCell>{bank.product_name || "—"}</TableCell>
                    <TableCell>{getProductTypeBadge(bank.product_type)}</TableCell>
                    <TableCell>{getBureauBadge(bank.bureau_pulled)}</TableCell>
                    <TableCell>
                      {bank.requires_relationship ? (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatLimitRange(bank.typical_limit_min, bank.typical_limit_max)}
                    </TableCell>
                    <TableCell>
                      {bank.application_url ? (
                        <a
                          href={bank.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Link
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{bank.sequence_priority}</TableCell>
                    <TableCell>
                      <Switch
                        checked={bank.is_active}
                        onCheckedChange={() => handleToggleActive(bank)}
                        disabled={toggleMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(bank)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(bank)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bank Form Sheet */}
      <BankForm
        open={formOpen}
        onOpenChange={setFormOpen}
        bank={editingBank}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              This action cannot be undone. Any existing applications linked to this
              bank will retain the bank reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Preview Dialog */}
      <AlertDialog open={showCsvPreview} onOpenChange={setShowCsvPreview}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Import Preview</AlertDialogTitle>
            <AlertDialogDescription>
              Review {csvPreview.length} row(s) before importing. Rows with missing
              required fields will be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {csvPreview.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Name</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.slice(0, 20).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className={row.name ? "" : "text-red-500"}>
                          {row.name || "(missing)"}
                        </TableCell>
                        <TableCell>{row.product_name}</TableCell>
                        <TableCell>{row.product_type}</TableCell>
                        <TableCell>{row.bureau_pulled}</TableCell>
                        <TableCell>{row.is_active}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvPreview.length > 20 && (
                  <p className="p-2 text-sm text-slate-500 text-center">
                    ...and {csvPreview.length - 20} more rows
                  </p>
                )}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCsvPreview([])}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              disabled={bulkImportMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {bulkImportMutation.isPending ? "Importing..." : `Import ${csvPreview.length} Banks`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
