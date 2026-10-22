# Getting inquiry documents onto the GoHighLevel lead

## Options

1. **Attach files to a "Documents" file field on the GoHighLevel contact (recommended, after a check)**
   GoHighLevel has a documented way to upload files into a contact's file-upload custom field. Staff then see the files right on the lead, with no extra login.
   First we confirm how GoHighLevel stores these files: can someone outside your account open them by guessing or sharing the link? Credit reports and IDs are sensitive, so we only turn this on if the files stay private to your GoHighLevel users.

2. **Secure staff link on the lead (fallback, works today)**
   The lead note gets a "View documents" link into the admin portal. Only signed-in admins can open the files. Nothing leaves your private storage.

3. **Temporary download links in the note** — not recommended. Anyone with the link can open the file until it expires, and staff lose access after it expires.

## What we'll do
1. Create a "Inquiry Documents" file field in GoHighLevel (or use one you name) and run a single labeled test upload with a dummy PDF.
2. Check that file's privacy: open its link while signed out. If it opens, stop and keep option 2.
3. If it stays private: each delivered inquiry uploads its documents to that field, one by one. Each file is marked done as it goes, so retries never upload duplicates. Slack still never shows document content.
4. The admin Inquiry Orders page shows per-file status ("sent to GoHighLevel", "failed — retry").
5. Keep the secure portal link in the note either way, as a backup.

## Technical details
- Endpoint: `POST /forms/upload-custom-files?contactId=&locationId=` (multipart, key `<customFieldId>_<uuid>`). The integration needs the files write scope, and the field ID is stored in inquiry settings.
- Add a `ghl_file_state` column on `inquiry_documents`. The delivery function downloads each file from private storage with service access and streams it straight to GoHighLevel, without making it public.
- Replace the `blocked_private_upload` path only after the step 2 check passes. Update the regression tests covering no duplicates on retry, files skipped when the check fails, and Slack excluding content.
