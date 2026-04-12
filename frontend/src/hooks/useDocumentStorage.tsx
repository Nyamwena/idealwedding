'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanningHydration } from '@/hooks/PlanningHydrationContext';
import { loadUserJsonArray, saveUserJsonArray, PLANNING_PARTS } from '@/lib/userPlanningStorage';

/** Max single file size for base64 in localStorage (per browser limits). */
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

// Document Storage Interfaces
export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: 'contract' | 'receipt' | 'photo' | 'invitation' | 'other';
  category: string;
  fileSize: number;
  mimeType: string;
  /** Legacy / display; user uploads use `dataUrl` */
  url: string;
  /** data:...;base64,... — required for download/preview of uploads */
  dataUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  isPublic: boolean;
  metadata?: {
    vendorId?: string;
    guestId?: string;
    eventDate?: string;
    amount?: number;
    [key: string]: unknown;
  };
}

export interface DocumentCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface UseDocumentStorageReturn {
  // Documents
  documents: Document[];
  uploadDocument: (file: File, metadata: Partial<Document>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<void>;

  // Categories
  categories: DocumentCategory[];
  getDocumentsByCategory: (category: string) => Document[];
  getDocumentsByType: (type: Document['type']) => Document[];

  // Search and Filter
  searchDocuments: (query: string) => Document[];
  getDocumentsByTag: (tag: string) => Document[];

  // Statistics
  getStorageStatistics: () => {
    totalDocuments: number;
    totalSize: number;
    byType: { [key: string]: number };
    byCategory: { [key: string]: number };
  };

  // File Operations
  downloadDocument: (documentId: string) => Promise<void>;
  previewDocument: (documentId: string) => void;

  // Loading and Error States
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('read failed'));
    fr.readAsDataURL(file);
  });
}

function resolveBlobHref(doc: Document): string | null {
  if (doc.dataUrl?.startsWith('data:')) return doc.dataUrl;
  if (doc.url?.startsWith('data:')) return doc.url;
  return null;
}

export function useDocumentStorage(): UseDocumentStorageReturn {
  const { user } = useAuth();
  const planningHydration = usePlanningHydration();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  const categories: DocumentCategory[] = [
    {
      id: 'vendors',
      name: 'Vendors',
      icon: '🏢',
      color: 'bg-blue-100 text-blue-800',
      description: 'Contracts, agreements, and vendor communications',
    },
    {
      id: 'payments',
      name: 'Payments',
      icon: '💰',
      color: 'bg-green-100 text-green-800',
      description: 'Receipts, invoices, and payment records',
    },
    {
      id: 'guests',
      name: 'Guests',
      icon: '👥',
      color: 'bg-purple-100 text-purple-800',
      description: 'Guest lists, RSVPs, and guest communications',
    },
    {
      id: 'venue',
      name: 'Venue',
      icon: '🏛️',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Venue contracts, layouts, and venue-related documents',
    },
    {
      id: 'planning',
      name: 'Planning',
      icon: '📋',
      color: 'bg-orange-100 text-orange-800',
      description: 'Timelines, checklists, and planning documents',
    },
    {
      id: 'photos',
      name: 'Photos',
      icon: '📸',
      color: 'bg-pink-100 text-pink-800',
      description: 'Inspiration photos, venue photos, and reference images',
    },
    {
      id: 'legal',
      name: 'Legal',
      icon: '📄',
      color: 'bg-red-100 text-red-800',
      description: 'Marriage license, legal documents, and certificates',
    },
    {
      id: 'other',
      name: 'Other',
      icon: '📁',
      color: 'bg-gray-100 text-gray-800',
      description: 'Miscellaneous documents and files',
    },
  ];

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const loaded = loadUserJsonArray<Document>(String(user.id), PLANNING_PARTS.userDocuments);
      setDocuments(
        loaded.map((d) => ({
          ...d,
          dataUrl: d.dataUrl || (d.url?.startsWith('data:') ? d.url : d.dataUrl),
        })),
      );
    } catch (e) {
      console.error(e);
      setError('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, planningHydration]);

  const uploadDocument = async (file: File, metadata: Partial<Document>) => {
    if (!user) {
      setError('Sign in to upload documents.');
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(`File must be ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB or smaller.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const dataUrl = await readFileAsDataURL(file);
      const newDocument: Document = {
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        originalName: file.name,
        type: metadata.type || 'other',
        category: metadata.category || 'other',
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        url: dataUrl,
        dataUrl,
        description: metadata.description,
        tags: metadata.tags || [],
        uploadedBy: String(user.id),
        uploadedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isPublic: metadata.isPublic || false,
        metadata: metadata.metadata,
      };

      setDocuments((prev) => {
        const next = [newDocument, ...prev];
        try {
          saveUserJsonArray(String(user.id), PLANNING_PARTS.userDocuments, next);
        } catch {
          setError('Could not save file. Storage may be full—try a smaller file.');
          return prev;
        }
        return next;
      });
    } catch (err) {
      setError('Failed to read or upload file.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      setDocuments((prev) => {
        const next = prev.filter((doc) => doc.id !== documentId);
        try {
          saveUserJsonArray(String(user.id), PLANNING_PARTS.userDocuments, next);
        } catch {
          setError('Could not update storage after delete.');
          return prev;
        }
        return next;
      });
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocument = async (documentId: string, updates: Partial<Document>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      setDocuments((prev) => {
        const next = prev.map((doc) =>
          doc.id === documentId ? { ...doc, ...updates, lastModified: new Date().toISOString() } : doc,
        );
        try {
          saveUserJsonArray(String(user.id), PLANNING_PARTS.userDocuments, next);
        } catch {
          setError('Could not save changes.');
          return prev;
        }
        return next;
      });
    } catch (err) {
      setError('Failed to update document');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentsByCategory = (category: string) => {
    return documents.filter((doc) => doc.category === category);
  };

  const getDocumentsByType = (type: Document['type']) => {
    return documents.filter((doc) => doc.type === type);
  };

  const searchDocuments = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(lowercaseQuery) ||
        doc.originalName.toLowerCase().includes(lowercaseQuery) ||
        doc.description?.toLowerCase().includes(lowercaseQuery) ||
        doc.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
    );
  };

  const getDocumentsByTag = (tag: string) => {
    return documents.filter((doc) => doc.tags?.includes(tag));
  };

  const getStorageStatistics = () => {
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

    const byType: { [key: string]: number } = {};
    const byCategory: { [key: string]: number } = {};

    documents.forEach((doc) => {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    });

    return {
      totalDocuments,
      totalSize,
      byType,
      byCategory,
    };
  };

  const downloadDocument = async (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;
    const href = resolveBlobHref(doc);
    if (!href) {
      setError('This document has no saved file data. Remove it and upload again.');
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = href;
      link.download = doc.originalName || doc.name;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download document');
      console.error(err);
    }
  };

  const previewDocument = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;
    const href = resolveBlobHref(doc);
    if (!href) {
      setError('Preview is not available for this file. Upload it again from your device.');
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return {
    documents,
    uploadDocument,
    deleteDocument,
    updateDocument,
    categories,
    getDocumentsByCategory,
    getDocumentsByType,
    searchDocuments,
    getDocumentsByTag,
    getStorageStatistics,
    downloadDocument,
    previewDocument,
    isLoading,
    isUploading,
    error,
  };
}
