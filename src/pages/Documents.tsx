import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, ExternalLink, FileText, Plus, Upload, Trash2, Search, Folder, FolderPlus, ChevronRight, Home as HomeIcon } from "lucide-react";
import ViewToggle from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type DocumentType =
  | "rc"
  | "insurance"
  | "puc"
  | "invoice"
  | "sale_agreement"
  | "delivery_note"
  | "id_proof"
  | "driving_license";

const documentTypeMeta: Record<string, { label: string; className: string }> = {
  rc: { label: "RC Book", className: "bg-blue-100 text-blue-700 border-blue-300" },
  insurance: { label: "Insurance", className: "bg-green-100 text-green-700 border-green-300" },
  puc: { label: "PUC", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  invoice: { label: "Invoice", className: "bg-purple-100 text-purple-700 border-purple-300" },
  sale_agreement: { label: "Sale Agreement", className: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  delivery_note: { label: "Delivery Note", className: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  id_proof: { label: "ID Proof", className: "bg-orange-100 text-orange-700 border-orange-300" },
  driving_license: { label: "Driving License", className: "bg-rose-100 text-rose-700 border-rose-300" },
  company: { label: "Company", className: "bg-teal-100 text-teal-700 border-teal-300" },
};

const documentTypes: { value: string; label: string }[] = [
  { value: "rc", label: "RC Book" },
  { value: "insurance", label: "Insurance" },
  { value: "puc", label: "PUC" },
  { value: "invoice", label: "Invoice" },
  { value: "sale_agreement", label: "Sale Agreement" },
  { value: "delivery_note", label: "Delivery Note" },
  { value: "id_proof", label: "ID Proof" },
  { value: "driving_license", label: "Driving License" },
  { value: "company", label: "Company" },
];

// Extended categories for the add form
const allDocumentCategories: { value: string; label: string }[] = [
  ...documentTypes,
  { value: "invoice", label: "Tax Invoice" },
  { value: "sale_agreement", label: "Purchase Agreement" },
  { value: "delivery_note", label: "NOC / Transfer Letter" },
  { value: "id_proof", label: "GST Certificate" },
  { value: "id_proof", label: "Trade License" },
  { value: "id_proof", label: "Company Registration" },
  { value: "insurance", label: "Road Tax Receipt" },
  { value: "puc", label: "Fitness Certificate" },
];

const Documents = () => {
  const { viewMode, setViewMode } = useViewMode("documents");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Folder navigation
  const [currentFolder, setCurrentFolder] = useState<string>(""); // "" = root
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingFolders, setPendingFolders] = useState<string[]>([]); // client-side folders (no files yet)

  // In-app dialogs for rename / delete confirms
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<string | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState<string | null>(null);

  // Add Document form state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    documentName: "",
    documentType: "rc" as string,
    vehicleId: "",
    expiryDate: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: ['documents', userId],
    queryFn: async () => {
      if (!userId) return { documents: [], vehicles: [] };
      const [docsRes, vehiclesRes] = await Promise.all([
        supabase.from("documents").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("vehicles").select("id,brand,model,variant,code").eq("user_id", userId).order("brand"),
      ]);
      return { documents: docsRes.data || [], vehicles: vehiclesRes.data || [] };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const documents = queryData?.documents || [];
  const vehicles = queryData?.vehicles || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-chart-2 text-white";
      case "expired": return "bg-destructive text-white";
      default: return "bg-chart-3 text-white";
    }
  };

  // The `documents` bucket is PRIVATE, so `getPublicUrl` returns a URL that 404s
  // ("bucket not found"). Extract the storage path and mint a short-lived signed
  // URL for viewing / downloading.
  const extractDocPath = (url: string): string | null => {
    const marker = "/documents/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };

  const getViewableUrl = async (doc: Document): Promise<string> => {
    const path = extractDocPath(doc.document_url);
    if (!path) return doc.document_url;
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 60 * 60); // 1 hour
    if (error || !data?.signedUrl) return doc.document_url;
    return data.signedUrl;
  };

  const [viewerUrl, setViewerUrl] = useState<string>("");
  const openDocViewer = async (doc: Document) => {
    setSelectedDoc(doc);
    setViewerUrl("");
    setDocViewerOpen(true);
    const url = await getViewableUrl(doc);
    setViewerUrl(url);
  };

  const handleDownload = async (doc: Document) => {
    try {
      const url = await getViewableUrl(doc);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl; a.download = doc.document_name || "document";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(objUrl);
    } catch (err: any) {
      console.error("Download failed", err);
      toast({ title: "Download failed", description: err?.message || "Please try again", variant: "destructive" });
    }
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.code})` : "Unknown";
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase.from("documents").delete().eq("id", docId);
      if (error) throw error;
      toast({ title: "Document deleted" });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddDocument = async () => {
    if (!selectedFile || !addForm.documentName) {
      toast({ title: "Please fill document name and select a file", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    try {
      const refId = addForm.vehicleId || "general";
      const fileName = `${refId}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(fileName);

      const { error } = await supabase.from("documents").insert({
        reference_id: addForm.vehicleId || user.id,
        reference_type: addForm.vehicleId ? "vehicle" : "general",
        user_id: user.id,
        document_name: addForm.documentName,
        document_type: addForm.documentType as any,
        document_url: publicUrl,
        status: "active" as const,
        expiry_date: addForm.expiryDate || null,
        folder_path: currentFolder || "",
      } as any);
      if (error) throw error;

      toast({ title: "Document uploaded successfully" });
      setAddDialogOpen(false);
      setAddForm({ documentName: "", documentType: "rc" as string, vehicleId: "", expiryDate: "" });
      setSelectedFile(null);
      // Remove from pending folders since a real file now exists there
      if (currentFolder) setPendingFolders(prev => prev.filter(f => f !== currentFolder));
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const full = currentFolder ? `${currentFolder}/${name}` : name;
    setPendingFolders(prev => Array.from(new Set([...prev, full])));
    setNewFolderName("");
    setNewFolderDialogOpen(false);
    toast({ title: "Folder created", description: full });
  };

  const openRenameFolder = (oldPath: string) => {
    setRenameTarget(oldPath);
    setRenameValue(oldPath.split("/").pop() || "");
  };

  const handleRenameFolder = async () => {
    const oldPath = renameTarget;
    if (!oldPath) return;
    const newName = renameValue.trim();
    if (!newName) return;
    const parent = oldPath.includes("/") ? oldPath.slice(0, oldPath.lastIndexOf("/")) : "";
    const newPath = parent ? `${parent}/${newName}` : newName;
    if (newPath === oldPath) { setRenameTarget(null); return; }
    try {
      const affected = documents.filter((d: any) => {
        const fp = (d.folder_path as string) || "";
        return fp === oldPath || fp.startsWith(oldPath + "/");
      });
      await Promise.all(affected.map((d: any) => {
        const fp = (d.folder_path as string) || "";
        const updated = newPath + fp.slice(oldPath.length);
        return supabase.from("documents").update({ folder_path: updated } as any).eq("id", d.id);
      }));
      setPendingFolders(prev => prev.map(p => (p === oldPath || p.startsWith(oldPath + "/") ? newPath + p.slice(oldPath.length) : p)));
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: "Folder renamed" });
    } catch (err: any) {
      toast({ title: "Rename failed", description: err.message, variant: "destructive" });
    } finally {
      setRenameTarget(null);
    }
  };

  const handleDeleteFolder = async () => {
    const path = deleteFolderTarget;
    if (!path) return;
    const affected = documents.filter((d: any) => {
      const fp = (d.folder_path as string) || "";
      return fp === path || fp.startsWith(path + "/");
    });
    try {
      const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      await Promise.all(affected.map((d: any) => {
        const fp = (d.folder_path as string) || "";
        const rest = fp === path ? "" : fp.slice(path.length + 1);
        const updated = parent ? (rest ? `${parent}/${rest}` : parent) : rest;
        return supabase.from("documents").update({ folder_path: updated } as any).eq("id", d.id);
      }));
      setPendingFolders(prev => prev.filter(p => p !== path && !p.startsWith(path + "/")));
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: "Folder deleted", description: affected.length ? `${affected.length} file(s) moved` : undefined });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleteFolderTarget(null);
    }
  };


  // Derive subfolders visible at currentFolder from existing docs + pending folders
  const allFolderPaths = Array.from(new Set([
    ...documents.map((d: any) => (d.folder_path as string) || ""),
    ...pendingFolders,
  ])).filter(Boolean);

  const subFolders = Array.from(new Set(
    allFolderPaths
      .filter(p => (currentFolder ? p.startsWith(currentFolder + "/") : true) && p !== currentFolder)
      .map(p => {
        const rest = currentFolder ? p.slice(currentFolder.length + 1) : p;
        return rest.split("/")[0];
      })
      .filter(Boolean)
  )).sort();

  const filteredDocuments = documents.filter((d: any) => {
    const folder = (d.folder_path as string) || "";
    const matchesFolder = folder === currentFolder;
    const matchesVehicle = selectedVehicle === "all" || d.reference_id === selectedVehicle;
    const matchesCategory = categoryFilter === "all" || d.document_type === categoryFilter;
    const matchesSearch =
      !searchTerm ||
      (d.document_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesVehicle && matchesCategory && matchesSearch;
  });

  const breadcrumbParts = currentFolder ? currentFolder.split("/") : [];

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage all documents</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search file name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-56"
            />
          </div>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Filter by vehicle" /></SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.code})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filter by category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {documentTypes.map(dt => (
                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setNewFolderDialogOpen(true)} className="gap-2"><FolderPlus className="h-4 w-4" /> New Folder</Button>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Document</Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => setCurrentFolder("")}
          className="flex items-center gap-1 hover:text-foreground"
        >
          <HomeIcon className="h-3.5 w-3.5" /> All Files
        </button>
        {breadcrumbParts.map((part, i) => {
          const path = breadcrumbParts.slice(0, i + 1).join("/");
          return (
            <span key={path} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <button
                type="button"
                onClick={() => setCurrentFolder(path)}
                className="hover:text-foreground"
              >{part}</button>
            </span>
          );
        })}
      </div>

      {/* Folder tiles for current level */}
      {subFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {subFolders.map(name => {
            const fullPath = currentFolder ? `${currentFolder}/${name}` : name;
            return (
              <div
                key={fullPath}
                className="relative group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition cursor-pointer"
                onClick={() => setCurrentFolder(fullPath)}
              >
                <Folder className="h-8 w-8 text-primary" />
                <span className="text-xs font-medium truncate w-full text-center">{name}</span>
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                  <Button
                    type="button" size="icon" variant="ghost" className="h-6 w-6"
                    title="Rename folder"
                    onClick={(e) => { e.stopPropagation(); openRenameFolder(fullPath); }}
                  >
                    <FileText className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
                    title="Delete folder"
                    onClick={(e) => { e.stopPropagation(); setDeleteFolderTarget(fullPath); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}


      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {currentFolder ? `${currentFolder} — ` : ""}Files ({filteredDocuments.length})
              {selectedVehicle !== "all" && (
                <span className="text-sm font-normal text-muted-foreground ml-2">- Filtered by: {getVehicleName(selectedVehicle)}</span>
              )}
            </CardTitle>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Vehicle</TableHead><TableHead>Uploaded</TableHead><TableHead>Status</TableHead><TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((d) => (
                  <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDocViewer(d)}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d.document_name}</div></TableCell>
                    <TableCell><span className={`inline-block px-2 py-0.5 rounded text-xs border ${documentTypeMeta[d.document_type as DocumentType]?.className}`}>{documentTypeMeta[d.document_type as DocumentType]?.label || d.document_type}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.reference_type === "vehicle" ? getVehicleName(d.reference_id) : d.reference_type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(d.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell><Badge className={getStatusColor(d.status)}>{d.status}</Badge></TableCell>
                    <TableCell>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteDocTarget(d.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDocuments.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{selectedVehicle === "all" ? "No documents found" : "No documents found for this vehicle"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((d) => (
              <Card key={d.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border" onClick={() => openDocViewer(d)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="font-medium text-foreground truncate flex-1">{d.document_name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteDocTarget(d.id); }} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs border ${documentTypeMeta[d.document_type as DocumentType]?.className}`}>{documentTypeMeta[d.document_type as DocumentType]?.label || d.document_type}</span>
                  <p className="text-xs text-muted-foreground truncate">{d.reference_type === "vehicle" ? getVehicleName(d.reference_id) : d.reference_type}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(d.status) + " text-xs"}>{d.status}</Badge>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(d.created_at), "dd MMM yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDocuments.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">{selectedVehicle === "all" ? "No documents found" : "No documents found for this vehicle"}</div>
            )}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={docViewerOpen} onOpenChange={setDocViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedDoc?.document_name}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => selectedDoc && handleDownload(selectedDoc)}><Download className="h-4 w-4" />Download</Button>
                <a href={viewerUrl || "#"} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-2" disabled={!viewerUrl}><ExternalLink className="h-4 w-4" />Open</Button></a>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="h-[75vh] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {!viewerUrl ? (
                <div className="text-sm text-muted-foreground">Loading document…</div>
              ) : (selectedDoc.document_url.toLowerCase().endsWith('.pdf') || viewerUrl.toLowerCase().includes('.pdf')) ? (
                <iframe src={viewerUrl} className="w-full h-full border-0" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src={viewerUrl} alt={selectedDoc.document_name} className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input placeholder="e.g. RC Book - MH02AB1234" value={addForm.documentName} onChange={(e) => setAddForm({ ...addForm, documentName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={addForm.documentType} onValueChange={(v) => setAddForm({ ...addForm, documentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {documentTypes.map(dt => (
                    <SelectItem key={dt.value} value={dt.value}>
                      <span className={`px-2 py-0.5 rounded text-xs border ${documentTypeMeta[dt.value]?.className || ''}`}>{dt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link to Vehicle (Optional)</Label>
              <Select value={addForm.vehicleId || "none"} onValueChange={(v) => setAddForm({ ...addForm, vehicleId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="No vehicle (general document)" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="none">None (General)</SelectItem>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input type="date" value={addForm.expiryDate} onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Upload File *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <Input type="file" accept="image/*,.pdf" className="hidden" id="doc-upload" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">{selectedFile ? selectedFile.name : "Click to select file"}</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDocument} disabled={uploading}>{uploading ? "Uploading..." : "Upload Document"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Location: <b>{currentFolder || "All Files (root)"}</b>
            </p>
            <div className="space-y-2">
              <Label>Folder name</Label>
              <Input
                autoFocus
                placeholder="e.g. Registration Docs"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Renaming <b>{renameTarget}</b></DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New name</Label>
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={handleRenameFolder} disabled={!renameValue.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirm */}
      <DeleteConfirmDialog
        open={!!deleteFolderTarget}
        onOpenChange={(o) => !o && setDeleteFolderTarget(null)}
        onConfirm={handleDeleteFolder}
        title={`Delete folder "${deleteFolderTarget || ""}"?`}
        description="Files inside will be moved to the parent folder. This cannot be undone."
      />

      {/* Delete Document Confirm */}
      <DeleteConfirmDialog
        open={!!deleteDocTarget}
        onOpenChange={(o) => !o && setDeleteDocTarget(null)}
        onConfirm={async () => {
          if (deleteDocTarget) await handleDeleteDocument(deleteDocTarget);
          setDeleteDocTarget(null);
        }}
        title="Delete this document?"
        description="This will permanently remove the document. This cannot be undone."
      />
    </div>
  );
};

export default Documents;
