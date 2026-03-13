'use client';

import { useState, useEffect } from 'react';

// Document Storage Interfaces
export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: 'contract' | 'receipt' | 'photo' | 'invitation' | 'other';
  category: string;
  fileSize: number;
  mimeType: string;
  url: string;
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
    [key: string]: any;
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

export function useDocumentStorage(): UseDocumentStorageReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Document categories
  const categories: DocumentCategory[] = [
    {
      id: 'vendors',
      name: 'Vendors',
      icon: '🏢',
      color: 'bg-blue-100 text-blue-800',
      description: 'Contracts, agreements, and vendor communications'
    },
    {
      id: 'payments',
      name: 'Payments',
      icon: '💰',
      color: 'bg-green-100 text-green-800',
      description: 'Receipts, invoices, and payment records'
    },
    {
      id: 'guests',
      name: 'Guests',
      icon: '👥',
      color: 'bg-purple-100 text-purple-800',
      description: 'Guest lists, RSVPs, and guest communications'
    },
    {
      id: 'venue',
      name: 'Venue',
      icon: '🏛️',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Venue contracts, layouts, and venue-related documents'
    },
    {
      id: 'planning',
      name: 'Planning',
      icon: '📋',
      color: 'bg-orange-100 text-orange-800',
      description: 'Timelines, checklists, and planning documents'
    },
    {
      id: 'photos',
      name: 'Photos',
      icon: '📸',
      color: 'bg-pink-100 text-pink-800',
      description: 'Inspiration photos, venue photos, and reference images'
    },
    {
      id: 'legal',
      name: 'Legal',
      icon: '📄',
      color: 'bg-red-100 text-red-800',
      description: 'Marriage license, legal documents, and certificates'
    },
    {
      id: 'other',
      name: 'Other',
      icon: '📁',
      color: 'bg-gray-100 text-gray-800',
      description: 'Miscellaneous documents and files'
    }
  ];

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock documents
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'venue-contract.pdf',
          originalName: 'Garden Venue Contract.pdf',
          type: 'contract',
          category: 'venue',
          fileSize: 2048576, // 2MB
          mimeType: 'application/pdf',
          url: '/documents/venue-contract.pdf',
          description: 'Wedding venue rental contract',
          tags: ['venue', 'contract', 'garden-venue'],
          uploadedBy: 'user',
          uploadedAt: '2024-01-15T10:00:00Z',
          lastModified: '2024-01-15T10:00:00Z',
          isPublic: false,
          metadata: {
            vendorId: 'vendor1',
            amount: 8000
          }
        },
        {
          id: '2',
          name: 'photography-receipt.jpg',
          originalName: 'Elite Photography Receipt.jpg',
          type: 'receipt',
          category: 'payments',
          fileSize: 1024000, // 1MB
          mimeType: 'image/jpeg',
          url: '/documents/photography-receipt.jpg',
          thumbnailUrl: '/documents/thumbnails/photography-receipt.jpg',
          description: 'Photography service payment receipt',
          tags: ['photography', 'payment', 'receipt'],
          uploadedBy: 'user',
          uploadedAt: '2024-01-20T14:30:00Z',
          lastModified: '2024-01-20T14:30:00Z',
          isPublic: false,
          metadata: {
            vendorId: 'vendor2',
            amount: 2800
          }
        },
        {
          id: '3',
          name: 'guest-list.xlsx',
          originalName: 'Wedding Guest List.xlsx',
          type: 'other',
          category: 'guests',
          fileSize: 512000, // 512KB
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          url: '/documents/guest-list.xlsx',
          description: 'Complete wedding guest list with contact information',
          tags: ['guests', 'list', 'contacts'],
          uploadedBy: 'user',
          uploadedAt: '2024-01-25T09:15:00Z',
          lastModified: '2024-01-25T09:15:00Z',
          isPublic: false
        },
        {
          id: '4',
          name: 'venue-photos.jpg',
          originalName: 'Venue Photos.jpg',
          type: 'photo',
          category: 'photos',
          fileSize: 3072000, // 3MB
          mimeType: 'image/jpeg',
          url: '/documents/venue-photos.jpg',
          thumbnailUrl: '/documents/thumbnails/venue-photos.jpg',
          description: 'Photos of the wedding venue for planning reference',
          tags: ['venue', 'photos', 'planning'],
          uploadedBy: 'user',
          uploadedAt: '2024-01-30T16:45:00Z',
          lastModified: '2024-01-30T16:45:00Z',
          isPublic: false
        }
      ];
      
      setDocuments(mockDocuments);
      
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Document Management Functions
  const uploadDocument = async (file: File, metadata: Partial<Document>) => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create document object
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        originalName: file.name,
        type: metadata.type || 'other',
        category: metadata.category || 'other',
        fileSize: file.size,
        mimeType: file.type,
        url: `/documents/${file.name}`,
        description: metadata.description,
        tags: metadata.tags || [],
        uploadedBy: 'user',
        uploadedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isPublic: metadata.isPublic || false,
        metadata: metadata.metadata
      };
      
      setDocuments(prev => [newDocument, ...prev]);
      
    } catch (err) {
      setError('Failed to upload document');
      console.error('Error uploading document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError('Failed to delete document');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocument = async (documentId: string, updates: Partial<Document>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, ...updates, lastModified: new Date().toISOString() }
          : doc
      ));
    } catch (err) {
      setError('Failed to update document');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering Functions
  const getDocumentsByCategory = (category: string) => {
    return documents.filter(doc => doc.category === category);
  };

  const getDocumentsByType = (type: Document['type']) => {
    return documents.filter(doc => doc.type === type);
  };

  const searchDocuments = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.originalName.toLowerCase().includes(lowercaseQuery) ||
      doc.description?.toLowerCase().includes(lowercaseQuery) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const getDocumentsByTag = (tag: string) => {
    return documents.filter(doc => doc.tags?.includes(tag));
  };

  // Statistics
  const getStorageStatistics = () => {
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    
    const byType: { [key: string]: number } = {};
    const byCategory: { [key: string]: number } = {};
    
    documents.forEach(doc => {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    });
    
    return {
      totalDocuments,
      totalSize,
      byType,
      byCategory
    };
  };

  // File Operations
  const downloadDocument = async (documentId: string) => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        // Simulate download
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.originalName;
        link.click();
      }
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const previewDocument = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      // Open document in new tab for preview
      window.open(doc.url, '_blank');
    }
  };

  return {
    // Documents
    documents,
    uploadDocument,
    deleteDocument,
    updateDocument,
    
    // Categories
    categories,
    getDocumentsByCategory,
    getDocumentsByType,
    
    // Search and Filter
    searchDocuments,
    getDocumentsByTag,
    
    // Statistics
    getStorageStatistics,
    
    // File Operations
    downloadDocument,
    previewDocument,
    
    // Loading and Error States
    isLoading,
    isUploading,
    error
  };
}
