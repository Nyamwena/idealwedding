'use client';

import { useState, useEffect } from 'react';

// Seating Chart Interfaces
export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  dietaryNeeds?: string;
  plusOne: boolean;
  plusOneName?: string;
  tableId?: string;
  seatNumber?: number;
  specialRequirements?: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  x: number;
  y: number;
  shape: 'round' | 'rectangle' | 'square';
  guests: Guest[];
  specialNotes?: string;
}

export interface SeatingChart {
  id: string;
  name: string;
  venue: string;
  totalGuests: number;
  totalTables: number;
  tables: Table[];
  createdAt: string;
  lastModified: string;
  notes?: string;
}

interface UseSeatingChartReturn {
  // Seating Chart
  seatingChart: SeatingChart | null;
  createSeatingChart: (name: string, venue: string) => Promise<void>;
  updateSeatingChart: (updates: Partial<SeatingChart>) => Promise<void>;
  
  // Tables
  addTable: (table: Omit<Table, 'id' | 'guests'>) => Promise<void>;
  updateTable: (tableId: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  moveTable: (tableId: string, x: number, y: number) => Promise<void>;
  duplicateTable: (tableId: string) => Promise<void>;
  renameTable: (tableId: string, newName: string) => Promise<void>;
  
  // Guests
  assignGuestToTable: (guestId: string, tableId: string, seatNumber?: number) => Promise<void>;
  unassignGuestFromTable: (guestId: string) => Promise<void>;
  moveGuestBetweenTables: (guestId: string, fromTableId: string, toTableId: string, seatNumber?: number) => Promise<void>;
  
  // Guest Management
  availableGuests: Guest[];
  getGuestsByTable: (tableId: string) => Guest[];
  getUnassignedGuests: () => Guest[];
  
  // Analytics
  getSeatingStatistics: () => {
    totalGuests: number;
    assignedGuests: number;
    unassignedGuests: number;
    totalTables: number;
    averageGuestsPerTable: number;
    tableUtilization: { [tableId: string]: number };
  };
  
  // Export
  exportSeatingChart: () => void;
  
  // Loading and Error States
  isLoading: boolean;
  error: string | null;
}

export function useSeatingChart(): UseSeatingChartReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatingChart, setSeatingChart] = useState<SeatingChart | null>(null);
  const [availableGuests, setAvailableGuests] = useState<Guest[]>([]);

  // Load seating chart and guests on mount
  useEffect(() => {
    loadSeatingChart();
    loadAvailableGuests();
  }, []);

  const loadSeatingChart = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock seating chart
      const mockSeatingChart: SeatingChart = {
        id: '1',
        name: 'Wedding Reception Seating',
        venue: 'Garden Venue',
        totalGuests: 150,
        totalTables: 15,
        tables: [
          {
            id: 'table1',
            name: 'Head Table',
            capacity: 8,
            x: 100,
            y: 50,
            shape: 'rectangle',
            guests: [],
            specialNotes: 'Bridal party and immediate family'
          },
          {
            id: 'table2',
            name: 'Table 1',
            capacity: 10,
            x: 200,
            y: 150,
            shape: 'round',
            guests: []
          },
          {
            id: 'table3',
            name: 'Table 2',
            capacity: 10,
            x: 350,
            y: 150,
            shape: 'round',
            guests: []
          },
          {
            id: 'table4',
            name: 'Table 3',
            capacity: 10,
            x: 500,
            y: 150,
            shape: 'round',
            guests: []
          }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z',
        notes: 'Wedding reception seating arrangement'
      };
      
      setSeatingChart(mockSeatingChart);
      
    } catch (err) {
      setError('Failed to load seating chart');
      console.error('Error loading seating chart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableGuests = async () => {
    try {
      // Mock guest data
      const mockGuests: Guest[] = [
        {
          id: 'guest1',
          name: 'John Smith',
          email: 'john@example.com',
          relationship: 'Groom\'s Father',
          rsvpStatus: 'attending',
          dietaryNeeds: 'Vegetarian',
          plusOne: false,
          specialRequirements: 'Wheelchair accessible'
        },
        {
          id: 'guest2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          relationship: 'Bride\'s Sister',
          rsvpStatus: 'attending',
          dietaryNeeds: 'Gluten-free',
          plusOne: true,
          plusOneName: 'Mike Johnson'
        },
        {
          id: 'guest3',
          name: 'David Wilson',
          email: 'david@example.com',
          relationship: 'Friend',
          rsvpStatus: 'attending',
          plusOne: false
        },
        {
          id: 'guest4',
          name: 'Emily Brown',
          email: 'emily@example.com',
          relationship: 'Bride\'s Cousin',
          rsvpStatus: 'attending',
          dietaryNeeds: 'Vegan',
          plusOne: false
        },
        {
          id: 'guest5',
          name: 'Michael Davis',
          email: 'michael@example.com',
          relationship: 'Groom\'s Best Friend',
          rsvpStatus: 'attending',
          plusOne: true,
          plusOneName: 'Lisa Davis'
        }
      ];
      
      setAvailableGuests(mockGuests);
      
    } catch (err) {
      console.error('Error loading guests:', err);
    }
  };

  // Seating Chart Management
  const createSeatingChart = async (name: string, venue: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newSeatingChart: SeatingChart = {
        id: Date.now().toString(),
        name,
        venue,
        totalGuests: availableGuests.filter(g => g.rsvpStatus === 'attending').length,
        totalTables: 0,
        tables: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      setSeatingChart(newSeatingChart);
    } catch (err) {
      setError('Failed to create seating chart');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSeatingChart = async (updates: Partial<SeatingChart>) => {
    if (!seatingChart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSeatingChart(prev => prev ? {
        ...prev,
        ...updates,
        lastModified: new Date().toISOString()
      } : null);
    } catch (err) {
      setError('Failed to update seating chart');
    } finally {
      setIsLoading(false);
    }
  };

  // Table Management
  const addTable = async (table: Omit<Table, 'id' | 'guests'>) => {
    if (!seatingChart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTable: Table = {
        ...table,
        id: Date.now().toString(),
        guests: []
      };
      setSeatingChart(prev => prev ? {
        ...prev,
        tables: [...prev.tables, newTable],
        totalTables: prev.totalTables + 1,
        lastModified: new Date().toISOString()
      } : null);
    } catch (err) {
      setError('Failed to add table');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTable = async (tableId: string, updates: Partial<Table>) => {
    if (!seatingChart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSeatingChart(prev => prev ? {
        ...prev,
        tables: prev.tables.map(table => 
          table.id === tableId ? { ...table, ...updates } : table
        ),
        lastModified: new Date().toISOString()
      } : null);
    } catch (err) {
      setError('Failed to update table');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!seatingChart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Unassign all guests from this table
      const table = seatingChart.tables.find(t => t.id === tableId);
      if (table) {
        table.guests.forEach(guest => {
          const guestIndex = availableGuests.findIndex(g => g.id === guest.id);
          if (guestIndex !== -1) {
            availableGuests[guestIndex].tableId = undefined;
            availableGuests[guestIndex].seatNumber = undefined;
          }
        });
      }
      
      setSeatingChart(prev => prev ? {
        ...prev,
        tables: prev.tables.filter(table => table.id !== tableId),
        totalTables: prev.totalTables - 1,
        lastModified: new Date().toISOString()
      } : null);
    } catch (err) {
      setError('Failed to delete table');
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateTable = async (tableId: string) => {
    if (!seatingChart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const originalTable = seatingChart.tables.find(t => t.id === tableId);
      if (!originalTable) return;
      
      const newTable: Table = {
        ...originalTable,
        id: Date.now().toString(),
        name: `${originalTable.name} (Copy)`,
        x: originalTable.x + 50, // Offset position slightly
        y: originalTable.y + 50,
        guests: [] // Don't duplicate guests
      };
      
      setSeatingChart(prev => prev ? {
        ...prev,
        tables: [...prev.tables, newTable],
        totalTables: prev.totalTables + 1,
        lastModified: new Date().toISOString()
      } : null);
    } catch (err) {
      setError('Failed to duplicate table');
    } finally {
      setIsLoading(false);
    }
  };

  const renameTable = async (tableId: string, newName: string) => {
    if (!seatingChart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await updateTable(tableId, { name: newName });
    } catch (err) {
      setError('Failed to rename table');
    } finally {
      setIsLoading(false);
    }
  };

  const moveTable = async (tableId: string, x: number, y: number) => {
    if (!seatingChart) return;
    
    try {
      // Check for collisions with other tables
      const currentTable = seatingChart.tables.find(t => t.id === tableId);
      if (!currentTable) return;
      
      const otherTables = seatingChart.tables.filter(t => t.id !== tableId);
      const tableWidth = 120; // Approximate table width
      const tableHeight = 80; // Approximate table height
      
      // Simple collision detection
      const hasCollision = otherTables.some(table => {
        const distance = Math.sqrt(Math.pow(x - table.x, 2) + Math.pow(y - table.y, 2));
        return distance < Math.max(tableWidth, tableHeight) * 0.8; // 80% overlap threshold
      });
      
      if (hasCollision) {
        // Allow slight overlap but warn user
        console.log('Tables are overlapping - this is allowed for intentional stacking');
      }
      
      await updateTable(tableId, { x, y });
    } catch (err) {
      setError('Failed to move table');
    }
  };

  // Guest Management
  const assignGuestToTable = async (guestId: string, tableId: string, seatNumber?: number) => {
    if (!seatingChart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find guest and table
      const guest = availableGuests.find(g => g.id === guestId);
      const table = seatingChart.tables.find(t => t.id === tableId);
      
      if (!guest || !table) return;
      
      // Check if table has capacity
      if (table.guests.length >= table.capacity) {
        setError('Table is at full capacity');
        return;
      }
      
      // Unassign from previous table if assigned
      if (guest.tableId) {
        const previousTable = seatingChart.tables.find(t => t.id === guest.tableId);
        if (previousTable) {
          previousTable.guests = previousTable.guests.filter(g => g.id !== guestId);
        }
      }
      
      // Assign to new table
      guest.tableId = tableId;
      guest.seatNumber = seatNumber;
      table.guests.push(guest);
      
      setSeatingChart(prev => prev ? {
        ...prev,
        lastModified: new Date().toISOString()
      } : null);
      
    } catch (err) {
      setError('Failed to assign guest to table');
    } finally {
      setIsLoading(false);
    }
  };

  const unassignGuestFromTable = async (guestId: string) => {
    if (!seatingChart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const guest = availableGuests.find(g => g.id === guestId);
      if (!guest || !guest.tableId) return;
      
      // Remove from table
      const table = seatingChart.tables.find(t => t.id === guest.tableId);
      if (table) {
        table.guests = table.guests.filter(g => g.id !== guestId);
      }
      
      // Clear guest assignment
      guest.tableId = undefined;
      guest.seatNumber = undefined;
      
      setSeatingChart(prev => prev ? {
        ...prev,
        lastModified: new Date().toISOString()
      } : null);
      
    } catch (err) {
      setError('Failed to unassign guest from table');
    } finally {
      setIsLoading(false);
    }
  };

  const moveGuestBetweenTables = async (guestId: string, fromTableId: string, toTableId: string, seatNumber?: number) => {
    await unassignGuestFromTable(guestId);
    await assignGuestToTable(guestId, toTableId, seatNumber);
  };

  // Helper Functions
  const getGuestsByTable = (tableId: string) => {
    const table = seatingChart?.tables.find(t => t.id === tableId);
    return table ? table.guests : [];
  };

  const getUnassignedGuests = () => {
    return availableGuests.filter(guest => !guest.tableId && guest.rsvpStatus === 'attending');
  };

  const getSeatingStatistics = () => {
    if (!seatingChart) {
      return {
        totalGuests: 0,
        assignedGuests: 0,
        unassignedGuests: 0,
        totalTables: 0,
        averageGuestsPerTable: 0,
        tableUtilization: {}
      };
    }

    const attendingGuests = availableGuests.filter(g => g.rsvpStatus === 'attending');
    const assignedGuests = attendingGuests.filter(g => g.tableId);
    const unassignedGuests = attendingGuests.filter(g => !g.tableId);
    
    const tableUtilization: { [tableId: string]: number } = {};
    seatingChart.tables.forEach(table => {
      tableUtilization[table.id] = (table.guests.length / table.capacity) * 100;
    });

    return {
      totalGuests: attendingGuests.length,
      assignedGuests: assignedGuests.length,
      unassignedGuests: unassignedGuests.length,
      totalTables: seatingChart.totalTables,
      averageGuestsPerTable: seatingChart.totalTables > 0 ? assignedGuests.length / seatingChart.totalTables : 0,
      tableUtilization
    };
  };

  const exportSeatingChart = () => {
    if (!seatingChart) return;
    
    // Create PDF export data
    const exportData = {
      chartName: seatingChart.name,
      venue: seatingChart.venue,
      tables: seatingChart.tables.map(table => ({
        name: table.name,
        capacity: table.capacity,
        guests: table.guests.map(guest => ({
          name: guest.name,
          plusOne: guest.plusOne ? ` + ${guest.plusOneName}` : '',
          dietaryNeeds: guest.dietaryNeeds || '',
          specialRequirements: guest.specialRequirements || ''
        }))
      }))
    };
    
    // Simulate PDF generation
    console.log('Exporting seating chart:', exportData);
    alert('Seating chart exported successfully! (This would generate a PDF in a real implementation)');
  };

  return {
    // Seating Chart
    seatingChart,
    createSeatingChart,
    updateSeatingChart,
    
    // Tables
    addTable,
    updateTable,
    deleteTable,
    moveTable,
    duplicateTable,
    renameTable,
    
    // Guests
    assignGuestToTable,
    unassignGuestFromTable,
    moveGuestBetweenTables,
    
    // Guest Management
    availableGuests,
    getGuestsByTable,
    getUnassignedGuests,
    
    // Analytics
    getSeatingStatistics,
    
    // Export
    exportSeatingChart,
    
    // Loading and Error States
    isLoading,
    error
  };
}
