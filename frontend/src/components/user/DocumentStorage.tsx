'use client';

import React, { useState, useRef } from 'react';
import { useDocumentStorage, Document } from '@/hooks/useDocumentStorage';

export function DocumentStorage() {
  const {
    documents,
    uploadDocument,
    deleteDocument,
    updateDocument,
    categories,
    getDocumentsByCategory,
    getDocumentsByType,
    searchDocuments,
    getStorageStatistics,
    downloadDocument,
    previewDocument,
    isLoading,
    isUploading,
    error
  } = useDocumentStorage();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    type: 'other' as Document['type'],
    category: 'other',
    description: '',
    tags: '',
    isPublic: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: 'contract', label: 'Contract', icon: '📄' },
    { value: 'receipt', label: 'Receipt', icon: '🧾' },
    { value: 'photo', label: 'Photo', icon: '📸' },
    { value: 'invitation', label: 'Invitation', icon: '💌' },
    { value: 'other', label: 'Other', icon: '📁' }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      await uploadDocument(file, {
        type: uploadFormData.type,
        category: uploadFormData.category,
        description: uploadFormData.description,
        tags: uploadFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPublic: uploadFormData.isPublic
      });

      // Reset form
      setUploadFormData({
        type: 'other',
        category: 'other',
        description: '',
        tags: '',
        isPublic: false
      });
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setUploadFormData({
      type: document.type,
      category: document.category,
      description: document.description || '',
      tags: document.tags?.join(', ') || '',
      isPublic: document.isPublic
    });
  };

  const handleUpdateDocument = async () => {
    if (!editingDocument) return;

    try {
      await updateDocument(editingDocument.id, {
        type: uploadFormData.type,
        category: uploadFormData.category,
        description: uploadFormData.description,
        tags: uploadFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPublic: uploadFormData.isPublic
      });

      setEditingDocument(null);
      setUploadFormData({
        type: 'other',
        category: 'other',
        description: '',
        tags: '',
        isPublic: false
      });
    } catch (err) {
      console.error('Error updating document:', err);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(documentId);
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const categoryMatch = activeCategory === 'all' || doc.category === activeCategory;
    const typeMatch = activeType === 'all' || doc.type === activeType;
    const searchMatch = searchQuery === '' || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && typeMatch && searchMatch;
  });

  const statistics = getStorageStatistics();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Storage</h2>
            <p className="text-gray-600">
              Securely store and organize your wedding documents, contracts, and photos.
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="btn-primary btn-lg"
          >
            {showUploadForm ? 'Cancel' : 'Upload Document'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">📁</div>
          <h3 className="font-semibold text-gray-900">Total Documents</h3>
          <p className="text-2xl font-bold text-primary-600">{statistics.totalDocuments}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">💾</div>
          <h3 className="font-semibold text-gray-900">Storage Used</h3>
          <p className="text-2xl font-bold text-blue-600">{formatFileSize(statistics.totalSize)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">📄</div>
          <h3 className="font-semibold text-gray-900">Contracts</h3>
          <p className="text-2xl font-bold text-green-600">{statistics.byType.contract || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">📸</div>
          <h3 className="font-semibold text-gray-900">Photos</h3>
          <p className="text-2xl font-bold text-purple-600">{statistics.byType.photo || 0}</p>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingDocument ? 'Edit Document' : 'Upload New Document'}
          </h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {!editingDocument && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="input w-full"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, XLSX (Max 10MB)
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={uploadFormData.type}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, type: e.target.value as Document['type'] })}
                  className="input w-full"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={uploadFormData.category}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, category: e.target.value })}
                  className="input w-full"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={uploadFormData.description}
                onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                className="input w-full h-20"
                placeholder="Describe this document..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={uploadFormData.tags}
                onChange={(e) => setUploadFormData({ ...uploadFormData, tags: e.target.value })}
                className="input w-full"
                placeholder="Enter tags separated by commas (e.g., venue, contract, 2024)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={uploadFormData.isPublic}
                onChange={(e) => setUploadFormData({ ...uploadFormData, isPublic: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm font-medium text-gray-700">
                Make this document public (visible to vendors)
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setEditingDocument(null);
                }}
                className="btn-outline btn-lg"
              >
                Cancel
              </button>
              {editingDocument && (
                <button
                  onClick={handleUpdateDocument}
                  disabled={isLoading}
                  className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating...' : 'Update Document'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Documents</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={activeType}
              onChange={(e) => setActiveType(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Types</option>
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
              placeholder="Search documents..."
            />
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Documents ({filteredDocuments.length})
        </h3>

        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm mb-6">
            Uploading document... Please wait.
          </div>
        )}

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-600">No documents found for the selected filters.</p>
            <p className="text-gray-500 text-sm">Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => {
              const category = categories.find(c => c.id === document.category);
              const type = documentTypes.find(t => t.value === document.type);
              
              return (
                <div key={document.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">{type?.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{document.originalName}</h4>
                        <p className="text-sm text-gray-600">{formatFileSize(document.fileSize)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditDocument(document)}
                        className="btn-outline btn-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="btn-outline btn-xs text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {document.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{document.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    {category && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                        {category.icon} {category.name}
                      </span>
                    )}
                    {document.tags && document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {document.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                        {document.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            +{document.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Uploaded {formatDate(document.uploadedAt)}</span>
                    {document.isPublic && (
                      <span className="text-green-600">Public</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => previewDocument(document.id)}
                      className="btn-outline btn-sm flex-1"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => downloadDocument(document.id)}
                      className="btn-primary btn-sm flex-1"
                    >
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
