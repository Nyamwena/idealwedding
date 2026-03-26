'use client';

import React, { useState } from 'react';
import { useSeatingChart, Table, Guest } from '@/hooks/useSeatingChart';

export function SeatingChartPlanner() {
  const {
    seatingChart,
    createSeatingChart,
    updateSeatingChart,
    addTable,
    updateTable,
    deleteTable,
    moveTable,
    duplicateTable,
    renameTable,
    assignGuestToTable,
    unassignGuestFromTable,
    availableGuests,
    getGuestsByTable,
    getUnassignedGuests,
    getSeatingStatistics,
    exportSeatingChart,
    isLoading,
    error
  } = useSeatingChart();

  const [showAddTableForm, setShowAddTableForm] = useState(false);
  const [showGuestList, setShowGuestList] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState<string | null>(null);
  const [newTableForm, setNewTableForm] = useState({
    name: '',
    capacity: 8,
    shape: 'round' as Table['shape'],
    x: 100,
    y: 100
  });

  const tableShapes = [
    { value: 'round', label: 'Round', icon: '⭕' },
    { value: 'rectangle', label: 'Rectangle', icon: '⬜' },
    { value: 'square', label: 'Square', icon: '⬛' }
  ];

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTableForm.name) return;

    try {
      await addTable({
        name: newTableForm.name,
        capacity: newTableForm.capacity,
        x: newTableForm.x,
        y: newTableForm.y,
        shape: newTableForm.shape
      });

      setNewTableForm({
        name: '',
        capacity: 8,
        shape: 'round',
        x: 100,
        y: 100
      });
      setShowAddTableForm(false);
    } catch (err) {
      console.error('Error adding table:', err);
    }
  };

  const handleAssignGuest = async (guestId: string, tableId: string) => {
    try {
      await assignGuestToTable(guestId, tableId);
    } catch (err) {
      console.error('Error assigning guest:', err);
    }
  };

  const handleUnassignGuest = async (guestId: string) => {
    try {
      await unassignGuestFromTable(guestId);
    } catch (err) {
      console.error('Error unassigning guest:', err);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (confirm('Are you sure you want to delete this table? All assigned guests will be unassigned.')) {
      try {
        await deleteTable(tableId);
        setSelectedTable(null);
        setShowTableMenu(null);
      } catch (err) {
        console.error('Error deleting table:', err);
      }
    }
  };

  const handleDuplicateTable = async (tableId: string) => {
    try {
      await duplicateTable(tableId);
      setShowTableMenu(null);
    } catch (err) {
      console.error('Error duplicating table:', err);
    }
  };

  const handleRenameTable = async (tableId: string, newName: string) => {
    if (newName.trim()) {
      try {
        await renameTable(tableId, newName.trim());
        setEditingTableName(null);
      } catch (err) {
        console.error('Error renaming table:', err);
      }
    }
  };

  const handleDragStart = (guest: Guest) => {
    setDraggedGuest(guest);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    
    if (draggedGuest) {
      await handleAssignGuest(draggedGuest.id, tableId);
      setDraggedGuest(null);
    }
  };

  // Table drag and drop handlers
  const handleTableDragStart = (e: React.DragEvent, table: Table) => {
    setDraggedTable(table);
    setIsDraggingTable(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', table.id);
  };

  const handleTableDragEnd = () => {
    setDraggedTable(null);
    setIsDraggingTable(false);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedTable) {
      const canvas = e.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - 60; // Offset for table center
      const y = e.clientY - rect.top - 40;
      
      // Ensure position is within canvas bounds
      const boundedX = Math.max(0, Math.min(x, rect.width - 120));
      const boundedY = Math.max(0, Math.min(y, rect.height - 80));
      
      await moveTable(draggedTable.id, boundedX, boundedY);
      setDraggedTable(null);
      setIsDraggingTable(false);
    }
  };

  const getTableColor = (table: Table) => {
    const utilization = (table.guests.length / table.capacity) * 100;
    if (utilization >= 100) return 'bg-red-100 border-red-300';
    if (utilization >= 80) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const statistics = getSeatingStatistics();
  const unassignedGuests = getUnassignedGuests();

  // Close menus when clicking outside
  const handleCanvasClick = () => {
    setShowTableMenu(null);
    setSelectedTable(null);
  };

  if (!seatingChart) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">🪑</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Seating Chart Planner</h2>
          <p className="text-gray-600 mb-6">
            Create a visual seating arrangement for your wedding reception.
          </p>
          <button
            onClick={() => createSeatingChart('Wedding Reception Seating', 'Garden Venue')}
            className="btn-primary btn-lg"
          >
            Create Seating Chart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seating Chart Planner</h2>
            <p className="text-gray-600">
              Design your wedding reception seating arrangement with drag-and-drop functionality.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowGuestList(!showGuestList)}
              className="btn-outline btn-sm"
            >
              {showGuestList ? 'Hide' : 'Show'} Guest List
            </button>
            <button
              onClick={() => setShowAddTableForm(!showAddTableForm)}
              className="btn-outline btn-sm"
            >
              Add Table
            </button>
            <button
              onClick={exportSeatingChart}
              className="btn-primary btn-sm"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-semibold text-gray-900">Total Guests</h3>
          <p className="text-2xl font-bold text-primary-600">{statistics.totalGuests}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold text-gray-900">Assigned</h3>
          <p className="text-2xl font-bold text-green-600">{statistics.assignedGuests}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <h3 className="font-semibold text-gray-900">Unassigned</h3>
          <p className="text-2xl font-bold text-yellow-600">{statistics.unassignedGuests}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">🪑</div>
          <h3 className="font-semibold text-gray-900">Tables</h3>
          <p className="text-2xl font-bold text-blue-600">{statistics.totalTables}</p>
        </div>
      </div>

      {/* Add Table Form */}
      {showAddTableForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Table</h3>
          
          <form onSubmit={handleAddTable} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Table Name *
                </label>
                <input
                  type="text"
                  value={newTableForm.name}
                  onChange={(e) => setNewTableForm({ ...newTableForm, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Table 1, Head Table"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  value={newTableForm.capacity}
                  onChange={(e) => setNewTableForm({ ...newTableForm, capacity: parseInt(e.target.value) })}
                  className="input w-full"
                  min="2"
                  max="20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shape
                </label>
                <select
                  value={newTableForm.shape}
                  onChange={(e) => setNewTableForm({ ...newTableForm, shape: e.target.value as Table['shape'] })}
                  className="input w-full"
                >
                  {tableShapes.map((shape) => (
                    <option key={shape.value} value={shape.value}>{shape.icon} {shape.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position (X, Y)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={newTableForm.x}
                    onChange={(e) => setNewTableForm({ ...newTableForm, x: parseInt(e.target.value) })}
                    className="input flex-1"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={newTableForm.y}
                    onChange={(e) => setNewTableForm({ ...newTableForm, y: parseInt(e.target.value) })}
                    className="input flex-1"
                    placeholder="Y"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowAddTableForm(false)}
                className="btn-outline btn-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding...' : 'Add Table'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Seating Chart Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Seating Chart Layout</h3>
            
            <div 
              className="relative bg-gray-50 rounded-xl h-96 overflow-auto border-2 border-dashed border-gray-300"
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
              onClick={handleCanvasClick}
            >
              {seatingChart.tables.map((table) => (
                <div
                  key={table.id}
                  className={`absolute border-2 rounded-lg p-3 cursor-move transition-all duration-200 ${
                    getTableColor(table)
                  } ${
                    isDraggingTable && draggedTable?.id === table.id 
                      ? 'opacity-50 scale-105 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  style={{
                    left: `${table.x}px`,
                    top: `${table.y}px`,
                    minWidth: '120px',
                    minHeight: '80px'
                  }}
                  draggable
                  onDragStart={(e) => handleTableDragStart(e, table)}
                  onDragEnd={handleTableDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, table.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTable(selectedTable === table.id ? null : table.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowTableMenu(showTableMenu === table.id ? null : table.id);
                  }}
                >
                  <div className="text-center relative">
                    {/* Table Menu Button */}
                    <button
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 text-white rounded-full text-xs hover:bg-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTableMenu(showTableMenu === table.id ? null : table.id);
                      }}
                    >
                      ⋯
                    </button>
                    
                    {/* Table Name */}
                    {editingTableName === table.id ? (
                      <input
                        type="text"
                        defaultValue={table.name}
                        className="w-full text-center font-semibold text-sm bg-white border rounded px-1"
                        onBlur={(e) => handleRenameTable(table.id, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameTable(table.id, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h4 
                        className="font-semibold text-sm mb-1 cursor-pointer hover:text-blue-600"
                        onDoubleClick={() => setEditingTableName(table.id)}
                      >
                        {table.name}
                      </h4>
                    )}
                    
                    <p className="text-xs text-gray-600">
                      {table.guests.length}/{table.capacity} guests
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {tableShapes.find(s => s.value === table.shape)?.icon} {table.shape}
                    </div>
                  </div>
                  
                  {/* Table Context Menu */}
                  {showTableMenu === table.id && (
                    <div className="absolute top-8 right-0 bg-white border rounded-lg shadow-lg z-10 min-w-32">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b"
                        onClick={() => {
                          setEditingTableName(table.id);
                          setShowTableMenu(null);
                        }}
                      >
                        ✏️ Rename
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b"
                        onClick={() => handleDuplicateTable(table.id)}
                      >
                        📋 Duplicate
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                        onClick={() => handleDeleteTable(table.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                  
                  {selectedTable === table.id && (
                    <div className="mt-2 space-y-1">
                      {table.guests.map((guest, index) => (
                        <div
                          key={guest.id}
                          className="text-xs bg-white rounded px-2 py-1 border cursor-move hover:bg-blue-50"
                          draggable
                          onDragStart={() => handleDragStart(guest)}
                        >
                          {guest.name}
                          {guest.plusOne && guest.plusOneName && ` + ${guest.plusOneName}`}
                        </div>
                      ))}
                      {table.guests.length < table.capacity && (
                        <div className="text-xs text-gray-400 italic">
                          {table.capacity - table.guests.length} seats available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {seatingChart.tables.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🪑</div>
                    <p className="text-gray-600">No tables added yet</p>
                    <p className="text-gray-500 text-sm">Click "Add Table" to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Guest List Sidebar */}
        <div className="lg:col-span-1">
          {showGuestList && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest List</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Unassigned Guests ({unassignedGuests.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {unassignedGuests.map((guest) => (
                      <div
                        key={guest.id}
                        className="p-2 bg-gray-50 rounded-lg cursor-move border"
                        draggable
                        onDragStart={() => handleDragStart(guest)}
                      >
                        <div className="text-sm font-medium">{guest.name}</div>
                        {guest.plusOne && guest.plusOneName && (
                          <div className="text-xs text-gray-600">+ {guest.plusOneName}</div>
                        )}
                        {guest.dietaryNeeds && (
                          <div className="text-xs text-orange-600">🍽️ {guest.dietaryNeeds}</div>
                        )}
                        {guest.specialRequirements && (
                          <div className="text-xs text-blue-600">⚠️ {guest.specialRequirements}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Assigned Guests</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {seatingChart.tables.map((table) => (
                      <div key={table.id} className="border rounded-lg p-2">
                        <div className="text-sm font-medium text-gray-900 mb-1">{table.name}</div>
                        {table.guests.map((guest) => (
                          <div
                            key={guest.id}
                            className="text-xs bg-white rounded px-2 py-1 mb-1 border cursor-pointer hover:bg-red-50"
                            onClick={() => handleUnassignGuest(guest.id)}
                          >
                            {guest.name}
                            {guest.plusOne && guest.plusOneName && ` + ${guest.plusOneName}`}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Details */}
      {selectedTable && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Details</h3>
          {(() => {
            const table = seatingChart.tables.find(t => t.id === selectedTable);
            if (!table) return null;
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Table Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {table.name}</div>
                    <div><span className="font-medium">Capacity:</span> {table.capacity}</div>
                    <div><span className="font-medium">Shape:</span> {table.shape}</div>
                    <div><span className="font-medium">Position:</span> ({table.x}, {table.y})</div>
                    <div><span className="font-medium">Guests:</span> {table.guests.length}/{table.capacity}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Assigned Guests</h4>
                  <div className="space-y-2">
                    {table.guests.map((guest) => (
                      <div key={guest.id} className="p-2 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium">{guest.name}</div>
                        {guest.plusOne && guest.plusOneName && (
                          <div className="text-xs text-gray-600">+ {guest.plusOneName}</div>
                        )}
                        {guest.dietaryNeeds && (
                          <div className="text-xs text-orange-600">🍽️ {guest.dietaryNeeds}</div>
                        )}
                        {guest.specialRequirements && (
                          <div className="text-xs text-blue-600">⚠️ {guest.specialRequirements}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start">
          <div className="text-blue-500 mr-3 mt-1">💡</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">How to Use the Seating Chart</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Drag tables</strong> to reposition them on the canvas</li>
              <li>• <strong>Right-click or click ⋯</strong> on tables to rename, duplicate, or delete</li>
              <li>• <strong>Double-click table names</strong> to rename them quickly</li>
              <li>• Drag unassigned guests from the guest list to tables</li>
              <li>• Click on tables to view assigned guests</li>
              <li>• Click on assigned guests to remove them from tables</li>
              <li>• Add new tables using the "Add Table" button</li>
              <li>• Export your final seating chart as a PDF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
