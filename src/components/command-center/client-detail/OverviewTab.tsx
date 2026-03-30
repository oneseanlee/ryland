import { useState } from "react";
import { format } from "date-fns";
import { Eye, EyeOff, Edit2, Check, X, Building2, User, CreditCard, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldCopyButton } from "./FieldCopyButton";
import type { FundingClient } from "@/hooks/useClient";

interface OverviewTabProps {
  client: FundingClient;
  onUpdate: (updates: Partial<FundingClient>) => void;
  isUpdating: boolean;
}

interface EditableFieldProps {
  label: string;
  value: string | number | null | undefined;
  fieldName: keyof FundingClient;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  type?: "text" | "number" | "date";
  mask?: boolean;
  maskPattern?: (value: string) => string;
}

function EditableField({
  label,
  value,
  fieldName,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  type = "text",
  mask = false,
  maskPattern,
}: EditableFieldProps) {
  const [editValue, setEditValue] = useState(String(value || ""));
  const [isRevealed, setIsRevealed] = useState(false);

  const displayValue = mask && !isRevealed && value
    ? maskPattern?.(String(value)) || "••••••••"
    : value || "—";

  const handleSave = () => {
    onSave(editValue);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-500">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type={type === "date" ? "date" : type === "number" ? "number" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave}>
            <Check className="h-4 w-4 text-emerald-500" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group space-y-1">
      <Label className="text-xs font-medium text-slate-500">{label}</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-900 font-medium">{displayValue}</span>
        {value && mask && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsRevealed(!isRevealed)}
          >
            {isRevealed ? (
              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-slate-400" />
            )}
          </Button>
        )}
        <FieldCopyButton value={value} label={label} />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onEdit}
        >
          <Edit2 className="h-3.5 w-3.5 text-slate-400" />
        </Button>
      </div>
    </div>
  );
}

// SSN masking: show last 4 digits only
function maskSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `***-**-${cleaned.slice(-4)}`;
  }
  return "***-**-****";
}

// Generic credential masking
function maskCredential(value: string): string {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
}

// Credential field component for nested JSONB fields
interface CredentialFieldProps {
  label: string;
  value: string | undefined;
  onSave: (value: string) => void;
  mask?: boolean;
  maskPattern?: (value: string) => string;
}

function CredentialField({
  label,
  value,
  onSave,
  mask = false,
  maskPattern,
}: CredentialFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isRevealed, setIsRevealed] = useState(false);

  const displayValue = mask && !isRevealed && value
    ? maskPattern?.(value) || "••••••••"
    : value || "—";

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-500">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave}>
            <Check className="h-4 w-4 text-emerald-500" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group space-y-1">
      <Label className="text-xs font-medium text-slate-500">{label}</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-900 font-medium">{displayValue}</span>
        {value && mask && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsRevealed(!isRevealed)}
          >
            {isRevealed ? (
              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-slate-400" />
            )}
          </Button>
        )}
        <FieldCopyButton value={value} label={label} />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-3.5 w-3.5 text-slate-400" />
        </Button>
      </div>
    </div>
  );
}

// Original maskCredential function - keeping for compatibility
function _maskCredential(value: string): string {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
}

export function OverviewTab({ client, onUpdate, isUpdating }: OverviewTabProps) {
  const [editingField, setEditingField] = useState<keyof FundingClient | null>(null);

  const handleEdit = (field: keyof FundingClient) => {
    setEditingField(field);
  };

  const handleSave = (field: keyof FundingClient, value: string) => {
    const updates: Partial<FundingClient> = {};

    // Handle numeric fields
    if (field === "personal_income" || field === "business_revenue" || field === "monthly_deposits") {
      updates[field] = value ? parseFloat(value) : null;
    } else {
      (updates as Record<string, string | null>)[field] = value || null;
    }

    onUpdate(updates);
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  // Format address from JSONB
  const formatAddress = (addr: Record<string, string> | null): string => {
    if (!addr) return "—";
    const parts = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-slate-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EditableField
              label="Full Name"
              value={client.full_name}
              fieldName="full_name"
              isEditing={editingField === "full_name"}
              onEdit={() => handleEdit("full_name")}
              onSave={(value) => handleSave("full_name", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="Email"
              value={client.email}
              fieldName="email"
              isEditing={editingField === "email"}
              onEdit={() => handleEdit("email")}
              onSave={(value) => handleSave("email", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="Phone"
              value={client.phone}
              fieldName="phone"
              isEditing={editingField === "phone"}
              onEdit={() => handleEdit("phone")}
              onSave={(value) => handleSave("phone", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="Date of Birth"
              value={client.dob ? format(new Date(client.dob), "MM/dd/yyyy") : null}
              fieldName="dob"
              isEditing={editingField === "dob"}
              onEdit={() => handleEdit("dob")}
              onSave={(value) => handleSave("dob", value)}
              onCancel={handleCancel}
              type="date"
            />
            <EditableField
              label="SSN"
              value={client.ssn_encrypted}
              fieldName="ssn_encrypted"
              isEditing={editingField === "ssn_encrypted"}
              onEdit={() => handleEdit("ssn_encrypted")}
              onSave={(value) => handleSave("ssn_encrypted", value)}
              onCancel={handleCancel}
              mask={true}
              maskPattern={maskSSN}
            />
            <EditableField
              label="Mother's Maiden Name"
              value={client.mothers_maiden_name}
              fieldName="mothers_maiden_name"
              isEditing={editingField === "mothers_maiden_name"}
              onEdit={() => handleEdit("mothers_maiden_name")}
              onSave={(value) => handleSave("mothers_maiden_name", value)}
              onCancel={handleCancel}
            />
            <div className="md:col-span-2 lg:col-span-3">
              <div className="group space-y-1">
                <Label className="text-xs font-medium text-slate-500">Home Address</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 font-medium">
                    {formatAddress(client.home_address as Record<string, string>)}
                  </span>
                  <FieldCopyButton
                    value={formatAddress(client.home_address as Record<string, string>)}
                    label="Home Address"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-500" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EditableField
              label="Company Name"
              value={client.company_name}
              fieldName="company_name"
              isEditing={editingField === "company_name"}
              onEdit={() => handleEdit("company_name")}
              onSave={(value) => handleSave("company_name", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="EIN"
              value={client.ein}
              fieldName="ein"
              isEditing={editingField === "ein"}
              onEdit={() => handleEdit("ein")}
              onSave={(value) => handleSave("ein", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="DUNS"
              value={client.duns}
              fieldName="duns"
              isEditing={editingField === "duns"}
              onEdit={() => handleEdit("duns")}
              onSave={(value) => handleSave("duns", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="Company Email"
              value={client.company_email}
              fieldName="company_email"
              isEditing={editingField === "company_email"}
              onEdit={() => handleEdit("company_email")}
              onSave={(value) => handleSave("company_email", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="Company Phone"
              value={client.company_phone}
              fieldName="company_phone"
              isEditing={editingField === "company_phone"}
              onEdit={() => handleEdit("company_phone")}
              onSave={(value) => handleSave("company_phone", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="Website"
              value={client.website}
              fieldName="website"
              isEditing={editingField === "website"}
              onEdit={() => handleEdit("website")}
              onSave={(value) => handleSave("website", value)}
              onCancel={handleCancel}
            />
            <EditableField
              label="Annual Revenue"
              value={client.business_revenue}
              fieldName="business_revenue"
              isEditing={editingField === "business_revenue"}
              onEdit={() => handleEdit("business_revenue")}
              onSave={(value) => handleSave("business_revenue", value)}
              onCancel={handleCancel}
              type="number"
            />
            <EditableField
              label="Monthly Deposits"
              value={client.monthly_deposits}
              fieldName="monthly_deposits"
              isEditing={editingField === "monthly_deposits"}
              onEdit={() => handleEdit("monthly_deposits")}
              onSave={(value) => handleSave("monthly_deposits", value)}
              onCancel={handleCancel}
              type="number"
            />
            <div className="md:col-span-2 lg:col-span-3">
              <div className="group space-y-1">
                <Label className="text-xs font-medium text-slate-500">Business Address</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 font-medium">
                    {formatAddress(client.company_address as Record<string, string>)}
                  </span>
                  <FieldCopyButton
                    value={formatAddress(client.company_address as Record<string, string>)}
                    label="Business Address"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-500" />
            Credit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">MFSN Credentials</h4>
              <div className="space-y-3">
                <CredentialField
                  label="Username"
                  value={(client.mfsn_credentials as Record<string, string>)?.username}
                  onSave={(value) => {
                    const current = (client.mfsn_credentials as Record<string, string>) || {};
                    onUpdate({
                      mfsn_credentials: { ...current, username: value },
                    });
                  }}
                  mask={true}
                  maskPattern={maskCredential}
                />
                <CredentialField
                  label="Password"
                  value={(client.mfsn_credentials as Record<string, string>)?.password}
                  onSave={(value) => {
                    const current = (client.mfsn_credentials as Record<string, string>) || {};
                    onUpdate({
                      mfsn_credentials: { ...current, password: value },
                    });
                  }}
                  mask={true}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">NAV Credentials</h4>
              <div className="space-y-3">
                <CredentialField
                  label="Username"
                  value={(client.nav_credentials as Record<string, string>)?.username}
                  onSave={(value) => {
                    const current = (client.nav_credentials as Record<string, string>) || {};
                    onUpdate({
                      nav_credentials: { ...current, username: value },
                    });
                  }}
                  mask={true}
                  maskPattern={maskCredential}
                />
                <CredentialField
                  label="Password"
                  value={(client.nav_credentials as Record<string, string>)?.password}
                  onSave={(value) => {
                    const current = (client.nav_credentials as Record<string, string>) || {};
                    onUpdate({
                      nav_credentials: { ...current, password: value },
                    });
                  }}
                  mask={true}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <EditableField
                label="Funding Goal"
                value={client.funding_goal}
                fieldName="funding_goal"
                isEditing={editingField === "funding_goal"}
                onEdit={() => handleEdit("funding_goal")}
                onSave={(value) => handleSave("funding_goal", value)}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Relationships */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="h-5 w-5 text-slate-500" />
            Banking Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Checking Accounts */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Existing Checking Accounts</h4>
              {client.existing_checking_accounts &&
              Array.isArray(client.existing_checking_accounts) &&
              client.existing_checking_accounts.length > 0 ? (
                <div className="space-y-2">
                  {(client.existing_checking_accounts as Array<Record<string, string>>).map(
                    (account, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Landmark className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {account.bank_name || "Unknown Bank"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {account.account_type || "Checking"}
                              {account.open_date && ` • Opened ${account.open_date}`}
                            </p>
                          </div>
                        </div>
                        <FieldCopyButton value={account.bank_name} label="Bank Name" />
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No checking accounts recorded</p>
              )}
            </div>

            {/* Credit Cards */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Existing Credit Cards</h4>
              {client.existing_credit_cards &&
              Array.isArray(client.existing_credit_cards) &&
              client.existing_credit_cards.length > 0 ? (
                <div className="space-y-2">
                  {(client.existing_credit_cards as Array<Record<string, string | number>>).map(
                    (card, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {card.card_name || "Unknown Card"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {card.bank_name}
                              {card.limit && ` • $${Number(card.limit).toLocaleString()} limit`}
                              {card.open_date && ` • Opened ${card.open_date}`}
                            </p>
                          </div>
                        </div>
                        <FieldCopyButton value={card.card_name as string} label="Card Name" />
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No credit cards recorded</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
